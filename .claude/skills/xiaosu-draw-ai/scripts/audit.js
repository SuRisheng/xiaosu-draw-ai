#!/usr/bin/env node
/**
 * audit.js — Visual quality audit for .drawio files.
 *
 * Complements validate.py (structural correctness) with visual-quality checks.
 * Some P3 rules can be heuristically detected from XML attributes — this script
 * applies those checks and aggregates results into a single audit report.
 *
 * Usage:
 *   node audit.js <file.drawio>               # Run all checks
 *   node audit.js <file.drawio> --json        # JSON output
 *   node audit.js <file.drawio> --score       # Print readability score
 *   node audit.js <file.drawio> --strict      # Warnings → errors
 *
 * Exit codes:
 *   0 — Pass (or warnings only, unless --strict)
 *   1 — P1/P2 violations found
 *   2 — P0 blocking errors found
 *
 * References:
 *   - references/rules.md (P0-P3 rule definitions)
 *   - references/visual-audit.md (P3 detection + fix guidance)
 *   - scripts/validate.py (structural checks — run as subprocess)
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Argument Parsing ──────────────────────────────────────────────

function parseArgs() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`Usage: node audit.js <file.drawio> [options]

Options:
  --json         Output results as JSON
  --score        Print readability score (0 = perfect)
  --strict       Treat warnings as errors (non-zero exit)
  --no-subprocess  Skip validate.py subprocess (XML-only checks)
  --help, -h     Show this help

Checks performed:

  P0 (blocking):
    R001 — Dangling edges (source/target references missing)
    R002 — Duplicate / reserved IDs
    R003 — Parent-child breakage
    R004 — XML syntax errors
    R005 — Missing geometry (vertices) / self-closing edges

  P1 (must fix):
    R010 — Overlapping sibling components
    R011 — Edge passing through unrelated vertex
    R012 — Edge crossings
    R013 — Insufficient spacing (< 80px)
    R014 — Off-canvas (negative coordinates)
    R015 — Self-closing edge tags

  P2 (should fix):
    R020 — Off-grid coordinates (not multiples of 10px)
    R021 — Non-centered connection points
    R022 — Arrow final segment < 15px

  P3 (visual — heuristic from XML):
    R030 — Label overflow risk (text length vs shape width)
    R035 — Corner connections (within 20px of shape corners)
    R036 — Missing label background on labeled edges
    R037 — Insufficient visual spacing
    R038 — Z-order violations (edges rendered above vertices)
`);
        process.exit(0);
    }

    const input = args[0];
    if (!fs.existsSync(input)) {
        console.error(`Error: input file not found: ${input}`);
        process.exit(1);
    }

    return {
        input,
        json: args.includes('--json'),
        score: args.includes('--score'),
        strict: args.includes('--strict'),
        noSubprocess: args.includes('--no-subprocess'),
    };
}

// ── XML Parsing Helpers ───────────────────────────────────────────

function parseXML(filepath) {
    // Lightweight XML parser for draw.io files.
    // Extracts cells with their attributes and geometry.
    const content = fs.readFileSync(filepath, 'utf-8');

    // Extract mxCell elements using regex (sufficient for audit heuristics)
    const cellRegex = /<mxCell\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/gi;
    const cells = [];

    let match;
    while ((match = cellRegex.exec(content)) !== null) {
        const attrStr = match[1];
        const innerXml = match[2] || '';

        // Parse attributes
        const attrs = {};
        const attrRegex = /(\w+(?::\w+)?)="([^"]*)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
            attrs[attrMatch[1]] = attrMatch[2];
        }

        // Parse geometry if present
        const geomMatch = innerXml.match(/<mxGeometry\s+([^>]*?)(?:\/>|>)/i);
        let geometry = null;
        if (geomMatch) {
            geometry = {};
            const geomAttrRegex = /(\w+)="([^"]*)"/g;
            let ga;
            while ((ga = geomAttrRegex.exec(geomMatch[1])) !== null) {
                const key = ga[1];
                const val = ga[2];
                if (key === 'as') continue;
                geometry[key] = key === 'relative' ? val : parseFloat(val);
            }
        }

        // Parse waypoints if present
        const points = [];
        const ptsMatch = innerXml.match(/<Array\s+as="points"[\s\S]*?<\/Array>/i);
        if (ptsMatch) {
            const ptRegex = /<mxPoint\s+x="([^"]*)"\s+y="([^"]*)"/gi;
            let pm;
            while ((pm = ptRegex.exec(ptsMatch[0])) !== null) {
                points.push({ x: parseFloat(pm[1]), y: parseFloat(pm[2]) });
            }
        }

        cells.push({
            id: attrs.id || '',
            parent: attrs.parent || '',
            value: attrs.value || '',
            style: attrs.style || '',
            vertex: attrs.vertex === '1',
            edge: attrs.edge === '1',
            source: attrs.source || '',
            target: attrs.target || '',
            geometry,
            points,
        });
    }

    return { content, cells };
}

// ── Visual Heuristic Checks ───────────────────────────────────────

/**
 * R030: Label overflow risk.
 * Heuristic: estimate if text length exceeds shape width.
 * Approx: 1 char ≈ 7px at 12px font size, 1 char ≈ 8px at 14px.
 */
function checkR030(cells) {
    const findings = [];
    const CHAR_WIDTH = 7; // approx px per char at default 12px font

    for (const cell of cells) {
        if (!cell.vertex || !cell.geometry || !cell.value) continue;
        // Skip edge labels, containers (they can have long content)
        const style = cell.style || '';
        if (style.includes('swimlane') || style.includes('text;')) continue;

        const text = cell.value.replace(/&#xa;/g, '\n').replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        const lines = text.split('\n');
        const maxLineLen = Math.max(...lines.map(l => l.length));
        const estTextWidth = maxLineLen * CHAR_WIDTH;
        const shapeWidth = cell.geometry.width || 120;

        // Allow 10px padding on each side
        if (estTextWidth > shapeWidth - 20) {
            findings.push({
                id: 'R030',
                message: `Label overflow risk: id='${cell.id}' text "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}" (~${estTextWidth}px) may exceed shape width (${shapeWidth}px)`,
            });
        }
    }
    return findings;
}

/**
 * R035: Corner connections.
 * Check if edge endpoints are within 20px of shape corners.
 */
function checkR035(xmlData) {
    const findings = [];
    const { cells } = xmlData;
    const vertices = cells.filter(c => c.vertex && c.geometry);

    for (const edge of cells) {
        if (!edge.edge) continue;

        for (const vertex of vertices) {
            if (edge.source !== vertex.id && edge.target !== vertex.id) continue;

            const vg = vertex.geometry;
            if (!vg || vg.x === undefined || vg.y === undefined) continue;

            const isSource = edge.source === vertex.id;
            const exitX = edge.style.match(/exitX=([^;]*)/);
            const exitY = edge.style.match(/exitY=([^;]*)/);
            const entryX = edge.style.match(/entryX=([^;]*)/);
            const entryY = edge.style.match(/entryY=([^;]*)/);

            const cx = isSource ? (exitX ? parseFloat(exitX[1]) : 0.5)
                                : (entryX ? parseFloat(entryX[1]) : 0.5);
            const cy = isSource ? (exitY ? parseFloat(exitY[1]) : 0.5)
                                : (entryY ? parseFloat(entryY[1]) : 0.5);

            // Corner if both cx and cy are within 0.2 of 0 or 1
            const isCornerX = cx < 0.2 || cx > 0.8;
            const isCornerY = cy < 0.2 || cy > 0.8;

            if (isCornerX && isCornerY) {
                // Check if the actual connection point on the shape is within 20px of a corner
                const shapeX = vg.x + cx * (vg.width || 0);
                const shapeY = vg.y + cy * (vg.height || 0);

                const corners = [
                    { x: vg.x, y: vg.y },
                    { x: vg.x + (vg.width || 0), y: vg.y },
                    { x: vg.x, y: vg.y + (vg.height || 0) },
                    { x: vg.x + (vg.width || 0), y: vg.y + (vg.height || 0) },
                ];

                const nearCorner = corners.some(c =>
                    Math.abs(shapeX - c.x) < 20 && Math.abs(shapeY - c.y) < 20
                );

                if (nearCorner) {
                    findings.push({
                        id: 'R035',
                        message: `Corner connection: edge id='${edge.id}' connects to id='${vertex.id}' near a corner (${isSource ? 'exit' : 'entry'} at ${(cx * 100).toFixed(0)}%,${(cy * 100).toFixed(0)}%)`,
                    });
                }
            }
        }
    }
    return findings;
}

/**
 * R036: Missing label background on labeled edges.
 */
function checkR036(cells) {
    const findings = [];

    for (const edge of cells) {
        if (!edge.edge || !edge.value) continue;
        const style = edge.style || '';
        if (!style.includes('labelBackgroundColor')) {
            findings.push({
                id: 'R036',
                message: `Missing label background: edge id='${edge.id}' has label "${edge.value.substring(0, 30)}${edge.value.length > 30 ? '...' : ''}" but no labelBackgroundColor`,
            });
        }
    }
    return findings;
}

/**
 * R037: Insufficient component spacing (< 80px).
 * Checks bounding box distances between all vertex pairs.
 */
function checkR037(cells) {
    const findings = [];
    const MIN_SPACING = 80;
    const vertices = cells.filter(c => c.vertex && c.geometry &&
        c.geometry.x !== undefined && c.geometry.y !== undefined &&
        c.geometry.width > 0 && c.geometry.height > 0);

    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            const a = vertices[i];
            const b = vertices[j];

            // Compute axis-aligned gap between bounding boxes
            const aLeft = a.geometry.x;
            const aRight = a.geometry.x + a.geometry.width;
            const aTop = a.geometry.y;
            const aBottom = a.geometry.y + a.geometry.height;

            const bLeft = b.geometry.x;
            const bRight = b.geometry.x + b.geometry.width;
            const bTop = b.geometry.y;
            const bBottom = b.geometry.y + b.geometry.height;

            const hGap = Math.max(aLeft - bRight, bLeft - aRight);
            const vGap = Math.max(aTop - bBottom, bTop - aBottom);
            const minGap = Math.max(hGap, vGap);

            // Only flag positive gaps (non-overlapping) that are too small
            if (minGap > 0 && minGap < MIN_SPACING && hGap > 0 && vGap > 0) {
                // Only report reasonably close pairs (to avoid noise)
                const centerDist = Math.sqrt(
                    Math.pow((a.geometry.x + a.geometry.width / 2) - (b.geometry.x + b.geometry.width / 2), 2) +
                    Math.pow((a.geometry.y + a.geometry.height / 2) - (b.geometry.y + b.geometry.height / 2), 2)
                );
                if (centerDist < 500) {
                    findings.push({
                        id: 'R037',
                        message: `Insufficient spacing: id='${a.id}' and id='${b.id}' gap=${minGap.toFixed(0)}px (min ${MIN_SPACING}px)`,
                    });
                }
            }
        }
    }
    return findings;
}

/**
 * R038: Z-order violations.
 * In draw.io XML, cells are rendered in document order.
 * Edges should come before (behind) vertices for correct z-order.
 */
function checkR038(cells) {
    const findings = [];
    let firstVertexIdx = -1;
    const edgeIndices = [];

    for (let i = 0; i < cells.length; i++) {
        if (cells[i].vertex && firstVertexIdx === -1) {
            firstVertexIdx = i;
        }
        if (cells[i].edge) {
            edgeIndices.push(i);
        }
    }

    // Check if any edge appears after the first vertex
    if (firstVertexIdx >= 0) {
        const edgesAfter = edgeIndices.filter(idx => idx > firstVertexIdx);
        if (edgesAfter.length > 0 && edgeIndices.some(idx => idx < firstVertexIdx)) {
            // Mixed z-order: some edges before, some after
            findings.push({
                id: 'R038',
                message: `Z-order violation: ${edgesAfter.length} edge(s) rendered after first vertex (edges should all be before vertices for correct layering)`,
            });
        }
    }
    return findings;
}

// ── Scoring ────────────────────────────────────────────────────────

function computeScore(results) {
    const weights = {
        // P0: 50 each
        R001: 50, R002: 50, R003: 50, R004: 50, R005: 50,
        // P1: 20 each
        R010: 20, R011: 20, R012: 20, R013: 20, R014: 20, R015: 20,
        // P2: 3-5 each
        R020: 1, R021: 2, R022: 3,
        // P3: 5 each
        R030: 5, R031: 5, R032: 5, R033: 5, R034: 5, R035: 5,
        R036: 5, R037: 5, R038: 5, R039: 5,
    };

    let score = 0;
    const allFindings = [
        ...results.errors,
        ...results.warnings,
        ...(results.p3_findings || []),
    ];
    for (const f of allFindings) {
        score += weights[f.id] || 1;
    }
    return score;
}

// ── Run validate.py as Subprocess ──────────────────────────────────

function runValidatePy(filepath) {
    const scriptDir = path.dirname(__filename);
    const validatePy = path.join(scriptDir, 'validate.py');

    if (!fs.existsSync(validatePy)) {
        return { error: 'validate.py not found', errors: [], warnings: [] };
    }

    try {
        const result = spawnSync('python3', [validatePy, filepath, '--json'], {
            timeout: 30000,
            windowsHide: true,
            stdio: 'pipe',
            encoding: 'utf-8',
        });

        if (result.status !== 0 && result.status !== 1 && result.status !== 2) {
            return { error: `validate.py exited with ${result.status}`, errors: [], warnings: [] };
        }

        const json = JSON.parse(result.stdout);
        return {
            errors: json.errors || [],
            warnings: json.warnings || [],
            error_count: json.error_count || 0,
            warning_count: json.warning_count || 0,
            score: json.score,
        };
    } catch (err) {
        return { error: `Failed to run validate.py: ${err.message}`, errors: [], warnings: [] };
    }
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
    const options = parseArgs();

    // 1. Run validate.py (structural checks)
    let validateResults = { errors: [], warnings: [], error_count: 0, warning_count: 0 };
    if (!options.noSubprocess) {
        validateResults = runValidatePy(options.input);
        if (validateResults.error && !options.json) {
            console.error(`Warning: ${validateResults.error}`);
        }
    }

    // 2. Run visual heuristic checks
    const xmlData = parseXML(options.input);
    const p3Findings = [
        ...checkR030(xmlData.cells),
        ...checkR035(xmlData),
        ...checkR036(xmlData.cells),
        ...checkR037(xmlData.cells),
        ...checkR038(xmlData.cells),
    ];

    // 3. Aggregate results
    const results = {
        file: options.input,
        errors: validateResults.errors || [],
        warnings: validateResults.warnings || [],
        p3_findings: p3Findings,
        error_count: (validateResults.errors || []).length,
        warning_count: (validateResults.warnings || []).length,
        p3_count: p3Findings.length,
    };

    // 4. Compute score
    const score = options.score ? computeScore(results) : null;

    // 5. Output
    if (options.json) {
        const output = {
            file: options.input,
            errors: results.errors,
            warnings: results.warnings,
            p3_findings: results.p3_findings,
            error_count: results.error_count,
            warning_count: results.warning_count,
            p3_count: results.p3_count,
        };
        if (score !== null) {
            output.score = score;
        }
        console.log(JSON.stringify(output, null, 2));
    } else {
        // Errors (P0-P1)
        if (results.errors.length > 0) {
            console.log(`\n=== ERRORS (${results.errors.length}) ===`);
            for (const e of results.errors) {
                console.log(`  [${e.id}] ${e.message}`);
            }
        }

        // Warnings (P2)
        if (results.warnings.length > 0) {
            console.log(`\n=== WARNINGS (${results.warnings.length}) ===`);
            for (const w of results.warnings) {
                console.log(`  [${w.id}] ${w.message}`);
            }
        }

        // P3 Visual Findings
        if (p3Findings.length > 0) {
            console.log(`\n=== P3 VISUAL FINDINGS (${p3Findings.length}) ===`);
            for (const f of p3Findings) {
                console.log(`  [${f.id}] ${f.message}`);
            }
        }

        if (results.errors.length === 0 && results.warnings.length === 0 && p3Findings.length === 0) {
            console.log('✓ No issues found.');
        }

        if (score !== null) {
            console.log(`\nReadability score: ${score} (lower is better, 0 = perfect)`);
        }

        const total = results.error_count + results.warning_count + results.p3_count;
        console.log(`\nSummary: ${results.error_count} error(s), ${results.warning_count} warning(s), ${results.p3_count} P3 finding(s) — ${total} total`);
    }

    // 6. Exit code
    const hasP0 = results.errors.some(e => e.id && e.id.startsWith('R00'));
    const hasErrors = results.errors.length > 0;
    const hasWarnings = results.warnings.length > 0 || p3Findings.length > 0;

    if (hasP0) {
        process.exit(2);
    } else if (hasErrors) {
        process.exit(1);
    } else if (hasWarnings && options.strict) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

if (require.main === module) {
	    main();
	} else {
	    module.exports = {
	        parseXML,
	        checkR030,
	        checkR035,
	        checkR036,
	        checkR037,
	        checkR038,
	        computeScore,
	        parseArgs,
	        runValidatePy,
	    };
	}
