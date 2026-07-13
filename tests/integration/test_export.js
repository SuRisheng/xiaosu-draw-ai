#!/usr/bin/env node
/**
 * test_export.js — Integration test for export.js.
 *
 * Creates a minimal valid .drawio file in a temp directory, exports it to PNG,
 * and verifies the output file exists and is non-empty.
 *
 * Usage:
 *   node tests/integration/test_export.js
 *
 * Requires: draw.io CLI (>= 24.0.0). Skips gracefully if not available.
 *
 * Environment: Windows, macOS, Linux. Uses os.tmpdir() for temp files.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const os = require('os');

const ROOT = path.resolve(__dirname, '..', '..');
const EXPORT_SCRIPT = path.join(ROOT, 'skills', 'xiaosu-draw-ai', 'scripts', 'export.js');

// Minimal valid .drawio file
const MINIMAL_DRAWIO = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="test" version="26.0.0" type="device">
  <diagram name="Test" id="test-1">
    <mxGraphModel dx="1434" dy="810" grid="1" gridSize="10" guides="1" tooltips="1"
      connect="1" arrows="1" fold="1" page="1" pageScale="1"
      pageWidth="1600" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="2" value="Test Service"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="200" height="60" as="geometry" />
        </mxCell>
        <mxCell id="3" value="Test DB"
          style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#d5e8d4;strokeColor=#82b366;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="40" y="180" width="200" height="80" as="geometry" />
        </mxCell>
        <mxCell id="4" value="Query"
          style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;strokeColor=#555555;fontFamily=Helvetica;fontSize=10;labelBackgroundColor=#FFFFFF;"
          edge="1" parent="1" source="2" target="3">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;

// UserObject format (Pipeline B / Mermaid v30+) — same diagram, different cell format
const USEROBJECT_DRAWIO = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="Electron">
  <diagram name="Test-Export-UO" id="test-uo">
    <mxGraphModel dx="-339" dy="-199" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="0" page="0" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <UserObject label="Test Service" mermaidId="n:svc" id="2">
          <mxCell parent="1" style="rounded=1;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1">
            <mxGeometry height="60" width="200" x="40" y="40" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="Test DB" mermaidId="n:db" id="3">
          <mxCell parent="1" style="shape=cylinder3;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1">
            <mxGeometry height="80" width="200" x="40" y="180" as="geometry" />
          </mxCell>
        </UserObject>
        <UserObject label="" mermaidId="e:edge" id="4">
          <mxCell edge="1" parent="1" source="2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;endArrow=classic;endFill=1;" target="3">
            <mxGeometry relative="1" as="geometry" />
          </mxCell>
        </UserObject>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;

// ── Helpers ────────────────────────────────────────────────────────

function detectDrawio() {
    const platform = process.platform;
    const candidates = platform === 'win32'
        ? ['drawio', 'draw.io', 'C:\\Program Files\\draw.io\\draw.io.exe']
        : platform === 'darwin'
            ? ['drawio', 'draw.io', '/Applications/draw.io.app/Contents/MacOS/draw.io']
            : ['drawio', 'draw.io', '/usr/bin/drawio', '/usr/local/bin/drawio'];

    for (const bin of candidates) {
        try {
            const result = spawnSync(bin, ['--version'], {
                timeout: 5000,
                windowsHide: true,
                stdio: 'pipe',
            });
            if (result.status === 0 || (result.stdout && result.stdout.toString().trim())) {
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
    const tmpDir = path.join(os.tmpdir(), `xiaosu-draw-ai-test-export-${timestamp}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
}

function cleanup(tmpDir) {
    if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

// ── Test Cases ─────────────────────────────────────────────────────

function testExportPreview(inputFile, tmpDir) {
    console.log('  Test: Preview export (--width 2000)');
    try {
        const result = spawnSync('node', [EXPORT_SCRIPT, inputFile], {
            cwd: tmpDir,
            timeout: 60000,
            windowsHide: true,
            stdio: 'pipe',
            encoding: 'utf-8',
        });

        if (result.status !== 0) {
            console.error(`    ✗ FAIL: export exited with ${result.status}`);
            console.error(`    stderr: ${result.stderr}`);
            return false;
        }

        // Check for output file
        const expectedOutput = inputFile.replace('.drawio', '.png');
        if (fs.existsSync(expectedOutput)) {
            const stats = fs.statSync(expectedOutput);
            if (stats.size > 0) {
                console.log(`    ✓ PASS: ${expectedOutput} (${(stats.size / 1024).toFixed(1)} KB)`);
                return true;
            }
            console.error(`    ✗ FAIL: Output file is empty`);
            return false;
        }
        console.error(`    ✗ FAIL: Output file not found: ${expectedOutput}`);
        return false;
    } catch (err) {
        console.error(`    ✗ FAIL: ${err.message}`);
        return false;
    }
}

function testExportFinal(inputFile, tmpDir) {
    console.log('  Test: Final export (--final --scale 2)');
    try {
        const result = spawnSync('node', [EXPORT_SCRIPT, inputFile, '--final', '--scale', '2'], {
            cwd: tmpDir,
            timeout: 60000,
            windowsHide: true,
            stdio: 'pipe',
            encoding: 'utf-8',
        });

        if (result.status !== 0) {
            console.error(`    ✗ FAIL: final export exited with ${result.status}`);
            return false;
        }

        // Final export produces <input>.drawio.png
        const expectedOutput = inputFile + '.png';
        if (fs.existsSync(expectedOutput)) {
            const stats = fs.statSync(expectedOutput);
            if (stats.size > 0) {
                console.log(`    ✓ PASS: ${expectedOutput} (${(stats.size / 1024).toFixed(1)} KB)`);
                return true;
            }
            console.error(`    ✗ FAIL: Final output file is empty`);
            return false;
        }
        console.error(`    ✗ FAIL: Final output file not found: ${expectedOutput}`);
        return false;
    } catch (err) {
        console.error(`    ✗ FAIL: ${err.message}`);
        return false;
    }
}

function testExportSVG(inputFile, tmpDir) {
    console.log('  Test: SVG export');
    try {
        const result = spawnSync('node', [EXPORT_SCRIPT, inputFile, '--format', 'svg'], {
            cwd: tmpDir,
            timeout: 60000,
            windowsHide: true,
            stdio: 'pipe',
            encoding: 'utf-8',
        });

        if (result.status !== 0) {
            console.error(`    ✗ FAIL: SVG export exited with ${result.status}`);
            return false;
        }

        const expectedOutput = inputFile.replace('.drawio', '.svg');
        if (fs.existsSync(expectedOutput)) {
            const stats = fs.statSync(expectedOutput);
            if (stats.size > 0) {
                // Verify it's actually SVG
                const content = fs.readFileSync(expectedOutput, 'utf-8');
                if (content.includes('<svg')) {
                    console.log(`    ✓ PASS: ${expectedOutput} (${(stats.size / 1024).toFixed(1)} KB, valid SVG)`);
                    return true;
                }
                console.error(`    ✗ FAIL: Output file is not valid SVG (missing <svg> tag)`);
                return false;
            }
            console.error(`    ✗ FAIL: SVG output file is empty`);
            return false;
        }
        console.error(`    ✗ FAIL: SVG output file not found: ${expectedOutput}`);
        return false;
    } catch (err) {
        console.error(`    ✗ FAIL: ${err.message}`);
        return false;
    }
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
    console.log('=== Integration Test: export.js ===\n');

    // Check draw.io CLI
    const drawioBin = detectDrawio();
    if (!drawioBin) {
        console.log('SKIP: draw.io CLI not found. Export tests require draw.io desktop app.');
        console.log('Install from: https://www.drawio.com/');
        console.log('All tests skipped gracefully.');
        process.exit(0);
    }
    console.log(`draw.io CLI: ${drawioBin}\n`);

    // Create temp directory
    const tmpDir = createTempDir();

    // Write minimal drawio file
    const inputFile = path.join(tmpDir, 'test-export.drawio');
    fs.writeFileSync(inputFile, MINIMAL_DRAWIO, 'utf-8');
    console.log(`Test diagram: ${inputFile}\n`);

    let passed = 0;
    let failed = 0;

    try {
        // Run tests
        if (testExportPreview(inputFile, tmpDir)) passed++; else failed++;
        if (testExportFinal(inputFile, tmpDir)) passed++; else failed++;
        if (testExportSVG(inputFile, tmpDir)) passed++; else failed++;

        // Test 4: UserObject (Pipeline B / Mermaid v30+) format export
        const uoInputFile = path.join(tmpDir, 'test-export-uo.drawio');
        fs.writeFileSync(uoInputFile, USEROBJECT_DRAWIO, 'utf-8');
        if (testExportPreview(uoInputFile, tmpDir)) passed++; else failed++;

        console.log(`\nResults: ${passed}/${passed + failed} passed`);
        if (failed === 0) {
            console.log('=== ALL TESTS PASSED ===');
            process.exit(0);
        } else {
            console.error('=== FAILURES DETECTED ===');
            process.exit(1);
        }
    } finally {
        cleanup(tmpDir);
        console.log(`Cleaned up: ${tmpDir}`);
    }
}

main();
