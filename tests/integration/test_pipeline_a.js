#!/usr/bin/env node
/**
 * test_pipeline_a.js — Integration test for Pipeline A importers.
 *
 * Tests sql2er SQL parser with sample DDL input.
 *
 * Usage:
 *   node tests/integration/test_pipeline_a.js
 */

const path = require('path');
const fs = require('fs');

// Load importers
const irImporter = require('../../skills/xiaosu-draw-ai/scripts/importers/ir-importer');
require('../../skills/xiaosu-draw-ai/scripts/importers/sql2er');
require('../../skills/xiaosu-draw-ai/scripts/importers/openapi2arch');

// ── Test Helpers ──────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ PASS: ${name}`);
    } catch (err) {
        failed++;
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    ${err.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

// ── SQL DDL Sample ────────────────────────────────────────────────

const SAMPLE_SQL = `
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

// ── Tests ──────────────────────────────────────────────────────────

console.log('=== Integration Test: Pipeline A Importers ===\n');

console.log('Importer registry:');
test('sql2er is registered', () => {
    const found = irImporter.findByName('sql2er');
    assert(found !== undefined, 'sql2er not found in registry');
    assert(found.diagramType === 'er', 'Expected diagram type "er"');
});

test('openapi2arch is registered', () => {
    const found = irImporter.findByName('openapi2arch');
    assert(found !== undefined, 'openapi2arch not found in registry');
    assert(found.diagramType === 'architecture', 'Expected diagram type "architecture"');
});

test('listImporters returns both', () => {
    const list = irImporter.listImporters();
    assert(list.length >= 2, `Expected ≥2 importers, got ${list.length}`);
});

console.log('\nSQL parsing:');
const { parseSQL } = require('../../skills/xiaosu-draw-ai/scripts/importers/sql2er');

test('parses two tables from sample SQL', () => {
    const tables = parseSQL(SAMPLE_SQL);
    assert(tables.length === 2, `Expected 2 tables, got ${tables.length}`);
});

test('users table has correct fields', () => {
    const tables = parseSQL(SAMPLE_SQL);
    const users = tables.find(t => t.name === 'users');
    assert(users !== undefined, 'users table not found');
    assert(users.fields.length === 4, `Expected 4 fields, got ${users.fields.length}`);
    assert(users.fields[0].name === 'id', `Expected first field "id", got "${users.fields[0].name}"`);
    assert(users.fields[0].pk === true, 'Expected id to be PK');
    assert(users.fields[1].unique === true, 'Expected email to be UNIQUE');
});

test('orders table has foreign key', () => {
    const tables = parseSQL(SAMPLE_SQL);
    const orders = tables.find(t => t.name === 'orders');
    assert(orders !== undefined, 'orders table not found');
    assert(orders.foreignKeys.length === 1, `Expected 1 FK, got ${orders.foreignKeys.length}`);
    assert(orders.foreignKeys[0].refTable === 'users', `Expected FK to users, got ${orders.foreignKeys[0].refTable}`);
});

console.log('\nIR extraction:');
test('sql2er extracts valid IR', () => {
    const tmpFile = path.join(require('os').tmpdir(), `test-schema-${Date.now()}.sql`);
    fs.writeFileSync(tmpFile, SAMPLE_SQL, 'utf-8');

    try {
        const sql2er = irImporter.findByName('sql2er');
        const ir = sql2er.extract(tmpFile);
        assert(ir.meta.type === 'er', `Expected type "er", got "${ir.meta.type}"`);
        assert(ir.nodes.length === 2, `Expected 2 nodes, got ${ir.nodes.length}`);
        assert(ir.edges.length === 1, `Expected 1 edge, got ${ir.edges.length}`);
        assert(ir.extension !== undefined, 'Expected extension data');
        assert(ir.extension.entities.length === 2, 'Expected 2 extension entities');
        assert(ir.extension.relationships.length === 1, 'Expected 1 extension relationship');
    } finally {
        fs.unlinkSync(tmpFile);
    }
});

console.log('\nDetection:');
test('sql2er detects .sql files with CREATE TABLE', () => {
    const tmpFile = path.join(require('os').tmpdir(), `test-detect-${Date.now()}.sql`);
    fs.writeFileSync(tmpFile, SAMPLE_SQL, 'utf-8');
    try {
        const sql2er = irImporter.findByName('sql2er');
        assert(sql2er.detect(tmpFile) === true, 'Should detect SQL file');
    } finally {
        fs.unlinkSync(tmpFile);
    }
});

test('sql2er rejects non-SQL files', () => {
    const sql2er = irImporter.findByName('sql2er');
    assert(sql2er.detect('/nonexistent/file.txt') === false, 'Should reject .txt');
});

// Report
console.log(`\nResults: ${passed}/${passed + failed} passed`);
if (failed === 0) {
    console.log('=== ALL TESTS PASSED ===');
    process.exit(0);
} else {
    console.error('=== FAILURES DETECTED ===');
    process.exit(1);
}
