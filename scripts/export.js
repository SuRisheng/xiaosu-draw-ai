#!/usr/bin/env node
/**
 * export.js — draw.io CLI export wrapper.
 *
 * Usage:
 *   node export.js <input.drawio>                # Preview export (no -e, width-capped)
 *   node export.js <input.drawio> --final        # Final export (-e -s 2, embeds XML)
 *   node export.js <input.drawio> --format svg   # Export as SVG
 *   node export.js <input.drawio> --format pdf   # Export as PDF
 *
 * Auto-detects the draw.io binary on Windows, macOS, and Linux.
 * See references/rules.md for export constraints.
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Binary Detection ──────────────────────────────────────────────

/**
 * Detect the draw.io CLI binary name on the current platform.
 * Returns the binary name/path string, or null if not found.
 */
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
        // Linux
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
            // Try 'which' equivalent: run the binary with --version
            const result = spawnSync(bin, ['--version'], {
                timeout: 5000,
                windowsHide: true,
                stdio: 'pipe'
            });
            if (result.status === 0 || (result.stdout && result.stdout.toString().trim())) {
                return bin;
            }
        } catch (e) {
            // Not found, try next
        }
    }

    return null;
}

// ── Argument Parsing ──────────────────────────────────────────────

function parseArgs() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`Usage: node export.js <input.drawio> [options]

Options:
  --final         Final export with -e -s 2 (embeds editable XML in PNG)
  --format <fmt>  Output format: png (default), svg, pdf
  --output <path> Custom output path (default: derived from input)
  --width <px>    Export width (preview default: 2000, final: auto)
  --scale <n>     Export scale factor (final default: 2, preview: 1)
  --help, -h      Show this help

Modes:
  Preview (default):  drawio -x -f png --width 2000 -o <output> <input>
  Final (--final):    drawio -x -f png -e -s 2 -o <input>.drawio.png <input>
`);
        process.exit(0);
    }

    const input = args[0];
    if (!fs.existsSync(input)) {
        console.error(`Error: input file not found: ${input}`);
        process.exit(1);
    }

    const options = {
        input,
        final: args.includes('--final'),
        format: 'png',
        output: null,
        width: null,
        scale: null,
    };

    const formatIdx = args.indexOf('--format');
    if (formatIdx !== -1 && formatIdx + 1 < args.length) {
        options.format = args[formatIdx + 1];
    }

    const outputIdx = args.indexOf('--output');
    if (outputIdx !== -1 && outputIdx + 1 < args.length) {
        options.output = args[outputIdx + 1];
    }

    const widthIdx = args.indexOf('--width');
    if (widthIdx !== -1 && widthIdx + 1 < args.length) {
        options.width = parseInt(args[widthIdx + 1], 10);
    }

    const scaleIdx = args.indexOf('--scale');
    if (scaleIdx !== -1 && scaleIdx + 1 < args.length) {
        options.scale = parseInt(args[scaleIdx + 1], 10);
    }

    return options;
}

// ── Output Path Derivation ────────────────────────────────────────

function deriveOutput(input, format, final) {
    const ext = path.extname(input);
    const base = input.slice(0, -ext.length);

    if (final && format === 'png') {
        // Final PNG embeds the .drawio source: <name>.drawio.png
        return `${input}.png`;
    }

    return `${base}.${format}`;
}

// ── Command Builder ───────────────────────────────────────────────

function buildCommand(binary, options) {
    const { input, output, format, final, width, scale } = options;
    const cmdArgs = ['-x', '-f', format];

    // Page selection (default: all pages)
    // cmdArgs.push('-p', '0');  // All pages

    if (final) {
        // Embed editable .drawio XML in PNG
        cmdArgs.push('-e');
        // Higher scale for final output
        cmdArgs.push('-s', scale ? String(scale) : '2');
    } else if (width) {
        cmdArgs.push('--width', String(width));
    } else {
        // Preview: cap width to 2000px for vision API compatibility
        cmdArgs.push('--width', '2000');
        if (scale) {
            cmdArgs.push('-s', String(scale));
        }
    }

    // Output path
    const outPath = output || deriveOutput(input, format, final);
    cmdArgs.push('-o', outPath);

    // Input file
    cmdArgs.push(input);

    return { binary, args: cmdArgs, output: outPath };
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
    const options = parseArgs();

    console.log(`Export: ${options.input}`);
    console.log(`Mode: ${options.final ? 'final' : 'preview'}`);
    console.log(`Format: ${options.format}`);

    const binary = detectBinary();
    if (!binary) {
        console.error(
            'Error: draw.io CLI not found.\n' +
            'Please install draw.io desktop app and ensure the CLI is on your PATH.\n' +
            'Download: https://www.drawio.com/\n' +
            '\n' +
            'Windows: Add "C:\\Program Files\\draw.io" to your PATH.\n' +
            'macOS:  `brew install --cask drawio` or install from drawio.com.\n' +
            'Linux:  `snap install drawio` or download AppImage from drawio.com.'
        );
        process.exit(2);
    }

    console.log(`Binary: ${binary}`);

    const { args, output } = buildCommand(binary, options);

    console.log(`Command: ${binary} ${args.join(' ')}`);
    console.log(`Output: ${output}`);

    try {
        const result = spawnSync(binary, args, {
            stdio: 'inherit',
            timeout: 60000,
            windowsHide: true,
        });

        if (result.status !== 0) {
            console.error(`Export failed with exit code ${result.status}`);
            process.exit(result.status || 1);
        }

        // Verify output exists
        if (fs.existsSync(output)) {
            const stats = fs.statSync(output);
            const sizeKB = (stats.size / 1024).toFixed(1);
            console.log(`✓ Export complete: ${output} (${sizeKB} KB)`);
        } else {
            console.error(`Warning: export completed but output file not found: ${output}`);
            process.exit(1);
        }
    } catch (err) {
        console.error(`Error running draw.io CLI: ${err.message}`);
        process.exit(1);
    }
}

main();
