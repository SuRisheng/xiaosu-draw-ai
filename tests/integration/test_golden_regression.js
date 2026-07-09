#!/usr/bin/env node
/**
 * test_golden_regression.js — Golden set regression test.
 *
 * Copies golden .drawio files to a temp directory, runs validate.py on each,
 * and compares scores against the baseline stored in tests/golden/scores.json.
 *
 * Usage:
 *   node tests/integration/test_golden_regression.js           # Run all
 *   node tests/integration/test_golden_regression.js --update  # Update baseline
 *
 * Requires: Python 3 (for validate.py). draw.io CLI optional.
 *
 * Environment: Windows, macOS, Linux. Uses os.tmpdir() for temp files.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const os = require('os');

const ROOT = path.resolve(__dirname, '..', '..');
const GOLDEN_DIR = path.join(ROOT, 'tests', 'golden');
const SCORES_FILE = path.join(GOLDEN_DIR, 'scores.json');
const VALIDATE_SCRIPT = path.join(ROOT, 'skills', 'xiaosu-draw-ai', 'scripts', 'validate.py');

// ── Helpers ────────────────────────────────────────────────────────

function detectPython() {
    const candidates = ['python3', 'python'];
    for (const bin of candidates) {
        try {
            const result = spawnSync(bin, ['--version'], {
                timeout: 5000,
                windowsHide: true,
                stdio: 'pipe'
            });
            if (result.status === 0) {
                return bin;
            }
        } catch (e) {
            // try next
        }
    }
    return null;
}

function createTempDir() {
    const timestamp = Date.now();
    const tmpDir = path.join(os.tmpdir(), `xiaosu-draw-ai-golden-${timestamp}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
}

function cleanup(tmpDir) {
    if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

function runValidate(filepath, pythonBin) {
    try {
        const result = execSync(
            `"${pythonBin}" "${VALIDATE_SCRIPT}" --json --score "${filepath}"`,
            { encoding: 'utf-8', timeout: 15000, windowsHide: true }
        );
        try { return JSON.parse(result.trim()); } catch (_) { return null; }
    } catch (e) {
        if (e.stdout) {
            try { return JSON.parse(e.stdout.trim()); } catch (_) { return null; }
        }
        return null;
    }
}

function loadScores() {
    if (!fs.existsSync(SCORES_FILE)) {
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8'));
    } catch (e) {
        console.error('Warning: Could not parse scores.json, starting fresh.');
        return {};
    }
}

function saveScores(scores) {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2), 'utf-8');
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
    const isUpdate = process.argv.includes('--update');

    console.log('=== Golden Set Regression Test ===');
    console.log(`Mode: ${isUpdate ? 'Update Baseline' : 'Regression Check'}\n`);

    // Check Python 3
    const pythonBin = detectPython();
    if (!pythonBin) {
        console.error('ERROR: Python 3 not found (tried python3, python).');
        console.error('Skipping validate tests.');
        process.exit(1);
    }
    console.log(`Python: ${pythonBin}\n`);

    // Get golden files
    const goldenFiles = fs.readdirSync(GOLDEN_DIR)
        .filter(f => f.endsWith('.drawio'))
        .sort();

    if (goldenFiles.length === 0) {
        console.error('ERROR: No golden .drawio files found in tests/golden/');
        process.exit(1);
    }

    console.log(`Found ${goldenFiles.length} golden file(s): ${goldenFiles.join(', ')}\n`);

    // Load baseline scores
    const baselineScores = loadScores();
    const newScores = {};
    let allPassed = true;
    let totalTests = 0;
    let passedTests = 0;

    // Create temp directory
    const tmpDir = createTempDir();
    console.log(`Working in: ${tmpDir}\n`);

    try {
        // Copy golden files to temp
        for (const file of goldenFiles) {
            const src = path.join(GOLDEN_DIR, file);
            const dest = path.join(tmpDir, file);
            fs.copyFileSync(src, dest);
        }

        // Run validate on each golden file
        for (const file of goldenFiles) {
            const inputPath = path.join(tmpDir, file);
            console.log(`Testing: ${file}`);

            const result = runValidate(inputPath, pythonBin);
            if (!result) {
                console.error(`  ✗ FAIL: Could not parse validate.py output for ${file}`);
                allPassed = false;
                continue;
            }

            const errorCount = result.error_count || 0;
            const warningCount = result.warning_count || 0;
            const score = result.score !== undefined ? result.score : null;

            newScores[file] = {
                error_count: errorCount,
                warning_count: warningCount,
                score: score,
                timestamp: new Date().toISOString()
            };

            totalTests++;
            const baseline = baselineScores[file];

            console.log(`  Errors: ${errorCount}, Warnings: ${warningCount}, Score: ${score}`);

            // In --update mode: just record baseline, don't fail on non-zero
            if (isUpdate) {
                console.log('  (Baseline updated)');
            } else {
                // In check mode: compare against saved baseline
                let filePassed = true;

                if (!baseline) {
                    // No baseline yet — treat any non-zero as failure
                    if (errorCount !== 0) {
                        console.error(`  ✗ FAIL: Expected 0 errors, got ${errorCount}`);
                        filePassed = false;
                    }
                    if (warningCount !== 0) {
                        console.error(`  ✗ FAIL: Expected 0 warnings, got ${warningCount}`);
                        filePassed = false;
                    }
                    if (score !== 0) {
                        console.error(`  ✗ FAIL: Expected score 0, got ${score}`);
                        filePassed = false;
                    }
                } else {
                    // Compare against baseline — regression only
                    if (errorCount > baseline.error_count) {
                        console.error(`  ✗ REGRESSION: Errors ${baseline.error_count} → ${errorCount}`);
                        filePassed = false;
                    }
                    if (warningCount > baseline.warning_count) {
                        console.error(`  ✗ REGRESSION: Warnings ${baseline.warning_count} → ${warningCount}`);
                        filePassed = false;
                    }
                    if (score !== null && baseline.score !== null && score > baseline.score) {
                        console.error(`  ✗ REGRESSION: Score ${baseline.score} → ${score}`);
                        filePassed = false;
                    }
                    if (filePassed) {
                        // Check if improved
                        if (score !== null && baseline.score !== null && score < baseline.score) {
                            console.log(`  ✓ IMPROVED: Score ${baseline.score} → ${score}`);
                        } else {
                            console.log(`  ✓ MATCHES BASELINE`);
                        }
                    }
                }

                if (filePassed) {
                    passedTests++;
                } else {
                    allPassed = false;
                }
            }

            console.log();
        }

        // Save scores
        if (isUpdate || Object.keys(baselineScores).length === 0) {
            saveScores(newScores);
            console.log(`Scores saved to: ${SCORES_FILE}\n`);
        }

        // Report
        console.log(`Results: ${passedTests}/${totalTests} passed`);
        if (allPassed) {
            console.log('=== ALL TESTS PASSED ===');
            process.exit(0);
        } else {
            console.error('=== FAILURES DETECTED ===');
            process.exit(1);
        }
    } finally {
        cleanup(tmpDir);
        console.log('Cleaned up:', tmpDir);
    }
}

main();
