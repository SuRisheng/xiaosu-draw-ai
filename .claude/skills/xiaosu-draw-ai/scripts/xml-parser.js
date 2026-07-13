#!/usr/bin/env node
/**
 * xml-parser.js — Parse .drawio XML into a navigable JSON structure.
 *
 * Extracts nodes, edges, containers, and their properties (id, label, style,
 * geometry, parent) from a draw.io XML file. Resolves absolute coordinates
 * by walking the parent chain for nodes nested inside containers/swimlanes.
 *
 * Used by SKILL.md when modifying an existing diagram — AI reads the parsed
 * structure to understand what's there, then applies targeted XML edits.
 *
 * Usage:
 *   node scripts/xml-parser.js <file.drawio>              # Output summary
 *   node scripts/xml-parser.js <file.drawio> --json       # Full JSON output
 *   node scripts/xml-parser.js <file.drawio> --summary    # Human-readable summary only
 */

const fs = require('fs');

// ── Geometry ───────────────────────────────────────────────────────

function parseGeometry(cell) {
    const geom = cell.mxGeometry;
    if (!geom) return null;
    const x = parseFloat(geom.$.x || '0');
    const y = parseFloat(geom.$.y || '0');
    const w = parseFloat(geom.$.width || '0');
    const h = parseFloat(geom.$.height || '0');
    return { x, y, w, h };
}

function resolveAbsolute(cell, allCells, parentChain = []) {
    const geom = parseGeometry(cell);
    if (!geom) return null;

    let absX = geom.x;
    let absY = geom.y;

    const parentId = cell.$.parent || '1';
    if (parentId && parentId !== '0' && parentId !== '1') {
        const parent = allCells[parentId];
        if (parent && !parentChain.includes(parentId)) {
            const parentGeom = resolveAbsolute(parent, allCells, [...parentChain, parentId]);
            if (parentGeom) {
                absX += parentGeom.x;
                absY += parentGeom.y;
            }
        }
    }

    return { x: absX, y: absY, w: geom.w, h: geom.h };
}

// ── XML Parsing ────────────────────────────────────────────────────

function parseXML(filepath) {
    const content = fs.readFileSync(filepath, 'utf-8');

    // Simple XML parser — robust enough for draw.io files
    // Extract all mxCell elements with their attributes and geometry children
    const cells = {};
    const root = {};

    // Match <mxCell ... /> or <mxCell ...>...</mxCell>
    const cellRegex = /<mxCell\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/gi;
    let match;

    while ((match = cellRegex.exec(content)) !== null) {
        const attrsStr = match[1];
        const inner = match[2] || '';

        const cell = { $: {}, mxGeometry: null };

        // Parse attributes
        const attrRegex = /(\w+(?::\w+)?)="([^"]*)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
            cell.$[attrMatch[1]] = attrMatch[2];
        }

        // Parse geometry
        const geomRegex = /<mxGeometry\s+([^>]*?)(?:\/>|>)/i;
        const geomMatch = inner.match(geomRegex);
        if (geomMatch) {
            const geomAttrs = {};
            const gAttrRegex = /(\w+(?::\w+)?)="([^"]*)"/g;
            let gMatch;
            while ((gMatch = gAttrRegex.exec(geomMatch[1])) !== null) {
                geomAttrs[gMatch[1]] = gMatch[2];
            }

            // Parse waypoints
            const pointsMatch = inner.match(/<Array\s+as="points">([\s\S]*?)<\/Array>/i);
            const waypoints = [];
            if (pointsMatch) {
                const ptRegex = /<mxPoint\s+x="([^"]*)"\s+y="([^"]*)"/g;
                let ptMatch;
                while ((ptMatch = ptRegex.exec(pointsMatch[1])) !== null) {
                    waypoints.push({ x: parseFloat(ptMatch[1]), y: parseFloat(ptMatch[2]) });
                }
            }

            // Parse sourcePoint / targetPoint
            const srcPtMatch = inner.match(/<mxPoint\s+[^>]*as="sourcePoint"[^>]*x="([^"]*)"\s+y="([^"]*)"/i);
            const tgtPtMatch = inner.match(/<mxPoint\s+[^>]*as="targetPoint"[^>]*x="([^"]*)"\s+y="([^"]*)"/i);

            cell.mxGeometry = {
                $: geomAttrs,
                waypoints,
                sourcePoint: srcPtMatch ? { x: parseFloat(srcPtMatch[1]), y: parseFloat(srcPtMatch[2]) } : null,
                targetPoint: tgtPtMatch ? { x: parseFloat(tgtPtMatch[1]), y: parseFloat(tgtPtMatch[2]) } : null,
            };
        }

        const id = cell.$.id;
        if (id) {
            cells[id] = cell;
            if (id === '0') root.root = cell;
            if (id === '1') root.page = cell;
        }
    }

    return { cells, root };
}

// ── Structure Extraction ──────────────────────────────────────────

function extractStructure(filepath) {
    const { cells } = parseXML(filepath);

    const nodes = [];
    const edges = [];
    const containers = [];
    const orphaned = [];

    for (const [id, cell] of Object.entries(cells)) {
        if (id === '0' || id === '1') continue;

        const isEdge = cell.$.edge === '1' || (cell.$.style && cell.$.style.includes('endArrow'));
        const isVertex = cell.$.vertex === '1' || (!isEdge && cell.mxGeometry && parseGeometry(cell));

        if (isEdge) {
            edges.push({
                id,
                source: cell.$.source || '',
                target: cell.$.target || '',
                label: (cell.$.value || '').replace(/<br>/g, '\n').replace(/<[^>]+>/g, ''),
                style: cell.$.style || '',
                parent: cell.$.parent || '1',
                waypoints: cell.mxGeometry?.waypoints || [],
                sourcePoint: cell.mxGeometry?.sourcePoint || null,
                targetPoint: cell.mxGeometry?.targetPoint || null,
            });
        } else if (isVertex) {
            const absGeom = resolveAbsolute(cell, cells);
            const isContainer = (cell.$.style || '').includes('swimlane');

            const node = {
                id,
                label: (cell.$.value || '').replace(/<br>/g, '\n').replace(/<[^>]+>/g, ''),
                style: cell.$.style || '',
                parent: cell.$.parent || '1',
                geometry: parseGeometry(cell),
                absoluteGeometry: absGeom,
                isContainer,
            };

            nodes.push(node);
            if (isContainer) containers.push(node);
        }
    }

    // Find orphaned edges
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const edge of edges) {
        if (edge.source && !nodeIds.has(edge.source)) orphaned.push({ edgeId: edge.id, missing: edge.source, type: 'source' });
        if (edge.target && !nodeIds.has(edge.target)) orphaned.push({ edgeId: edge.id, missing: edge.target, type: 'target' });
    }

    return { nodes, edges, containers, orphaned };
}

// ── Summary ────────────────────────────────────────────────────────

function summary(structure, filepath) {
    const { nodes, edges, containers, orphaned } = structure;

    const lines = [];
    lines.push(`File: ${filepath}`);
    lines.push(`Nodes: ${nodes.length} (${containers.length} containers)`);
    lines.push(`Edges: ${edges.length}`);
    if (orphaned.length > 0) lines.push(`Orphaned references: ${orphaned.length}`);

    lines.push('\nContainers:');
    for (const c of containers) {
        const children = nodes.filter(n => n.parent === c.id);
        lines.push(`  [${c.id}] ${c.label || '(unnamed)'} — ${children.length} children`);
    }

    lines.push('\nTop-level Nodes:');
    for (const n of nodes.filter(n => n.parent === '1' && !n.isContainer)) {
        const g = n.absoluteGeometry;
        const pos = g ? `(${g.x}, ${g.y}) ${g.w}×${g.h}` : '(no geometry)';
        lines.push(`  [${n.id}] ${n.label || '(unnamed)'} ${pos}`);
    }

    lines.push('\nEdges:');
    for (const e of edges) {
        lines.push(`  [${e.id}] ${e.source || '(srcPt)'} → ${e.target || '(tgtPt)'} ${e.label ? '"' + e.label + '"' : ''}`);
    }

    if (orphaned.length > 0) {
        lines.push('\n⚠ Orphaned references:');
        for (const o of orphaned) {
            lines.push(`  Edge [${o.edgeId}]: ${o.type}="${o.missing}" does not exist`);
        }
    }

    return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`xml-parser.js — Parse .drawio XML to navigable JSON structure

Usage:
  node scripts/xml-parser.js <file.drawio>              # Print summary
  node scripts/xml-parser.js <file.drawio> --json       # Full JSON output
  node scripts/xml-parser.js <file.drawio> --summary    # Summary only
`);
        process.exit(0);
    }

    const filepath = args[0];
    if (!fs.existsSync(filepath)) {
        console.error(`ERROR: File not found: ${filepath}`);
        process.exit(1);
    }

    const structure = extractStructure(filepath);

    if (args.includes('--json')) {
        console.log(JSON.stringify(structure, null, 2));
    } else {
        console.log(summary(structure, filepath));
    }
}

module.exports = { parseXML, extractStructure, summary, resolveAbsolute, parseGeometry };

if (require.main === module) {
    main();
}
