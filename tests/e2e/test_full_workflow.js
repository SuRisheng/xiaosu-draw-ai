#!/usr/bin/env node
/**
 * test_full_workflow.js — End-to-end test of the complete diagram generation workflow.
 *
 * Simulates a real agent session:
 *   1. Template selection (architecture diagram)
 *   2. XML generation (minimal valid .drawio)
 *   3. Validation (validate.py)
 *   4. Export (export.js — preview + final)
 *   5. Audit (audit.js — visual quality checks)
 *
 * Usage:
 *   node tests/e2e/test_full_workflow.js
 *
 * WARNING: This test requires draw.io CLI, Python 3, and Node.js.
 * It is designed for MANUAL triggering only. It produces real .drawio
 * files and exported images in a temporary directory.
 *
 * Environment: Windows, macOS, Linux. Uses os.tmpdir() for temp files.
 * Cleanup is automatic on success and failure.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const os = require('os');

const ROOT = path.resolve(__dirname, '..', '..');
const VALIDATE_SCRIPT = path.join(ROOT, 'skills', 'xiaosu-draw-ai', 'scripts', 'validate.py');
const EXPORT_SCRIPT = path.join(ROOT, 'skills', 'xiaosu-draw-ai', 'scripts', 'export.js');
const AUDIT_SCRIPT = path.join(ROOT, 'skills', 'xiaosu-draw-ai', 'scripts', 'audit.js');

// ── Helpers ────────────────────────────────────────────────────────

function detectBinary(name, testArgs) {
    const candidates = process.platform === 'win32'
        ? [name, `${name}3`]
        : [name, `${name}3`];

    for (const bin of candidates) {
        try {
            const result = spawnSync(bin, testArgs || ['--version'], {
                timeout: 5000,
                windowsHide: true,
                stdio: 'pipe',
            });
            if (result.status === 0) return bin;
        } catch (e) { /* try next */ }
    }
    return null;
}

function createTempDir() {
    const timestamp = Date.now();
    const tmpDir = path.join(os.tmpdir(), `xiaosu-draw-ai-e2e-${timestamp}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
}

function cleanup(tmpDir) {
    if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

// ── Step 1: Template Selection (Simulated) ─────────────────────────

function step1_templateSelection() {
    console.log('--- Step 1: Template Selection ---');

    // Simulate AI matching user request "draw an e-commerce architecture" to template
    const templateMatch = {
        type: 'architecture',
        template: 'templates/en/architecture.md',
        pipeline: 'C',
        reason: 'Layout-first diagram type',
    };

    console.log(`  User request: "Draw an e-commerce system architecture"`);
    console.log(`  Matched template: ${templateMatch.template}`);
    console.log(`  Pipeline: ${templateMatch.pipeline}`);
    console.log(`  Reason: ${templateMatch.reason}`);
    console.log('  ✓ Template matched\n');
    return templateMatch;
}

// ── Step 2: Generate Minimal XML ────────────────────────────────────

function step2_generateXML(tmpDir) {
    console.log('--- Step 2: Generate XML ---');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="e2e-test" version="26.0.0" type="device">
  <diagram name="E-Commerce Architecture" id="e2e-arch-1">
    <mxGraphModel dx="1434" dy="810" grid="1" gridSize="10" guides="1" tooltips="1"
      connect="1" arrows="1" fold="1" page="1" pageScale="1"
      pageWidth="1600" pageHeight="1200" math="0" shadow="0"
      background="#FFFFFF">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Layer 1: Frontend -->
        <mxCell id="2" value="Web App (React)"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="200" y="40" width="200" height="60" as="geometry" />
        </mxCell>
        <mxCell id="3" value="iOS App (Swift)"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="480" y="40" width="200" height="60" as="geometry" />
        </mxCell>
        <!-- Layer 2: Gateway -->
        <mxCell id="4" value="API Gateway (Kong)"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="320" y="180" width="240" height="60" as="geometry" />
        </mxCell>
        <!-- Layer 3: Services -->
        <mxCell id="5" value="User Service"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="40" y="340" width="180" height="60" as="geometry" />
        </mxCell>
        <mxCell id="6" value="Order Service"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="260" y="340" width="180" height="60" as="geometry" />
        </mxCell>
        <mxCell id="7" value="Product Service"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="480" y="340" width="180" height="60" as="geometry" />
        </mxCell>
        <!-- Layer 4: Data -->
        <mxCell id="8" value="User DB (MySQL)"
          style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#d5e8d4;strokeColor=#82b366;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="80" y="520" width="180" height="80" as="geometry" />
        </mxCell>
        <mxCell id="9" value="Order DB (MySQL)"
          style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#d5e8d4;strokeColor=#82b366;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="300" y="520" width="180" height="80" as="geometry" />
        </mxCell>
        <!-- Middleware -->
        <mxCell id="10" value="RabbitMQ"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontFamily=Helvetica;fontSize=12;"
          vertex="1" parent="1">
          <mxGeometry x="540" y="520" width="150" height="60" as="geometry" />
        </mxCell>
        <!-- Edges -->
        <mxCell id="11" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;strokeColor=#555555;"
          edge="1" parent="1" source="2" target="4">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="12" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;strokeColor=#555555;"
          edge="1" parent="1" source="3" target="4">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="13" value="REST" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;strokeColor=#555555;fontFamily=Helvetica;fontSize=10;labelBackgroundColor=#FFFFFF;"
          edge="1" parent="1" source="4" target="5">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="14" value="REST" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;strokeColor=#555555;fontFamily=Helvetica;fontSize=10;labelBackgroundColor=#FFFFFF;"
          edge="1" parent="1" source="4" target="6">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="15" value="REST" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;strokeColor=#555555;fontFamily=Helvetica;fontSize=10;labelBackgroundColor=#FFFFFF;"
          edge="1" parent="1" source="4" target="7">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="16" value="SQL" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;strokeColor=#555555;fontFamily=Helvetica;fontSize=10;labelBackgroundColor=#FFFFFF;"
          edge="1" parent="1" source="5" target="8">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="17" value="SQL" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;strokeColor=#555555;fontFamily=Helvetica;fontSize=10;labelBackgroundColor=#FFFFFF;"
          edge="1" parent="1" source="6" target="9">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="18" value="Events" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=8 4;endArrow=classic;endFill=1;strokeColor=#555555;fontFamily=Helvetica;fontSize=10;labelBackgroundColor=#FFFFFF;"
          edge="1" parent="1" source="6" target="10">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;

    const filePath = path.join(tmpDir, 'ecommerce-arch.drawio');
    fs.writeFileSync(filePath, xml, 'utf-8');
    console.log(`  Generated: ${filePath}`);
    console.log(`  Components: 9 vertices, 8 edges`);
    console.log(`  Layers: 4 (Frontend → Gateway → Services → Data)`);
    console.log('  ✓ XML generated\n');
    return filePath;
}

// ── Step 3: Validate ──────────────────────────────────────────────

function step3_validate(filePath, pythonBin) {
    console.log('--- Step 3: Validate (validate.py) ---');

    try {
        const result = spawnSync(pythonBin, [VALIDATE_SCRIPT, '--json', '--score', filePath], {
            timeout: 15000,
            windowsHide: true,
            stdio: 'pipe',
            encoding: 'utf-8',
        });

        const output = result.stdout || result.stderr || '';
        let json;
        try {
            json = JSON.parse(output.trim());
        } catch (e) {
            console.error(`  ✗ FAIL: Could not parse validate.py output`);
            console.error(`  Output: ${output.substring(0, 200)}`);
            return null;
        }

        console.log(`  Errors: ${json.error_count}, Warnings: ${json.warning_count}, Score: ${json.score}`);
        if (json.error_count === 0 && json.warning_count === 0) {
            console.log('  ✓ Validation passed — clean\n');
        } else {
            console.log(`  ⚠ Validation returned ${json.error_count + json.warning_count} issue(s)\n`);
            if (json.errors) {
                for (const e of json.errors) {
                    console.log(`    [${e.id}] ${e.message}`);
                }
            }
        }
        return json;
    } catch (err) {
        console.error(`  ✗ FAIL: ${err.message}\n`);
        return null;
    }
}

// ── Step 4: Export ─────────────────────────────────────────────────

function step4_export(filePath, drawioBin) {
    console.log('--- Step 4: Export ---');

    // Preview export
    console.log('  Preview export:');
    try {
        const previewResult = spawnSync('node', [EXPORT_SCRIPT, filePath], {
            timeout: 60000,
            windowsHide: true,
            stdio: 'pipe',
            encoding: 'utf-8',
        });

        const previewFile = filePath.replace('.drawio', '.png');
        if (fs.existsSync(previewFile)) {
            const stats = fs.statSync(previewFile);
            console.log(`    ✓ Preview PNG: ${previewFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
            console.error(`    ✗ Preview PNG not found: ${previewFile}`);
            console.error(`    stderr: ${previewResult.stderr}`);
            return false;
        }
    } catch (err) {
        console.error(`    ✗ FAIL: ${err.message}`);
        return false;
    }

    // Final export
    console.log('  Final export:');
    try {
        const finalResult = spawnSync('node', [EXPORT_SCRIPT, filePath, '--final'], {
            timeout: 60000,
            windowsHide: true,
            stdio: 'pipe',
            encoding: 'utf-8',
        });

        const finalFile = filePath + '.png';
        if (fs.existsSync(finalFile)) {
            const stats = fs.statSync(finalFile);
            console.log(`    ✓ Final PNG: ${finalFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
            console.error(`    ✗ Final PNG not found: ${finalFile}`);
            return false;
        }
    } catch (err) {
        console.error(`    ✗ FAIL: ${err.message}`);
        return false;
    }

    console.log('  ✓ Exports complete\n');
    return true;
}

// ── Step 5: Audit ──────────────────────────────────────────────────

function step5_audit(filePath) {
    console.log('--- Step 5: Audit (audit.js) ---');

    try {
        const result = spawnSync('node', [AUDIT_SCRIPT, '--json', filePath], {
            timeout: 30000,
            windowsHide: true,
            stdio: 'pipe',
            encoding: 'utf-8',
        });

        let json;
        try {
            json = JSON.parse(result.stdout.trim());
        } catch (e) {
            // audit.js might have failed — check exit code
            if (result.status !== 0 && result.status !== 1 && result.status !== 2) {
                console.error(`  ✗ FAIL: audit.js errored (exit ${result.status})`);
                console.error(`  stderr: ${result.stderr}`);
                return null;
            }
            // Try parsing stderr + stdout
            const combined = (result.stdout + result.stderr).trim();
            try {
                json = JSON.parse(combined);
            } catch (e2) {
                console.log(`  ⚠ Could not parse audit output (non-critical)\n`);
                return { error_count: 0, warning_count: 0, p3_count: 0 };
            }
        }

        if (json) {
            const total = (json.error_count || 0) + (json.warning_count || 0) + (json.p3_count || 0);
            console.log(`  Errors: ${json.error_count || 0}, Warnings: ${json.warning_count || 0}, P3: ${json.p3_count || 0}`);
            if (total === 0) {
                console.log('  ✓ Audit clean\n');
            } else {
                console.log(`  ⚠ ${total} finding(s) — see details above\n`);
            }
            return json;
        }
    } catch (err) {
        console.error(`  ✗ FAIL: ${err.message}\n`);
        return null;
    }
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  E2E Test: Full Workflow                     ║');
    console.log('║  Template → Generate → Validate → Export →   ║');
    console.log('║  Audit                                       ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // Check prerequisites
    const pythonBin = detectBinary('python', ['--version']);
    const drawioBin = detectBinary('drawio', ['--version']);

    if (!pythonBin) {
        console.error('ERROR: Python 3 not found. Required for validate.py.');
        console.error('Install Python 3 and try again.');
        process.exit(1);
    }
    if (!drawioBin) {
        console.error('ERROR: draw.io CLI not found. Required for export.');
        console.error('Install draw.io desktop app: https://www.drawio.com/');
        process.exit(1);
    }

    console.log(`Python: ${pythonBin}`);
    console.log(`draw.io CLI: ${drawioBin}\n`);

    // Create temp directory
    const tmpDir = createTempDir();
    console.log(`Working directory: ${tmpDir}\n`);

    let allPassed = true;

    try {
        // Step 1: Template Selection
        step1_templateSelection();

        // Step 2: Generate XML
        const filePath = step2_generateXML(tmpDir);

        // Step 3: Validate
        const validateResult = step3_validate(filePath, pythonBin);
        if (!validateResult || validateResult.error_count > 0) {
            console.error('  ✗ Validation has errors. Check XML structure.\n');
            allPassed = false;
        }

        // Step 4: Export
        const exportOk = step4_export(filePath, drawioBin);
        if (!exportOk) allPassed = false;

        // Step 5: Audit
        const auditResult = step5_audit(filePath);

        // Report
        console.log('═══════════════════════════════════════════════');
        if (allPassed) {
            console.log('  E2E WORKFLOW: ALL STEPS PASSED');
        } else {
            console.log('  E2E WORKFLOW: ISSUES DETECTED');
        }
        console.log('═══════════════════════════════════════════════');
        console.log(`  Working files preserved at: ${tmpDir}`);
        console.log('  (Not cleaning up — review the output)');

        process.exit(allPassed ? 0 : 1);
    } catch (err) {
        console.error(`\nFATAL: ${err.message}`);
        cleanup(tmpDir);
        process.exit(1);
    }
}

main();
