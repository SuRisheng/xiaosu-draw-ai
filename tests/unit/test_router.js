#!/usr/bin/env node
/**
 * test_router.js — Unit tests for router.js (orthogonal routing engine).
 *
 * Usage:
 *   node tests/unit/test_router.js
 *
 * No external dependencies — pure Node.js.
 */

const { route, distributeParallelEdges, checkLabelCollision, auditLabelCollisions, rect, intersects } =
    require('../../skills/xiaosu-draw-ai/scripts/router');

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

// ── Tests ──────────────────────────────────────────────────────────

console.log('=== Unit Test: router.js ===\n');

console.log('Geometry primitives:');

test('rect computes right and bottom', () => {
    const r = rect(10, 20, 100, 50);
    assert(r.right === 110, `right=${r.right}`);
    assert(r.bottom === 70, `bottom=${r.bottom}`);
});

test('intersects detects overlapping rects', () => {
    const a = rect(0, 0, 100, 100);
    const b = rect(50, 50, 100, 100);
    assert(intersects(a, b) === true, 'Should overlap');
});

test('intersects detects non-overlapping rects', () => {
    const a = rect(0, 0, 100, 100);
    const b = rect(200, 200, 100, 100);
    assert(intersects(a, b) === false, 'Should not overlap');
});

test('intersects edge-touching is not overlap', () => {
    const a = rect(0, 0, 100, 100);
    const b = rect(100, 0, 100, 100);
    assert(intersects(a, b) === false, 'Edge touching should not count');
});

console.log('\nEdge routing:');

test('direct path returns empty waypoints when clear', () => {
    const src = { x: 0, y: 0, w: 100, h: 50 };
    const tgt = { x: 300, y: 0, w: 100, h: 50 };
    const wp = route({ source: src, target: tgt, obstacles: [] });
    assert(wp.length === 0, `Expected 0 waypoints, got ${wp.length}`);
});

test('route avoids single obstacle between nodes', () => {
    const src = { x: 0, y: 0, w: 100, h: 50 };
    const tgt = { x: 400, y: 0, w: 100, h: 50 };
    const obs = { x: 150, y: -20, w: 100, h: 100 }; // blocks direct path
    const wp = route({ source: src, target: tgt, obstacles: [obs] });
    assert(wp.length >= 1, `Expected waypoints to avoid obstacle, got ${wp.length}`);
});

test('route finds path around vertically offset obstacle', () => {
    const src = { x: 40, y: 40, w: 100, h: 50 };
    const tgt = { x: 40, y: 300, w: 100, h: 50 };
    const obs = { x: 20, y: 150, w: 140, h: 40 }; // blocks direct vertical path
    const wp = route({ source: src, target: tgt, obstacles: [obs] });
    assert(wp.length >= 1, `Expected waypoints, got ${wp.length}`);
});

console.log('\nParallel edge distribution:');

test('single edge gets centered exit/entry', () => {
    const positions = distributeParallelEdges(1, 'bottom');
    assert(positions.length === 1, `Expected 1 position, got ${positions.length}`);
    assert(positions[0].exitX === 0.5, `Expected 0.5, got ${positions[0].exitX}`);
    assert(positions[0].exitY === 1, `Expected 1, got ${positions[0].exitY}`);
});

test('two edges get distributed positions', () => {
    const positions = distributeParallelEdges(2, 'bottom');
    assert(positions.length === 2, `Expected 2, got ${positions.length}`);
    assert(positions[0].exitX === 0.3, `Expected 0.3, got ${positions[0].exitX}`);
    assert(positions[1].exitX === 0.7, `Expected 0.7, got ${positions[1].exitX}`);
});

test('three edges get evenly spaced positions', () => {
    const positions = distributeParallelEdges(3, 'bottom');
    assert(positions.length === 3, `Expected 3, got ${positions.length}`);
    assert(positions[0].exitX === 0.25, `Expected 0.25, got ${positions[0].exitX}`);
    assert(positions[1].exitX === 0.5, `Expected 0.5, got ${positions[1].exitX}`);
    assert(positions[2].exitX === 0.75, `Expected 0.75, got ${positions[2].exitX}`);
});

test('right side uses exitY/entryY', () => {
    const positions = distributeParallelEdges(1, 'right');
    assert(positions[0].exitY === 0.5, `Expected 0.5, got ${positions[0].exitY}`);
    assert(positions[0].exitX === 1, `Expected 1, got ${positions[0].exitX}`);
});

console.log('\nLabel collision detection:');

test('label with no obstacles has no collision', () => {
    const result = checkLabelCollision(
        { x: 100, y: 100, text: 'test label' },
        [{ x: 300, y: 300, w: 100, h: 50 }]
    );
    assert(result.collides === false, 'Should not collide');
});

test('label overlapping node triggers collision', () => {
    const result = checkLabelCollision(
        { x: 100, y: 100, text: 'overlapping label text here' },
        [{ x: 90, y: 90, w: 80, h: 40 }]
    );
    assert(result.collides === true, 'Should collide');
    assert(result.suggestion !== null, 'Should have suggestion');
});

test('label collision suggests non-zero offset', () => {
    const result = checkLabelCollision(
        { x: 50, y: 50, text: 'colliding' },
        [{ x: 40, y: 40, w: 60, h: 30 }]
    );
    assert(result.collides === true, 'Should collide');
    assert(result.suggestion.dx !== 0 || result.suggestion.dy !== 0, 'Should suggest movement');
});

console.log('\nLabel audit:');

test('auditLabelCollisions finds edge with overlapping label', () => {
    const edges = [
        { id: 'e1', sourceId: 'a', targetId: 'b', label: 'HTTP Request', labelX: 150, labelY: 100 },
    ];
    const nodes = [
        { id: 'a', x: 40, y: 40, w: 100, h: 50 },
        { id: 'b', x: 300, y: 40, w: 100, h: 50 },
        { id: 'c', x: 140, y: 90, w: 40, h: 30 }, // overlaps label
    ];
    const reports = auditLabelCollisions(edges, nodes);
    assert(reports.length === 1, `Expected 1 collision, got ${reports.length}`);
    assert(reports[0].edgeId === 'e1', `Expected edge 'e1'`);
    assert(reports[0].fix.includes('labelBackgroundColor'), 'Should suggest background color');
});

test('auditLabelCollisions returns empty for no collisions', () => {
    const edges = [
        { id: 'e1', sourceId: 'a', targetId: 'b', label: 'OK', labelX: 200, labelY: 50 },
    ];
    const nodes = [
        { id: 'a', x: 40, y: 40, w: 100, h: 50 },
        { id: 'b', x: 400, y: 40, w: 100, h: 50 },
    ];
    const reports = auditLabelCollisions(edges, nodes);
    assert(reports.length === 0, `Expected 0 collisions, got ${reports.length}`);
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
