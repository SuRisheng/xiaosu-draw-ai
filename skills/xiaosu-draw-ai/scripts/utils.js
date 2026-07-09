#!/usr/bin/env node
/**
 * scripts/utils.js — Common utilities for xiaosu-draw-ai scripts.
 *
 * Shared by: export.js, build.js, and future scripts.
 * Provides: path resolution, file helpers, binary detection, validation.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ── Path Resolution ──────────────────────────────────────────────

/**
 * Resolve the project root directory (three levels up from scripts/: skills/xiaosu-draw-ai/scripts/ → project root).
 * @returns {string} Absolute path to project root.
 */
function getProjectRoot() {
    return path.resolve(__dirname, '..', '..', '..');
}

/**
 * Resolve a path relative to the project root.
 * @param {...string} segments — Path segments to join to root.
 * @returns {string} Absolute resolved path.
 */
function resolveRoot(...segments) {
    return path.resolve(getProjectRoot(), ...segments);
}

// ── Version ───────────────────────────────────────────────────────

/**
 * Read version from SKILL.md frontmatter (single source of truth).
 * @param {string} [skillRoot] — Path to the Skill directory containing SKILL.md. Defaults to auto-detect.
 * @returns {string} Trimmed semver string (e.g., "1.0.0").
 * @throws {Error} If SKILL.md not found, missing frontmatter, or version field invalid.
 */
function readVersion(skillRoot) {
    const base = skillRoot || path.resolve(__dirname, '..');
    const skillPath = path.join(base, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
        throw new Error(`SKILL.md not found at ${skillPath}. Unable to determine version.`);
    }
    const content = fs.readFileSync(skillPath, 'utf-8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
        throw new Error('SKILL.md missing YAML frontmatter (--- ... ---).');
    }
    const versionMatch = fmMatch[1].match(/^version:\s*(.+)$/m);
    if (!versionMatch) {
        throw new Error('SKILL.md frontmatter missing required field: "version"');
    }
    const version = versionMatch[1].trim();
    if (!/^\d+\.\d+\.\d+/.test(version)) {
        throw new Error(`SKILL.md version is not valid semver: "${version}"`);
    }
    return version;
}

/**
 * Validate that a string matches semver pattern.
 * @param {string} version
 * @returns {boolean}
 */
function isValidSemver(version) {
    return /^\d+\.\d+\.\d+/.test(version);
}

// ── File Helpers ─────────────────────────────────────────────────

/**
 * Check if a file exists relative to a base directory.
 * @param {string} baseDir — Base directory for relative paths.
 * @param {string} filePath — File path relative to baseDir.
 * @param {string} [label] — Human-readable label for error message.
 * @returns {string|null} Error message if file missing, null if exists.
 */
function checkFile(baseDir, filePath, label) {
    const fullPath = path.join(baseDir, filePath);
    if (!fs.existsSync(fullPath)) {
        return `Missing: ${label || filePath} (${filePath})`;
    }
    return null;
}

/**
 * Compute total size of a directory recursively.
 * @param {string} dirPath — Directory to measure.
 * @returns {number} Total size in bytes.
 */
function dirSize(dirPath) {
    let total = 0;
    function walk(d) {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const e of entries) {
            const p = path.join(d, e.name);
            if (e.isFile()) {
                total += fs.statSync(p).size;
            } else if (e.isDirectory()) {
                walk(p);
            }
        }
    }
    if (fs.existsSync(dirPath)) {
        walk(dirPath);
    }
    return total;
}

/**
 * Count files in a directory recursively.
 * @param {string} dirPath — Directory to count.
 * @returns {number} File count.
 */
function fileCount(dirPath) {
    let count = 0;
    function walk(d) {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const e of entries) {
            if (e.isFile()) count++;
            else if (e.isDirectory()) walk(path.join(d, e.name));
        }
    }
    if (fs.existsSync(dirPath)) walk(dirPath);
    return count;
}

/**
 * Recursively copy a directory, excluding certain entries.
 * @param {string} src — Source directory.
 * @param {string} dest — Destination directory.
 * @param {string[]} [exclude=[]] — Entry names to skip.
 */
function copyDir(src, dest, exclude = []) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const e of entries) {
        if (exclude.includes(e.name)) continue;
        const srcPath = path.join(src, e.name);
        const destPath = path.join(dest, e.name);
        if (e.isFile()) {
            fs.copyFileSync(srcPath, destPath);
        } else if (e.isDirectory()) {
            copyDir(srcPath, destPath, exclude);
        }
    }
}

// ── Binary Detection ─────────────────────────────────────────────

/**
 * Detect the draw.io CLI binary on the current platform.
 * Attempts common binary names and install paths for Windows, macOS, Linux.
 * @returns {string|null} Binary name/path, or null if not found.
 */
function detectDrawioBinary() {
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
            const result = spawnSync(bin, ['--version'], {
                timeout: 5000,
                windowsHide: true,
                stdio: 'pipe'
            });
            if (result.status === 0 || (result.stdout && result.stdout.toString().trim())) {
                return bin;
            }
        } catch (e) {
            // Not found, try next candidate
        }
    }

    return null;
}

// ── Export Helpers ───────────────────────────────────────────────

/**
 * Derive output file path from input path.
 * @param {string} input — Input .drawio file path.
 * @param {string} format — Output format (png, svg, pdf).
 * @param {boolean} final — Whether this is a final export (embeds XML in PNG).
 * @returns {string} Output file path.
 */
function deriveOutput(input, format, final) {
    const ext = path.extname(input);
    const base = input.slice(0, -ext.length);

    if (final && format === 'png') {
        // Final PNG embeds the .drawio source: <name>.drawio.png
        return `${input}.png`;
    }

    return `${base}.${format}`;
}

/**
 * Parse command-line arguments for export.js.
 * @param {string[]} argv — process.argv.slice(2).
 * @returns {object} Parsed options: { input, final, format, output, width, scale }.
 */
function parseExportArgs(argv) {
    if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
        return { help: true };
    }

    const input = argv[0];
    if (!fs.existsSync(input)) {
        return { error: `Input file not found: ${input}` };
    }

    const options = {
        input,
        final: argv.includes('--final'),
        format: 'png',
        output: null,
        width: null,
        scale: null,
    };

    const formatIdx = argv.indexOf('--format');
    if (formatIdx !== -1 && formatIdx + 1 < argv.length) {
        options.format = argv[formatIdx + 1];
    }

    const outputIdx = argv.indexOf('--output');
    if (outputIdx !== -1 && outputIdx + 1 < argv.length) {
        options.output = argv[outputIdx + 1];
    }

    const widthIdx = argv.indexOf('--width');
    if (widthIdx !== -1 && widthIdx + 1 < argv.length) {
        options.width = parseInt(argv[widthIdx + 1], 10);
    }

    const scaleIdx = argv.indexOf('--scale');
    if (scaleIdx !== -1 && scaleIdx + 1 < argv.length) {
        options.scale = parseInt(argv[scaleIdx + 1], 10);
    }

    return options;
}

// ── Validation ───────────────────────────────────────────────────

/**
 * Validate YAML frontmatter in a markdown/skill file.
 * @param {string} content — File content.
 * @param {string[]} [requiredFields=['name', 'version', 'description']] — Fields that must be present.
 * @returns {string|null} Error message, or null if valid.
 */
function validateFrontmatter(content, requiredFields = ['name', 'version', 'description']) {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
        return 'Missing YAML frontmatter (--- ... ---).';
    }
    const fm = fmMatch[1];
    for (const field of requiredFields) {
        if (!fm.includes(`${field}:`)) {
            return `Frontmatter missing required field: "${field}"`;
        }
    }
    return null;
}

// ── Exports ──────────────────────────────────────────────────────

module.exports = {
    getProjectRoot,
    resolveRoot,
    readVersion,
    isValidSemver,
    checkFile,
    dirSize,
    fileCount,
    copyDir,
    detectDrawioBinary,
    deriveOutput,
    parseExportArgs,
    validateFrontmatter,
};
