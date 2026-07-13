#!/usr/bin/env node
/**
 * mermaid-convert.js — Pipeline B: Mermaid → draw.io conversion utility.
 *
 * Detects draw.io CLI, checks version (≥ v30 required), and converts .mmd
 * files to .drawio. Used by SKILL.md Pipeline B workflow.
 *
 * Usage:
 *   node scripts/mermaid-convert.js <input.mmd> [--output <output.drawio>]
 *   node scripts/mermaid-convert.js --check                          # Check if Pipeline B is available
 *   node scripts/mermaid-convert.js --version                        # Show draw.io CLI version info
 *
 * Exit codes:
 *   0 — Conversion successful or check passed
 *   1 — CLI not found or version too old
 *   2 — Conversion failed
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// ── Binary Detection ──────────────────────────────────────────────

function detectDrawio() {
    const platform = process.platform;
    const candidates = [];

    if (platform === 'win32') {
        candidates.push(
            'drawio',
            'draw.io',
            'C:\\Program Files\\draw.io\\draw.io.exe',
            'C:\\Program Files (x86)\\draw.io\\draw.io.exe'
        );
    } else if (platform === 'darwin') {
        candidates.push(
            'drawio',
            'draw.io',
            '/Applications/draw.io.app/Contents/MacOS/draw.io'
        );
    } else {
        candidates.push('drawio', 'draw.io', '/usr/bin/drawio', '/usr/local/bin/drawio');
    }

    for (const bin of candidates) {
        try {
            const result = spawnSync(bin, ['--version'], {
                timeout: 15000, windowsHide: true, stdio: 'pipe'
            });
            // Accept stdout even on timeout — the CLI may output version before slow shutdown
            if (result.stdout) {
                const versionStr = result.stdout.toString().trim();
                const versionMatch = versionStr.match(/(\d+)\.(\d+)\.(\d+)/);
                if (versionMatch) {
                    return {
                        binary: bin,
                        version: versionStr,
                        major: parseInt(versionMatch[1]),
                        minor: parseInt(versionMatch[2]),
                        patch: parseInt(versionMatch[3]),
                    };
                }
            }
        } catch (e) { /* try next */ }
    }
    return null;
}

function supportsMermaid(drawioInfo) {
    return drawioInfo && drawioInfo.major >= 30;
}

// ── Conversion ────────────────────────────────────────────────────

function convertMermaid(inputPath, outputPath, drawioBinary) {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
    }

    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.mmd' && ext !== '.mermaid') {
        throw new Error(`Input must be .mmd or .mermaid file, got: ${ext}`);
    }

    const output = outputPath || inputPath.replace(/\.(mmd|mermaid)$/i, '.drawio');

    const args = ['-x', '-f', 'xml', '-o', output, inputPath];
    try {
        execSync(`"${drawioBinary}" ${args.join(' ')}`, {
            timeout: 30000,
            windowsHide: true,
            stdio: 'pipe',
        });
    } catch (e) {
        throw new Error(`Conversion failed: ${e.message}`);
    }

    // Clean up .mmd file after successful conversion
    if (fs.existsSync(output)) {
        return output;
    }
    throw new Error(`Conversion produced no output file: ${output}`);
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
    const args = process.argv.slice(2);

    // --check mode
    if (args.includes('--check')) {
        const info = detectDrawio();
        if (!info) {
            console.log('Pipeline B: UNAVAILABLE — draw.io CLI not found');
            process.exit(1);
        }
        if (!supportsMermaid(info)) {
            console.log(`Pipeline B: UNAVAILABLE — draw.io CLI ${info.version} (need ≥ v30)`);
            process.exit(1);
        }
        console.log(`Pipeline B: AVAILABLE — draw.io CLI ${info.version} at ${info.binary}`);
        process.exit(0);
    }

    // --version mode
    if (args.includes('--version')) {
        const info = detectDrawio();
        if (!info) {
            console.log('draw.io CLI: not found');
            process.exit(1);
        }
        console.log(`draw.io CLI: ${info.version} at ${info.binary}`);
        console.log(`Mermaid support: ${supportsMermaid(info) ? 'YES' : 'NO (need ≥ v30)'}`);
        process.exit(0);
    }

    // Conversion mode
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`Pipeline B — Mermaid to draw.io converter

Usage:
  node scripts/mermaid-convert.js <input.mmd> [--output <file.drawio>]
  node scripts/mermaid-convert.js --check
  node scripts/mermaid-convert.js --version

Requires: draw.io CLI ≥ v30
`);
        process.exit(0);
    }

    const inputFile = args[0];
    let outputFile = null;
    const outputIdx = args.indexOf('--output');
    if (outputIdx !== -1 && outputIdx + 1 < args.length) {
        outputFile = args[outputIdx + 1];
    }

    // Check CLI
    const info = detectDrawio();
    if (!info) {
        console.error('ERROR: draw.io CLI not found. Pipeline B unavailable.');
        console.error('Fall back to Pipeline C (hand-write XML).');
        process.exit(1);
    }
    if (!supportsMermaid(info)) {
        console.error(`ERROR: draw.io CLI ${info.version} < v30. Pipeline B unavailable.`);
        console.error('Fall back to Pipeline C (hand-write XML).');
        process.exit(1);
    }

    console.log(`draw.io CLI: ${info.version} (${info.binary})`);
    console.log(`Converting: ${inputFile}`);

    try {
        const result = convertMermaid(inputFile, outputFile, info.binary);
        console.log(`Output: ${result}`);
        console.log('✓ Conversion complete. Run validate.py on the output.');
    } catch (e) {
        console.error(`ERROR: ${e.message}`);
        process.exit(2);
    }
}

if (require.main === module) {
    main();
}

module.exports = { detectDrawio, supportsMermaid, convertMermaid };
