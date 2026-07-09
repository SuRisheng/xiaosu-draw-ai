#!/usr/bin/env node
/**
 * test_audit.js — Unit tests for scripts/audit.js.
 *
 * Tests parseXML, heuristic check functions (R030, R035-R038),
 * computeScore, and exit code behavior.
 *
 * Usage:
 *   node tests/unit/test_audit.js
 *
 * No external dependencies — pure Node.js.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const {
    parseXML,
    checkR030,
    checkR035,
    checkR036,
    checkR037,
    checkR038,
    computeScore,
} = require('../../skills/xiaosu-draw-ai/scripts/audit.js');

// ── Helpers ──────────────────────────────────────────────────────────

function makeDrawio(cellsXml) {
    const cells = Array.isArray(cellsXml) ? cellsXml.join('\n        ') : cellsXml;
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio" version="26.0.0" type="device">
  <diagram name="Test" id="test-1">
    <mxGraphModel dx="1434" dy="810" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${cells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function writeTemp(content) {
    const tmpPath = path.join(os.tmpdir(), `test-audit-${Date.now()}-${Math.floor(Math.random() * 10000)}.drawio`);
    fs.writeFileSync(tmpPath, content, 'utf-8');
    return tmpPath;
}

// ── Test Runner ──────────────────────────────────────────────────────

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

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Value mismatch'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

// ── Test Data ────────────────────────────────────────────────────────

const VERTEX_A = '<mxCell id="2" value="Service A" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="200" height="60" as="geometry" /></mxCell>';
const VERTEX_B = '<mxCell id="3" value="Service B" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1"><mxGeometry x="340" y="40" width="200" height="60" as="geometry" /></mxCell>';
const VERTEX_C = '<mxCell id="4" value="Service C" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1"><mxGeometry x="640" y="40" width="200" height="60" as="geometry" /></mxCell>';
const EDGE_AB = '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry" /></mxCell>';
const EDGE_BC_LABELED = '<mxCell id="6" value="calls" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=classic;endFill=1;" edge="1" parent="1" source="3" target="4"><mxGeometry relative="1" as="geometry" /></mxCell>';

// ═══════════════════════════════════════════════════════════════════════
// parseXML Tests
// ═══════════════════════════════════════════════════════════════════════

console.log('=== Unit Test: audit.js ===\n');
console.log('parseXML:');

test('parses vertex cells with geometry', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B]);
    const tmpPath = writeTemp(content);
    try {
        const result = parseXML(tmpPath);
        const vertices = result.cells.filter(c => c.vertex);
        assert(vertices.length === 2, `Expected 2 vertices, got ${vertices.length}`);
        const a = vertices.find(v => v.id === '2');
        assert(a, 'Vertex id=2 not found');
        assert(a.geometry !== null, 'Vertex 2 should have geometry');
        assertEqual(a.geometry.x, 40, 'Vertex 2 x');
        assertEqual(a.geometry.y, 40, 'Vertex 2 y');
        assertEqual(a.geometry.width, 200, 'Vertex 2 width');
        assertEqual(a.geometry.height, 60, 'Vertex 2 height');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('parses edge cells with source/target', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B, EDGE_AB]);
    const tmpPath = writeTemp(content);
    try {
        const result = parseXML(tmpPath);
        const edges = result.cells.filter(c => c.edge);
        assert(edges.length === 1, `Expected 1 edge, got ${edges.length}`);
        const e = edges[0];
        assertEqual(e.id, '5', 'Edge id');
        assertEqual(e.source, '2', 'Edge source');
        assertEqual(e.target, '3', 'Edge target');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('parses edge waypoints', () => {
    const edgeWithPoints = '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="140" y="100" /><mxPoint x="440" y="100" /></Array></mxGeometry></mxCell>';
    const content = makeDrawio([VERTEX_A, VERTEX_B, edgeWithPoints]);
    const tmpPath = writeTemp(content);
    try {
        const result = parseXML(tmpPath);
        const edge = result.cells.find(c => c.edge);
        assert(edge.points.length === 2, `Expected 2 waypoints, got ${edge.points.length}`);
        assertEqual(edge.points[0].x, 140, 'Waypoint 1 x');
        assertEqual(edge.points[0].y, 100, 'Waypoint 1 y');
        assertEqual(edge.points[1].x, 440, 'Waypoint 2 x');
        assertEqual(edge.points[1].y, 100, 'Waypoint 2 y');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('handles empty diagram gracefully', () => {
    const content = makeDrawio([]);
    const tmpPath = writeTemp(content);
    try {
        const result = parseXML(tmpPath);
        assert(Array.isArray(result.cells), 'cells should be an array');
        // Root cells (id=0, id=1) are always present in draw.io XML skeleton
        assert(result.cells.length >= 0, `Got ${result.cells.length} cells (root cells are expected)`);
        // User cells (non-root) should be 0
        const userCells = result.cells.filter(c => c.id !== '0' && c.id !== '1');
        assert(userCells.length === 0, `Expected 0 user cells, got ${userCells.length}`);
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('parses style attributes correctly', () => {
    const styledVertex = '<mxCell id="2" value="Styled" style="rounded=1;fillColor=#ff0000;strokeColor=#000000;" vertex="1" parent="1"><mxGeometry x="10" y="20" width="100" height="50" as="geometry" /></mxCell>';
    const content = makeDrawio([styledVertex]);
    const tmpPath = writeTemp(content);
    try {
        const result = parseXML(tmpPath);
        const v = result.cells.find(c => c.id === '2');
        assert(v, 'Vertex id=2 should exist');
        assert(v.style !== undefined, 'Style attribute should exist');
        assert(typeof v.style === 'string', 'Style should be a string');
        assert(v.style.includes('rounded=1') || v.style.includes('fillColor'), 'Style should contain style properties');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('handles HTML entities in values', () => {
    const vertexWithEntities = '<mxCell id="2" value="Line1&amp;#xa;Line2&amp;amp;test" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="200" height="60" as="geometry" /></mxCell>';
    const content = makeDrawio([vertexWithEntities]);
    const tmpPath = writeTemp(content);
    try {
        const result = parseXML(tmpPath);
        const v = result.cells.find(c => c.id === '2');
        assert(v, 'Vertex id=2 should exist');
        // The regex-based parser captures the raw attribute value. Entity format
        // depends on how the regex captures the value attribute.
        assert(v.value.length > 0, 'Value should not be empty');
        assert(v.value.includes('Line1'), 'Value should contain line text');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

// ═══════════════════════════════════════════════════════════════════════
// R030: Label Overflow Risk
// ═══════════════════════════════════════════════════════════════════════

console.log('\nR030 — Label overflow risk:');

test('detects label that likely overflows narrow shape', () => {
    const narrowVertex = '<mxCell id="2" value="This is a very long label that will overflow" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="60" height="40" as="geometry" /></mxCell>';
    const content = makeDrawio([narrowVertex]);
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR030(cells);
        assert(findings.length > 0, 'Should detect label overflow risk for narrow shape');
        assert(findings[0].id === 'R030', 'Finding should be R030');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('no false positive for wide shape with short label', () => {
    const content = makeDrawio([VERTEX_A]); // 200px wide, "Service A" label
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR030(cells);
        assert(findings.length === 0, `Expected no R030 for wide shape, got ${findings.length}: ${JSON.stringify(findings)}`);
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('skips swimlane and text-only cells', () => {
    const swimlane = '<mxCell id="2" value="Swimlane Content" style="swimlane;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>';
    const content = makeDrawio([swimlane]);
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR030(cells);
        assert(findings.length === 0, 'Should skip swimlanes');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('skips cells with no value', () => {
    const noValue = '<mxCell id="2" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="60" height="40" as="geometry" /></mxCell>';
    const content = makeDrawio([noValue]);
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR030(cells);
        assert(findings.length === 0, 'Should skip cells with no value');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

// ═══════════════════════════════════════════════════════════════════════
// R035: Corner Connections
// ═══════════════════════════════════════════════════════════════════════

console.log('\nR035 — Corner connections:');

test('detects edge connecting near shape corner', () => {
    const vertex = '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="200" height="100" as="geometry" /></mxCell>';
    const vertex2 = '<mxCell id="3" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="340" y="40" width="200" height="100" as="geometry" /></mxCell>';
    // exitX=0, exitY=0 = top-left corner of source
    const cornerEdge = '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0;exitY=0;entryX=1;entryY=0.5;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry" /></mxCell>';
    const content = makeDrawio([vertex, vertex2, cornerEdge]);
    const tmpPath = writeTemp(content);
    try {
        const xmlData = parseXML(tmpPath);
        const findings = checkR035(xmlData);
        assert(findings.length > 0, 'Should detect corner connection');
        assert(findings[0].id === 'R035', 'Finding should be R035');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('no false positive for centered connections', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B, EDGE_AB]); // EDGE_AB has no exitX/exitY → default centered
    const tmpPath = writeTemp(content);
    try {
        const xmlData = parseXML(tmpPath);
        const findings = checkR035(xmlData);
        assert(findings.length === 0, `Expected no R035 for centered connections, got ${findings.length}`);
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('skips non-edge cells', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B]);
    const tmpPath = writeTemp(content);
    try {
        const xmlData = parseXML(tmpPath);
        const findings = checkR035(xmlData);
        assert(findings.length === 0, 'Should have no findings when no edges present');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

// ═══════════════════════════════════════════════════════════════════════
// R036: Missing Label Background
// ═══════════════════════════════════════════════════════════════════════

console.log('\nR036 — Missing label background:');

test('detects labeled edge without labelBackgroundColor', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B, VERTEX_C, EDGE_BC_LABELED]);
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR036(cells);
        assert(findings.length > 0, 'Should detect missing label background');
        assert(findings[0].id === 'R036', 'Finding should be R036');
        assert(findings[0].message.includes('labelBackgroundColor'), 'Message should mention labelBackgroundColor');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('no false positive for unlabeled edges', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B, EDGE_AB]); // EDGE_AB has no value/label
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR036(cells);
        assert(findings.length === 0, `Expected no R036 for unlabeled edge, got ${findings.length}`);
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('edge with labelBackgroundColor passes', () => {
    const edgeWithBg = '<mxCell id="5" value="label" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry" /></mxCell>';
    const content = makeDrawio([VERTEX_A, VERTEX_B, edgeWithBg]);
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR036(cells);
        assert(findings.length === 0, `Expected no R036 when labelBackgroundColor present, got ${findings.length}`);
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

// ═══════════════════════════════════════════════════════════════════════
// R037: Insufficient Component Spacing
// ═══════════════════════════════════════════════════════════════════════

console.log('\nR037 — Insufficient spacing:');

test('detects vertices too close together', () => {
    // Two vertices diagonally close: A at (40,40), B at (155,95)
    // hGap = max(40-255, 155-140) = 15, vGap = max(40-145, 95-90) = 5
    // Both > 0, minGap = 15 < 80, centerDist < 500
    const closeA = '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="50" as="geometry" /></mxCell>';
    const closeB = '<mxCell id="3" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="155" y="95" width="100" height="50" as="geometry" /></mxCell>';
    const content = makeDrawio([closeA, closeB]);
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR037(cells);
        assert(findings.length > 0, 'Should detect insufficient spacing');
        assert(findings[0].id === 'R037', 'Finding should be R037');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('no false positive for well-spaced vertices', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B]); // 340-40=300px apart
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR037(cells);
        assert(findings.length === 0, `Expected no R037 for well-spaced vertices, got ${findings.length}`);
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('no false positive for single vertex', () => {
    const content = makeDrawio([VERTEX_A]);
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR037(cells);
        assert(findings.length === 0, 'Single vertex should have no spacing issues');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

// ═══════════════════════════════════════════════════════════════════════
// R038: Z-Order Violations
// ═══════════════════════════════════════════════════════════════════════

console.log('\nR038 — Z-order violations:');

test('detects edges rendered after vertices (mixed z-order)', () => {
    // Edge before first vertex AND edge after first vertex = mixed z-order
    const cells = [EDGE_AB, VERTEX_A, EDGE_BC_LABELED, VERTEX_B];
    const content = makeDrawio(cells);
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR038(cells);
        // Edge at idx 0 (before first vertex at idx 1), edge at idx 2 (after first vertex)
        assert(findings.length > 0, 'Should detect z-order violation with mixed ordering');
        assert(findings[0].id === 'R038', 'Finding should be R038');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('edges all before vertices is correct', () => {
    // All edges first, then vertices = correct z-order
    const content = makeDrawio([EDGE_AB, VERTEX_A, VERTEX_B]);
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR038(cells);
        assert(findings.length === 0, `Expected no R038 when edges before vertices, got ${findings.length}`);
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('no edges = no z-order issues', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B]);
    const tmpPath = writeTemp(content);
    try {
        const { cells } = parseXML(tmpPath);
        const findings = checkR038(cells);
        assert(findings.length === 0, 'No edges = no z-order violation');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

// ═══════════════════════════════════════════════════════════════════════
// computeScore Tests
// ═══════════════════════════════════════════════════════════════════════

console.log('\ncomputeScore:');

test('perfect score is 0', () => {
    const results = { errors: [], warnings: [], p3_findings: [] };
    assertEqual(computeScore(results), 0, 'Empty results should score 0');
});

test('P0 errors add 50 each', () => {
    const results = {
        errors: [{ id: 'R001', message: 'dangling' }, { id: 'R002', message: 'duplicate' }],
        warnings: [],
        p3_findings: [],
    };
    assertEqual(computeScore(results), 100, 'Two P0 errors = 100');
});

test('P1 warnings add 20 each', () => {
    const results = {
        errors: [],
        warnings: [{ id: 'R010', message: 'overlap' }, { id: 'R011', message: 'through' }],
        p3_findings: [],
    };
    assertEqual(computeScore(results), 40, 'Two P1 warnings = 40');
});

test('P2 warnings add 1-3 each', () => {
    const results = {
        errors: [],
        warnings: [{ id: 'R020', message: 'off-grid' }, { id: 'R022', message: 'short' }],
        p3_findings: [],
    };
    assertEqual(computeScore(results), 4, 'R020(1) + R022(3) = 4');
});

test('P3 findings add 5 each', () => {
    const results = {
        errors: [],
        warnings: [],
        p3_findings: [
            { id: 'R030', message: 'overflow' },
            { id: 'R036', message: 'no bg' },
            { id: 'R037', message: 'spacing' },
        ],
    };
    assertEqual(computeScore(results), 15, 'Three P3 findings = 15');
});

test('mixed findings compute correctly', () => {
    const results = {
        errors: [{ id: 'R003', message: 'parent' }],        // P0 = 50
        warnings: [{ id: 'R012', message: 'crossing' }],     // P1 = 20
        p3_findings: [{ id: 'R035', message: 'corner' }],    // P3 = 5
    };
    assertEqual(computeScore(results), 75, '50 + 20 + 5 = 75');
});

test('unknown ID defaults to weight 1', () => {
    const results = {
        errors: [],
        warnings: [],
        p3_findings: [{ id: 'R999', message: 'unknown' }],
    };
    assertEqual(computeScore(results), 1, 'Unknown ID should default to 1');
});

// ═══════════════════════════════════════════════════════════════════════
// Integration: Full Audit Pipeline
// ═══════════════════════════════════════════════════════════════════════

console.log('\nIntegration — full pipeline:');

test('clean diagram produces no findings', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B, VERTEX_C, EDGE_AB]);
    const tmpPath = writeTemp(content);
    try {
        const xmlData = parseXML(tmpPath);
        const findings = [
            ...checkR030(xmlData.cells),
            ...checkR035(xmlData),
            ...checkR036(xmlData.cells),
            ...checkR037(xmlData.cells),
            ...checkR038(xmlData.cells),
        ];
        assert(findings.length === 0, `Clean diagram should have 0 findings, got ${findings.length}: ${JSON.stringify(findings)}`);
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('diagram with multiple issues catches all', () => {
    // Narrow shape (R030) + Corner edge (R035) + Labeled edge without bg (R036)
    const narrow = '<mxCell id="2" value="This is a very long overflowing label text" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="60" height="40" as="geometry" /></mxCell>';
    const vertex = '<mxCell id="3" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="340" y="40" width="200" height="60" as="geometry" /></mxCell>';
    const labeledEdge = '<mxCell id="5" value="my label" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0;exitY=0;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry" /></mxCell>';
    const content = makeDrawio([narrow, vertex, labeledEdge]);
    const tmpPath = writeTemp(content);
    try {
        const xmlData = parseXML(tmpPath);
        const allFindings = [
            ...checkR030(xmlData.cells),
            ...checkR035(xmlData),
            ...checkR036(xmlData.cells),
            ...checkR037(xmlData.cells),
            ...checkR038(xmlData.cells),
        ];
        const ids = allFindings.map(f => f.id);
        assert(ids.includes('R030'), 'Should include R030 (label overflow)');
        assert(ids.includes('R035'), 'Should include R035 (corner connection)');
        assert(ids.includes('R036'), 'Should include R036 (missing label bg)');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

// ═══════════════════════════════════════════════════════════════════════
// CLI Exit Code Tests
// ═══════════════════════════════════════════════════════════════════════

console.log('\nCLI behavior:');

test('--help exits 0 and prints usage', () => {
    const result = spawnSync('node', [path.join(__dirname, '..', '..', 'skills', 'xiaosu-draw-ai', 'scripts', 'audit.js'), '--help'], {
        encoding: 'utf-8',
        timeout: 10000,
    });
    assertEqual(result.status, 0, '--help should exit 0');
    assert(result.stdout.includes('Usage:'), '--help should print usage');
});

test('missing file argument shows usage', () => {
    const result = spawnSync('node', [path.join(__dirname, '..', '..', 'skills', 'xiaosu-draw-ai', 'scripts', 'audit.js')], {
        encoding: 'utf-8',
        timeout: 10000,
    });
    // With no args, prints help to stdout and exits 0
    assertEqual(result.status, 0, 'No args should exit 0 (shows help)');
    assert(result.stdout.includes('Usage:'), 'Should print usage on stdout');
});

test('nonexistent file exits 1', () => {
    const result = spawnSync('node', [path.join(__dirname, '..', '..', 'skills', 'xiaosu-draw-ai', 'scripts', 'audit.js'), '/nonexistent/path.drawio'], {
        encoding: 'utf-8',
        timeout: 10000,
    });
    assertEqual(result.status, 1, 'Nonexistent file should exit 1');
});

test('valid file with --json produces JSON output', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B]);
    const tmpPath = writeTemp(content);
    try {
        const result = spawnSync('node', [path.join(__dirname, '..', '..', 'skills', 'xiaosu-draw-ai', 'scripts', 'audit.js'), tmpPath, '--json'], {
            encoding: 'utf-8',
            timeout: 10000,
        });
        const output = JSON.parse(result.stdout);
        assert(output.file === tmpPath, 'JSON should include file path');
        assert(typeof output.error_count === 'number', 'JSON should include error_count');
        assert(typeof output.warning_count === 'number', 'JSON should include warning_count');
        assert(typeof output.p3_count === 'number', 'JSON should include p3_count');
        assert(Array.isArray(output.errors), 'errors should be array');
        assert(Array.isArray(output.warnings), 'warnings should be array');
        assert(Array.isArray(output.p3_findings), 'p3_findings should be array');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('--no-subprocess skips validate.py', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B, EDGE_AB]);
    const tmpPath = writeTemp(content);
    try {
        const result = spawnSync('node', [path.join(__dirname, '..', '..', 'skills', 'xiaosu-draw-ai', 'scripts', 'audit.js'), tmpPath, '--json', '--no-subprocess'], {
            encoding: 'utf-8',
            timeout: 10000,
        });
        const output = JSON.parse(result.stdout);
        assert(output.error_count === 0 && output.warning_count === 0,
            '--no-subprocess should skip validate.py (no P0-P2 checks from subprocess)');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

test('--score flag includes score in output', () => {
    const content = makeDrawio([VERTEX_A, VERTEX_B, EDGE_AB]);
    const tmpPath = writeTemp(content);
    try {
        const result = spawnSync('node', [path.join(__dirname, '..', '..', 'skills', 'xiaosu-draw-ai', 'scripts', 'audit.js'), tmpPath, '--json', '--score', '--no-subprocess'], {
            encoding: 'utf-8',
            timeout: 10000,
        });
        const output = JSON.parse(result.stdout);
        assert(typeof output.score === 'number', '--score should include numeric score');
    } finally {
        fs.unlinkSync(tmpPath);
    }
});

// ═══════════════════════════════════════════════════════════════════════
// Result
// ═══════════════════════════════════════════════════════════════════════

console.log(`\nResults: ${passed}/${passed + failed} passed`);
if (failed === 0) {
    console.log('=== ALL TESTS PASSED ===');
    process.exit(0);
} else {
    console.error('=== FAILURES DETECTED ===');
    process.exit(1);
}
