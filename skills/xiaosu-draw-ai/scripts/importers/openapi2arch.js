#!/usr/bin/env node
/**
 * openapi2arch.js — Pipeline A importer: OpenAPI spec → Architecture diagram IR.
 *
 * Parses an OpenAPI 3.x specification and extracts services, endpoints,
 * and dependencies into an architecture diagram IR.
 *
 * Usage:
 *   node scripts/importers/ir-importer.js --type openapi2arch spec.yaml
 *
 * IR Output: diagram type 'architecture'
 */

const { createIR, addNode, addEdge, addGroup, register } = require('./ir-importer');

// ── OpenAPI Parser (simplified, no YAML library dependency) ────────

function parseOpenAPI(content) {
    // Minimal parser for OpenAPI 3.x structure
    // In production, use a proper YAML parser (js-yaml)
    // This skeleton demonstrates the contract; real parsing needs YAML support

    let spec;
    try {
        // Try JSON first
        spec = JSON.parse(content);
    } catch (_) {
        // Basic YAML detection — full parsing requires js-yaml dependency
        const lines = content.split('\n');
        const hasYAML = lines.some(l => /^\s*\w+\s*:/.test(l) && !l.includes('{'));
        if (hasYAML) {
            throw new Error(
                'YAML OpenAPI specs require js-yaml dependency.\n' +
                'Install: npm install js-yaml\n' +
                'Or convert your spec to JSON first.'
            );
        }
        throw new Error('Could not parse OpenAPI spec as JSON.');
    }

    return spec;
}

// ── IR Extraction ──────────────────────────────────────────────────

function extract(inputPath, options = {}) {
    const fs = require('fs');
    if (!fs.existsSync(inputPath)) {
        throw new Error(`File not found: ${inputPath}`);
    }
    const content = fs.readFileSync(inputPath, 'utf-8');
    const spec = parseOpenAPI(content);

    const info = spec.info || {};
    const title = options.title || info.title || 'API Architecture';
    const ir = createIR('architecture', title);

    // Extract servers as external infrastructure
    const servers = spec.servers || [];
    servers.forEach((server, idx) => {
        addNode(ir, `server_${idx}`, `${server.description || 'API Server'}\n${server.url}`,
            'service', 'accent', { technology: 'OpenAPI Server' });
    });

    // Extract paths as API endpoints
    const paths = spec.paths || {};
    const operations = [];
    let opIdx = 0;

    for (const [route, methods] of Object.entries(paths)) {
        for (const [method, details] of Object.entries(methods)) {
            if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                const opId = details.operationId || `op_${opIdx}`;
                operations.push({
                    id: opId,
                    method: method.toUpperCase(),
                    route,
                    summary: details.summary || '',
                    tags: details.tags || [],
                });
                opIdx++;
            }
        }
    }

    // Group operations by tag
    const tagGroups = {};
    for (const op of operations) {
        const tag = op.tags[0] || 'ungrouped';
        if (!tagGroups[tag]) tagGroups[tag] = [];
        tagGroups[tag].push(op);
    }

    // Create service nodes for each tag group
    const palette = ['primary', 'success', 'secondary', 'warning', 'accent'];
    let svcIdx = 0;

    for (const [tag, ops] of Object.entries(tagGroups)) {
        const svcId = `svc_${tag.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const endpointList = ops.slice(0, 4).map(o => `${o.method} ${o.route}`).join('<br>');
        const label = ops.length > 4
            ? `<b>${tag}</b><br>${endpointList}<br>+${ops.length - 4} more`
            : `<b>${tag}</b><br>${endpointList}`;

        const role = palette[svcIdx % palette.length];
        addNode(ir, svcId, label, 'service', role, {
            technology: 'REST API',
            endpointCount: ops.length,
        });

        // Edges from servers to services
        if (servers.length > 0) {
            addEdge(ir, `server_0`, svcId, '', 'primary');
        }

        // Group as service layer
        addGroup(ir, `grp_${svcId}`, tag, [svcId]);
        svcIdx++;
    }

    // Set layout
    const serviceIds = Object.keys(tagGroups).map(t =>
        `svc_${t.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
    const serverIds = servers.map((_, i) => `server_${i}`);

    ir.layout = {
        direction: 'TB',
        layers: [serverIds, serviceIds],
    };

    ir.style = { preset: options.style || 'flat-icon' };
    ir.source = { type: 'openapi', path: inputPath };

    return ir;
}

// ── Detection ──────────────────────────────────────────────────────

function detect(inputPath) {
    const ext = require('path').extname(inputPath).toLowerCase();
    if (!['.json', '.yaml', '.yml'].includes(ext)) return false;

    const fs = require('fs');
    const content = fs.readFileSync(inputPath, 'utf-8');

    // Check for OpenAPI 3.x indicators
    return /\bopenapi\s*:\s*['"]?3\./.test(content) ||
           /"openapi"\s*:\s*"3\./.test(content);
}

// ── Register ───────────────────────────────────────────────────────

register({
    name: 'openapi2arch',
    description: 'OpenAPI 3.x spec → Architecture diagram',
    fileExtensions: ['.json', '.yaml', '.yml'],
    diagramType: 'architecture',
    detect,
    extract,
});

module.exports = { name: 'openapi2arch', detect, extract };
