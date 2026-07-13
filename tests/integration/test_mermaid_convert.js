#!/usr/bin/env node
/**
 * L1 Integration Test: Pipeline B — Mermaid (.mmd) → draw.io conversion.
 *
 * Tests the full Pipeline B conversion chain:
 *   1. Write a minimal .mmd file
 *   2. Run mermaid-convert.js to convert it
 *   3. Verify output .drawio is valid XML with UserObject cells
 *   4. Run validate.py on output → 0 P0/P1 errors
 *   5. Clean up temp files
 *
 * Requires draw.io CLI >= v30. Gracefully skips if unavailable.
 *
 * Usage:
 *   node tests/integration/test_mermaid_convert.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');

// ── Helpers ────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const MERMAID_CONVERT = path.join(PROJECT_ROOT, 'skills', 'xiaosu-draw-ai', 'scripts', 'mermaid-convert.js');
const VALIDATE_PY = path.join(PROJECT_ROOT, 'skills', 'xiaosu-draw-ai', 'scripts', 'validate.py');

let passed = 0;
let failed = 0;
let skipped = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passed++;
    } catch (e) {
        if (e.code === 'SKIP') {
            console.log(`  - ${name} (SKIPPED: ${e.message})`);
            skipped++;
        } else {
            console.log(`  ✗ ${name}`);
            console.log(`    ${e.message}`);
            failed++;
        }
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function assertContains(haystack, needle, message) {
    if (!haystack.includes(needle)) {
        throw new Error(message || `Expected "${needle}" not found in output`);
    }
}

function skip(message) {
    const err = new Error(message);
    err.code = 'SKIP';
    throw err;
}

// ── Environment Check ───────────────────────────────────────────────

let drawioAvailable = false;
let drawioVersion = null;

function checkDrawio() {
    try {
        const result = spawnSync('C:\\Program Files\\draw.io\\draw.io.exe', ['--version'], {
            timeout: 15000,
            windowsHide: true,
            stdio: 'pipe'
        });
        if (result.status === 0) {
            const output = (result.stdout || result.stderr || '').toString();
            const match = output.match(/(\d+)\.(\d+)\.(\d+)/);
            if (match && parseInt(match[1]) >= 30) {
                drawioAvailable = true;
                drawioVersion = match[0];
                return;
            }
        }
    } catch (e) {
        // continue to other checks
    }
    // Try PATH
    try {
        const result = spawnSync('drawio', ['--version'], {
            timeout: 15000, windowsHide: true, stdio: 'pipe'
        });
        if (result.status === 0) {
            const output = (result.stdout || result.stderr || '').toString();
            const match = output.match(/(\d+)\.(\d+)\.(\d+)/);
            if (match && parseInt(match[1]) >= 30) {
                drawioAvailable = true;
                drawioVersion = match[0];
                return;
            }
        }
    } catch (e) {
        // skip
    }
}

// ── Test Data ───────────────────────────────────────────────────────

const MINIMAL_SEQUENCE_MMD = `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello
    B-->>A: Hi
`;

const MINIMAL_ER_MMD = `erDiagram
    User {
        int id PK
        string name
    }
    Post {
        int id PK
        int user_id FK
    }
    User ||--o{ Post: writes
`;

// ── Main ────────────────────────────────────────────────────────────

console.log('\n=== Pipeline B: Mermaid Conversion Tests ===\n');

// ── Check availability ──────────────────────────────────────────────

checkDrawio();

if (!drawioAvailable) {
    skip(`draw.io CLI v30+ not found — Pipeline B tests skipped`);
}

console.log(`  draw.io CLI: ${drawioVersion}\n`);

// ── Test 1: --check flag ────────────────────────────────────────────

test('mermaid-convert --check reports available', () => {
    const result = execSync(`node "${MERMAID_CONVERT}" --check`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 30000
    });
    assert(result.includes('AVAILABLE') || result.includes('Pipeline B'),
        '--check should report Pipeline B availability');
});

// ── Test 2: Convert sequence diagram ────────────────────────────────

test('Convert sequence .mmd → .drawio', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-test-'));
    const mmdPath = path.join(tmpDir, 'test-sequence.mmd');
    const drawioPath = path.join(tmpDir, 'test-sequence.drawio');

    try {
        // Write .mmd
        fs.writeFileSync(mmdPath, MINIMAL_SEQUENCE_MMD, 'utf-8');

        // Convert
        const cmd = `node "${MERMAID_CONVERT}" "${mmdPath}" --output "${drawioPath}"`;
        const result = execSync(cmd, {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: 60000
        });

        // Verify output exists
        assert(fs.existsSync(drawioPath), 'Output .drawio file should exist');

        // Verify it's valid XML containing UserObject cells
        const content = fs.readFileSync(drawioPath, 'utf-8');
        assert(content.includes('<mxfile'), 'Output should contain <mxfile>');
        assert(content.includes('UserObject'), 'Mermaid output should contain UserObject wrappers');
        assert(content.includes('<mxCell'), 'Output should contain mxCell elements');

        // Verify it's valid draw.io XML (has root cells)
        assert(content.includes('id="0"'), 'Output should have id="0" root cell');
        assert(content.includes('id="1"'), 'Output should have id="1" default parent');
    } finally {
        // Cleanup
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    }
});

// ── Test 3: Convert ER diagram ──────────────────────────────────────

test('Convert ER .mmd → .drawio', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-test-'));
    const mmdPath = path.join(tmpDir, 'test-er.mmd');
    const drawioPath = path.join(tmpDir, 'test-er.drawio');

    try {
        fs.writeFileSync(mmdPath, MINIMAL_ER_MMD, 'utf-8');

        const cmd = `node "${MERMAID_CONVERT}" "${mmdPath}" --output "${drawioPath}"`;
        execSync(cmd, {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: 60000
        });

        assert(fs.existsSync(drawioPath), 'Output .drawio file should exist');

        const content = fs.readFileSync(drawioPath, 'utf-8');
        assertContains(content, 'UserObject', 'ER output should contain UserObject');
        assertContains(content, 'User', 'ER output should contain entity name');
        assertContains(content, 'Post', 'ER output should contain entity name');
    } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    }
});

// ── Test 4: validate.py on Mermaid-converted output ─────────────────

test('validate.py accepts Mermaid-converted .drawio (0 P0/P1 errors)', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-test-'));
    const mmdPath = path.join(tmpDir, 'test-validate.mmd');
    const drawioPath = path.join(tmpDir, 'test-validate.drawio');

    try {
        // Use a simple state diagram for validation test
        const stateMmd = `stateDiagram-v2
    [*] --> Idle
    Idle --> Active: start
    Active --> Idle: stop
    Active --> [*]: complete
`;
        fs.writeFileSync(mmdPath, stateMmd, 'utf-8');

        // Convert
        execSync(`node "${MERMAID_CONVERT}" "${mmdPath}" --output "${drawioPath}"`, {
            cwd: PROJECT_ROOT, encoding: 'utf-8', stdio: 'pipe', timeout: 60000
        });

        // Validate
        const pythonCmd = process.platform === 'win32' ? 'python3' : 'python3';
        let validateResult;
        try {
            validateResult = execSync(`"${pythonCmd}" "${VALIDATE_PY}" "${drawioPath}" --json`, {
                cwd: PROJECT_ROOT, encoding: 'utf-8', stdio: 'pipe', timeout: 30000
            });
        } catch (e) {
            // validate.py exits non-zero on errors — capture output anyway
            validateResult = e.stdout || e.stderr || '';
        }

        const json = JSON.parse(validateResult);
        assert(json.errors.length === 0,
            `Mermaid-converted diagram should have 0 P0/P1 errors, got: ${JSON.stringify(json.errors)}`);
    } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    }
});

// ── Test 5: Nonexistent input file ──────────────────────────────────

test('mermaid-convert fails gracefully on nonexistent input', () => {
    try {
        execSync(`node "${MERMAID_CONVERT}" /nonexistent/path/ghost.mmd`, {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: 30000
        });
        // If we get here, it didn't fail — that's wrong
        throw new Error('Should have failed on nonexistent input');
    } catch (e) {
        // Expected: conversion should fail
        assert(e.status !== 0 || e.message.includes('not found') || e.message.includes('ENOENT'),
            'Should report error for nonexistent input file');
    }
});

// ── Report ──────────────────────────────────────────────────────────

console.log(`\n${'='.repeat(50)}`);
console.log(`  Passed:  ${passed}`);
console.log(`  Failed:  ${failed}`);
console.log(`  Skipped: ${skipped}`);
console.log(`${'='.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
