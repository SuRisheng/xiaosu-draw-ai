#!/usr/bin/env node
/**
 * ir-importer.js — Pipeline A: Data-driven IR importer interface.
 *
 * Defines the contract that all Pipeline A importers must implement.
 * Each importer reads a parseable source file (SQL, OpenAPI, Terraform, etc.)
 * and produces a structured IR JSON document that flows into the shared
 * quality pipeline (validate → export → audit).
 *
 * IR Schema: See DESIGN.md §7 and tests/unit/test_ir_schema.js
 *
 * Usage:
 *   node scripts/importers/ir-importer.js --type sql2er <input.sql>
 *   node scripts/importers/ir-importer.js --type openapi2arch <spec.yaml>
 *   node scripts/importers/ir-importer.js --list                      # List available importers
 */

const fs = require('fs');
const path = require('path');

// ── Importer Contract ──────────────────────────────────────────────

/**
 * Every Pipeline A importer must implement this interface:
 *
 * @interface IRImporter
 *
 * @method detect(inputPath: string): boolean
 *   Returns true if this importer can handle the given input file.
 *   Check file extension, content heuristics (first lines), etc.
 *
 * @method extract(inputPath: string, options?: object): IRDocument
 *   Parses the input file and returns a valid IR document.
 *   Throws on parse failure with a descriptive message.
 *
 * @property {string} name — Unique importer name (kebab-case)
 * @property {string} description — Human-readable description
 * @property {string[]} fileExtensions — Supported file extensions
 * @property {string} diagramType — IR diagram type produced (e.g., 'er', 'architecture')
 */

// ── IR Document Factory ────────────────────────────────────────────

/**
 * Create a minimal valid IR document skeleton.
 * @param {string} type — diagram type
 * @param {string} title
 * @returns {object} IR document
 */
function createIR(type, title) {
    return {
        schemaVersion: '1.0',
        meta: {
            type,
            title: title || `${type} diagram`,
            source: 'pipeline-a',
            generated_at: new Date().toISOString(),
        },
        nodes: [],
        edges: [],
        groups: [],
        layout: { direction: 'TB', layers: [] },
        style: { preset: 'flat-icon' },
    };
}

/**
 * Add a node to an IR document.
 */
function addNode(ir, id, label, type, role, metadata = {}) {
    const node = { id, label, type, role };
    if (Object.keys(metadata).length > 0) node.metadata = metadata;
    ir.nodes.push(node);
    return node;
}

/**
 * Add an edge to an IR document.
 */
function addEdge(ir, source, target, label = '', type = 'primary') {
    const edge = { source, target, type };
    if (label) edge.label = label;
    ir.edges.push(edge);
    return edge;
}

/**
 * Add a group to an IR document.
 */
function addGroup(ir, id, label, nodeIds) {
    ir.groups.push({ id, label, nodeIds });
}

/**
 * Set layout layers from a list of node ID groups.
 */
function setLayers(ir, ...layerGroups) {
    ir.layout.layers = layerGroups;
}

// ── Importer Registry ──────────────────────────────────────────────

const registry = [];

function register(importer) {
    registry.push(importer);
}

function listImporters() {
    return registry.map(i => ({
        name: i.name,
        description: i.description,
        extensions: i.fileExtensions,
        diagramType: i.diagramType,
    }));
}

function findImporter(inputPath) {
    return registry.find(i => i.detect(inputPath));
}

function findByName(name) {
    return registry.find(i => i.name === name);
}

// ── Main ───────────────────────────────────────────────────────────

function main() {
    const args = process.argv.slice(2);

    if (args.includes('--list')) {
        console.log('Available importers:');
        for (const info of listImporters()) {
            console.log(`  ${info.name} — ${info.description}`);
            console.log(`    Extensions: ${info.extensions.join(', ')} → ${info.diagramType}`);
        }
        process.exit(0);
    }

    const typeIdx = args.indexOf('--type');
    if (typeIdx === -1 || typeIdx + 1 >= args.length || args.length < 3) {
        console.log(`Pipeline A — Data-driven IR importers

Usage:
  node scripts/importers/ir-importer.js --type <name> <input-file>
  node scripts/importers/ir-importer.js --list

Available importers:`);
        for (const info of listImporters()) {
            console.log(`  ${info.name.padEnd(18)} ${info.description}`);
        }
        process.exit(0);
    }

    const importerName = args[typeIdx + 1];
    const inputFile = args[args.length - 1];

    if (!fs.existsSync(inputFile)) {
        console.error(`ERROR: Input file not found: ${inputFile}`);
        process.exit(1);
    }

    const importer = findByName(importerName);
    if (!importer) {
        console.error(`ERROR: Unknown importer "${importerName}". Use --list to see available importers.`);
        process.exit(1);
    }

    try {
        const ir = importer.extract(inputFile);
        console.log(JSON.stringify(ir, null, 2));
        console.error(`\nIR extracted: ${ir.nodes.length} nodes, ${ir.edges.length} edges`);
    } catch (e) {
        console.error(`ERROR: ${e.message}`);
        process.exit(2);
    }
}

module.exports = {
    createIR, addNode, addEdge, addGroup, setLayers,
    register, listImporters, findImporter, findByName,
    main,
};

if (require.main === module) {
    // Lazy-load importers
    try { require('./sql2er.js'); } catch (_) {}
    try { require('./openapi2arch.js'); } catch (_) {}
    main();
}
