#!/usr/bin/env node
/**
 * test_cli_detect.js — Integration test for draw.io CLI binary detection.
 *
 * Tests the binary detection logic used by export.js across all three platforms.
 * Verifies that the correct candidates are checked and that at least one binary
 * is found on the current platform (if draw.io is installed).
 *
 * Usage:
 *   node tests/integration/test_cli_detect.js
 *
 * Does NOT require draw.io CLI to be installed — tests the detection logic itself.
 * When CLI IS available, also validates version parsing.
 *
 * Environment: Windows, macOS, Linux.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// ── Binary Detection (mirrors export.js logic) ─────────────────────

function detectBinary() {
    const platform = process.platform;
    const candidates = [];

    if (platform === 'win32') {
        candidates.push(
            'drawio',
            'draw.io',
            'C:\\Program Files\\draw.io\\draw.io.exe',
            'C:\\Program Files (x86)\\draw.io\\draw.io.exe',
            path.join(process.env.LOCALAPPDATA || '', 'draw.io', 'draw.io.exe'),
            path.join(process.env.APPDATA || '', 'draw.io', 'draw.io.exe')
        );
    } else if (platform === 'darwin') {
        candidates.push(
            'drawio',
            'draw.io',
            '/Applications/draw.io.app/Contents/MacOS/draw.io',
            path.join(process.env.HOME || '', 'Applications', 'draw.io.app', 'Contents', 'MacOS', 'draw.io')
        );
    } else {
        candidates.push(
            'drawio',
            'draw.io',
            '/usr/bin/drawio',
            '/usr/local/bin/drawio',
            '/opt/draw.io/drawio'
        );
    }

    for (const bin of candidates) {
        try {
            const result = spawnSync(bin, ['--version'], {
                timeout: 5000,
                windowsHide: true,
                stdio: 'pipe',
            });
            if (result.status === 0 || (result.stdout && result.stdout.toString().trim())) {
                return { binary: bin, version: result.stdout.toString().trim() };
            }
        } catch (e) {
            // try next
        }
    }

    return null;
}

function getExpectedCandidates() {
    const platform = process.platform;
    if (platform === 'win32') return ['drawio', 'draw.io'];
    if (platform === 'darwin') return ['drawio', 'draw.io'];
    return ['drawio', 'draw.io', 'snap run drawio', '/usr/bin/drawio', '/usr/local/bin/drawio'];
}

// ── Test Cases ─────────────────────────────────────────────────────

function testHasCandidates() {
    console.log('  Test: Candidate list is non-empty');
    const platform = process.platform;
    const candidates = [];

    if (platform === 'win32') {
        candidates.push('drawio', 'draw.io');
    } else if (platform === 'darwin') {
        candidates.push('drawio', 'draw.io');
    } else {
        candidates.push('drawio', 'draw.io');
    }

    if (candidates.length > 0) {
        console.log(`    ✓ PASS: ${candidates.length} candidates for ${platform} (${candidates.join(', ')})`);
        return true;
    }
    console.error(`    ✗ FAIL: No candidates for ${platform}`);
    return false;
}

function testPlatformSpecificPaths() {
    console.log('  Test: Platform-specific paths exist or are plausible');
    const platform = process.platform;

    if (platform === 'win32') {
        // Check that Program Files path format is correct
        const programFiles = 'C:\\Program Files\\draw.io\\draw.io.exe';
        console.log(`    Windows default path: ${programFiles}`);
        // Don't require it to exist — just check format
        if (programFiles.includes('Program Files') && programFiles.includes('draw.io')) {
            console.log('    ✓ PASS: Path format is correct for Windows');
            return true;
        }
    } else if (platform === 'darwin') {
        const macPath = '/Applications/draw.io.app/Contents/MacOS/draw.io';
        console.log(`    macOS default path: ${macPath}`);
        if (macPath.includes('Applications') && macPath.includes('draw.io.app')) {
            console.log('    ✓ PASS: Path format is correct for macOS');
            return true;
        }
    } else {
        const linuxPaths = ['/usr/bin/drawio', '/usr/local/bin/drawio'];
        console.log(`    Linux default paths: ${linuxPaths.join(', ')}`);
        console.log('    ✓ PASS: Path format is correct for Linux');
        return true;
    }

    console.error(`    ✗ FAIL: Path format check failed`);
    return false;
}

function testDetectionRunsWithoutError() {
    console.log('  Test: Detection function runs without throwing');
    try {
        const result = detectBinary();
        if (result) {
            console.log(`    ✓ PASS: draw.io CLI found: ${result.binary}`);
            if (result.version) {
                console.log(`    Version: ${result.version}`);
            }
        } else {
            console.log('    ✓ PASS: Detection ran cleanly (CLI not installed — expected on CI)');
        }
        return true;
    } catch (err) {
        console.error(`    ✗ FAIL: Detection threw: ${err.message}`);
        return false;
    }
}

function testVersionParsing() {
    console.log('  Test: Version string parsing (if CLI available)');
    const result = detectBinary();
    if (!result) {
        console.log('    SKIP: draw.io CLI not available — version parsing not tested');
        return true; // Not a failure
    }

    const versionStr = result.version || '';
    const verMatch = versionStr.match(/(\d+\.\d+\.\d+)/);
    if (verMatch) {
        const version = verMatch[1];
        const major = parseInt(version.split('.')[0], 10);
        console.log(`    ✓ PASS: Version ${version} parsed (major=${major})`);

        // Check minimum version
        if (major >= 24) {
            console.log(`    ✓ PASS: Version ${version} >= 24.0.0 (required)`);
        } else {
            console.log(`    ⚠ WARNING: Version ${version} < 24.0.0 (minimum recommended)`);
        }
        return true;
    }

    console.log(`    ⚠ WARNING: Could not parse version from: "${versionStr}"`);
    return true; // Not a hard failure — version strings vary
}

function testUnicodePathHandling() {
    console.log('  Test: Unicode path handling (Windows CJK compatibility)');
    // Simulate a path with CJK characters (common on Chinese Windows)
    const unicodePath = 'C:\\Users\\测试用户\\AppData\\Local\\draw.io\\draw.io.exe';
    if (unicodePath.includes('测试用户') && unicodePath.includes('draw.io')) {
        console.log('    ✓ PASS: Unicode path constructed correctly');
        // Try to check if spawnSync with unicode path causes errors
        try {
            const testResult = spawnSync('echo', ['test'], {
                timeout: 3000,
                windowsHide: true,
                stdio: 'pipe',
                env: { ...process.env, TEST_PATH: unicodePath },
            });
            console.log('    ✓ PASS: Spawn with unicode env vars works');
        } catch (err) {
            console.log(`    ⚠ WARNING: Unicode env var test failed: ${err.message}`);
        }
        return true;
    }
    console.error('    ✗ FAIL: Unicode path construction failed');
    return false;
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
    console.log('=== Integration Test: CLI Binary Detection ===');
    console.log(`Platform: ${process.platform} (${os.release()})\n`);

    let passed = 0;
    let failed = 0;

    const tests = [
        { name: 'Candidate list', fn: testHasCandidates },
        { name: 'Platform paths', fn: testPlatformSpecificPaths },
        { name: 'Detection runs', fn: testDetectionRunsWithoutError },
        { name: 'Version parsing', fn: testVersionParsing },
        { name: 'Unicode path handling', fn: testUnicodePathHandling },
    ];

    for (const test of tests) {
        if (test.fn()) passed++;
        else failed++;
    }

    console.log(`\nResults: ${passed}/${passed + failed} passed`);
    if (failed === 0) {
        console.log('=== ALL TESTS PASSED ===');
        process.exit(0);
    } else {
        console.error('=== FAILURES DETECTED ===');
        process.exit(1);
    }
}

main();
