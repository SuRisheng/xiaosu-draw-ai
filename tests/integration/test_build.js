#!/usr/bin/env node
/**
 * L1 Integration Test: build.js — Skill packaging workflow.
 *
 * Tests:
 *   1. build.js --dry-run exits 0 without writing files
 *   2. build.js produces output in .claude/skills/xiaosu-draw-ai/
 *   3. Output contains all required directories
 *   4. Output contains SKILL.md with valid frontmatter
 *   5. Output manifest.json is valid
 *
 * Usage:
 *   node tests/integration/test_build.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const BUILD_SCRIPT = path.join(PROJECT_ROOT, 'skills', 'xiaosu-draw-ai', 'scripts', 'build.js');
const OUTPUT_DIR = path.join(PROJECT_ROOT, '.claude', 'skills', 'xiaosu-draw-ai');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passed++;
    } catch (e) {
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

// ── Tests ──────────────────────────────────────────────────────────

console.log('\n=== Integration Test: build.js ===\n');

test('build --dry-run exits 0', () => {
    const result = execSync(`node "${BUILD_SCRIPT}" --dry-run`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 30000
    });
    assert(result.includes('DRY RUN') || result.includes('[DRY RUN]'),
        'Dry run should announce itself');
});

test('build produces output directory', () => {
    // Run actual build
    execSync(`node "${BUILD_SCRIPT}"`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 30000
    });
    assert(fs.existsSync(OUTPUT_DIR), 'Output directory should exist');
});

test('build output contains SKILL.md', () => {
    const skillMd = path.join(OUTPUT_DIR, 'SKILL.md');
    assert(fs.existsSync(skillMd), 'SKILL.md should exist');
    const content = fs.readFileSync(skillMd, 'utf-8');
    assert(content.includes('---'), 'SKILL.md should have YAML frontmatter');
    assert(content.includes('name:'), 'SKILL.md frontmatter should have name');
    assert(content.includes('version:'), 'SKILL.md frontmatter should have version');
});

test('build output contains required directories', () => {
    const required = ['references', 'scripts', 'styles', 'templates'];
    for (const dir of required) {
        const dirPath = path.join(OUTPUT_DIR, dir);
        assert(fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(),
            `Required directory '${dir}' should exist`);
    }
});

test('build output contains manifest.json', () => {
    const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
    assert(fs.existsSync(manifestPath), 'manifest.json should exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    assert(manifest.name === 'xiaosu-draw-ai', `Expected name 'xiaosu-draw-ai', got '${manifest.name}'`);
    assert(manifest.version !== undefined, 'manifest should have version');
    assert(manifest.files.length >= 5, `Expected ≥5 files in manifest, got ${manifest.files.length}`);
});

test('build output scripts are executable modules', () => {
    const scripts = ['validate.py', 'export.js', 'audit.js', 'mermaid-convert.js'];
    for (const script of scripts) {
        const scriptPath = path.join(OUTPUT_DIR, 'scripts', script);
        assert(fs.existsSync(scriptPath), `Script '${script}' should exist in build output`);
        const content = fs.readFileSync(scriptPath, 'utf-8');
        assert(content.length > 100, `Script '${script}' should not be empty (${content.length} bytes)`);
    }
});

test('build output validate.py handles UserObject (pipeline B support)', () => {
    const validatePath = path.join(OUTPUT_DIR, 'scripts', 'validate.py');
    const content = fs.readFileSync(validatePath, 'utf-8');
    assert(content.includes('UserObject'), 'Built validate.py should include UserObject parsing fix');
});

test('build output rules.md contains R048-R051', () => {
    const rulesPath = path.join(OUTPUT_DIR, 'references', 'rules.md');
    assert(fs.existsSync(rulesPath), 'rules.md should exist in build output');
    const content = fs.readFileSync(rulesPath, 'utf-8');
    assert(content.includes('R048'), 'rules.md should contain R048');
    assert(content.includes('R049'), 'rules.md should contain R049');
    assert(content.includes('R050'), 'rules.md should contain R050');
    assert(content.includes('R051'), 'rules.md should contain R051');
});

test('build output has all 7 style presets', () => {
    const builtInDir = path.join(OUTPUT_DIR, 'styles', 'built-in');
    const presets = [
        'flat-icon.json', 'dark-terminal.json', 'blueprint.json',
        'notion-clean.json', 'glassmorphism.json', 'claude-official.json', 'openai.json'
    ];
    for (const preset of presets) {
        const presetPath = path.join(builtInDir, preset);
        assert(fs.existsSync(presetPath), `Style preset '${preset}' should exist`);

        // Verify it's valid JSON
        const data = JSON.parse(fs.readFileSync(presetPath, 'utf-8'));
        assert(data.name !== undefined, `Preset '${preset}' should have a name`);
    }
});

// ── Report ─────────────────────────────────────────────────────────

console.log(`\n${'='.repeat(50)}`);
console.log(`  Passed:  ${passed}`);
console.log(`  Failed:  ${failed}`);
console.log(`${'='.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
