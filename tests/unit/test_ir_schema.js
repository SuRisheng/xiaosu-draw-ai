#!/usr/bin/env node
/**
 * test_ir_schema.js — Unit tests for Pipeline A IR JSON schema.
 *
 * Validates the Intermediate Representation (IR) format defined in
 * references/pipeline-a-authoring.md. Tests that valid IR documents pass
 * structural validation and that malformed IR documents are rejected.
 *
 * Usage:
 *   node tests/unit/test_ir_schema.js
 *
 * No external dependencies — pure Node.js.
 */

// ── IR Schema (mirrors pipeline-a-authoring.md) ────────────────────

const IR_SCHEMA = {
    required: ['meta', 'nodes', 'edges'],
    properties: {
        meta: {
            required: ['type'],
            properties: {
                type: ['architecture', 'sequence', 'er', 'flowchart', 'deployment',
                       'class', 'c4', 'state-machine', 'network', 'data-flow'],
                title: 'string',
                source: 'string',
                generated_at: 'string',
            },
        },
        nodes: {
            type: 'array',
            minItems: 1,
            itemRequired: ['id', 'label', 'type'],
            itemProperties: {
                id: 'string',
                label: 'string',
                type: ['service', 'database', 'queue', 'gateway', 'external', 'container',
                       'actor', 'decision', 'cloud', 'document'],
                role: ['primary', 'success', 'warning', 'accent', 'danger', 'neutral', 'secondary'],
                metadata: 'object',
            },
        },
        edges: {
            type: 'array',
            itemRequired: ['source', 'target'],
            itemProperties: {
                source: 'string',
                target: 'string',
                label: 'string',
                type: ['primary', 'dashed', 'async', 'return'],
            },
        },
        layout: {
            optional: true,
            properties: {
                direction: ['TB', 'LR', 'RL', 'BT'],
                layers: 'array',
            },
        },
    },
};

// ── Sample IR Documents ────────────────────────────────────────────

const VALID_IR_ARCHITECTURE = {
    meta: {
        type: 'architecture',
        title: 'E-Commerce System',
        source: 'manual',
        generated_at: '2026-07-08T00:00:00Z',
    },
    nodes: [
        { id: 'web-app', label: 'Web Application', type: 'service', role: 'primary',
          metadata: { technology: 'React' } },
        { id: 'api-gw', label: 'API Gateway', type: 'gateway', role: 'accent',
          metadata: { technology: 'Kong' } },
        { id: 'user-db', label: 'User Database', type: 'database', role: 'success',
          metadata: { technology: 'PostgreSQL' } },
    ],
    edges: [
        { source: 'web-app', target: 'api-gw', label: 'HTTP', type: 'primary' },
        { source: 'api-gw', target: 'user-db', label: 'SQL', type: 'primary' },
    ],
    layout: {
        direction: 'TB',
        layers: [['web-app'], ['api-gw'], ['user-db']],
    },
};

const VALID_IR_MINIMAL = {
    meta: { type: 'flowchart' },
    nodes: [
        { id: 'start', label: 'Start', type: 'decision' },
    ],
    edges: [],
};

const VALID_IR_ER = {
    meta: { type: 'er', title: 'User Management Schema' },
    nodes: [
        { id: 'users', label: 'users', type: 'database', role: 'primary',
          metadata: { technology: 'MySQL' } },
        { id: 'orders', label: 'orders', type: 'database', role: 'primary',
          metadata: { technology: 'MySQL' } },
    ],
    edges: [
        { source: 'users', target: 'orders', label: '1:N', type: 'primary' },
    ],
    layout: { direction: 'TB', layers: [['users'], ['orders']] },
};

// Invalid IRs
const INVALID_IR_NO_META = {
    nodes: [{ id: 'x', label: 'X', type: 'service' }],
    edges: [],
};

const INVALID_IR_NO_NODES = {
    meta: { type: 'architecture' },
    nodes: [],
    edges: [],
};

const INVALID_IR_EMPTY_NODES = {
    meta: { type: 'architecture' },
    nodes: [],
    edges: [],
};

const INVALID_IR_BAD_TYPE = {
    meta: { type: 'INVALID_DIAGRAM_TYPE' },
    nodes: [{ id: 'x', label: 'X', type: 'service' }],
    edges: [],
};

const INVALID_IR_MISSING_NODE_ID = {
    meta: { type: 'architecture' },
    nodes: [{ label: 'No ID', type: 'service' }],
    edges: [],
};

const INVALID_IR_DANGLING_EDGE = {
    meta: { type: 'architecture' },
    nodes: [{ id: 'x', label: 'X', type: 'service' }],
    edges: [{ source: 'x', target: 'NONEXISTENT', type: 'primary' }],
};

// ── Validation Logic ───────────────────────────────────────────────

function validateIR(ir) {
    const errors = [];

    // Check top-level required fields
    if (!ir || typeof ir !== 'object') {
        return [{ field: 'root', message: 'IR must be an object' }];
    }

    // meta
    if (!ir.meta || typeof ir.meta !== 'object') {
        errors.push({ field: 'meta', message: 'Missing required field: meta' });
    } else {
        if (!ir.meta.type) {
            errors.push({ field: 'meta.type', message: 'Missing required field: meta.type' });
        } else if (!IR_SCHEMA.properties.meta.properties.type.includes(ir.meta.type)) {
            errors.push({
                field: 'meta.type',
                message: `Invalid diagram type: "${ir.meta.type}". Valid types: ${IR_SCHEMA.properties.meta.properties.type.join(', ')}`,
            });
        }
    }

    // nodes
    if (!Array.isArray(ir.nodes)) {
        errors.push({ field: 'nodes', message: 'nodes must be an array' });
    } else if (ir.nodes.length === 0) {
        errors.push({ field: 'nodes', message: 'nodes array must have at least 1 item' });
    } else {
        const nodeIds = new Set();
        for (let i = 0; i < ir.nodes.length; i++) {
            const node = ir.nodes[i];
            const prefix = `nodes[${i}]`;

            if (!node.id) {
                errors.push({ field: `${prefix}.id`, message: 'Missing required field: id' });
            } else if (nodeIds.has(node.id)) {
                errors.push({ field: `${prefix}.id`, message: `Duplicate node id: "${node.id}"` });
            } else {
                nodeIds.add(node.id);
            }

            if (!node.label) {
                errors.push({ field: `${prefix}.label`, message: 'Missing required field: label' });
            }

            if (!node.type) {
                errors.push({ field: `${prefix}.type`, message: 'Missing required field: type' });
            } else if (!IR_SCHEMA.properties.nodes.itemProperties.type.includes(node.type)) {
                errors.push({
                    field: `${prefix}.type`,
                    message: `Invalid node type: "${node.type}"`,
                });
            }

            if (node.role && !IR_SCHEMA.properties.nodes.itemProperties.role.includes(node.role)) {
                errors.push({
                    field: `${prefix}.role`,
                    message: `Invalid role: "${node.role}"`,
                });
            }
        }

        // edges
        if (!Array.isArray(ir.edges)) {
            errors.push({ field: 'edges', message: 'edges must be an array' });
        } else {
            for (let i = 0; i < ir.edges.length; i++) {
                const edge = ir.edges[i];
                const prefix = `edges[${i}]`;

                if (!edge.source) {
                    errors.push({ field: `${prefix}.source`, message: 'Missing required field: source' });
                } else if (!nodeIds.has(edge.source)) {
                    errors.push({
                        field: `${prefix}.source`,
                        message: `Edge source "${edge.source}" references undefined node`,
                    });
                }

                if (!edge.target) {
                    errors.push({ field: `${prefix}.target`, message: 'Missing required field: target' });
                } else if (!nodeIds.has(edge.target)) {
                    errors.push({
                        field: `${prefix}.target`,
                        message: `Edge target "${edge.target}" references undefined node`,
                    });
                }

                if (edge.type && !IR_SCHEMA.properties.edges.itemProperties.type.includes(edge.type)) {
                    errors.push({
                        field: `${prefix}.type`,
                        message: `Invalid edge type: "${edge.type}"`,
                    });
                }
            }
        }
    }

    // layout (optional)
    if (ir.layout) {
        if (ir.layout.direction && !IR_SCHEMA.properties.layout.properties.direction.includes(ir.layout.direction)) {
            errors.push({
                field: 'layout.direction',
                message: `Invalid layout direction: "${ir.layout.direction}"`,
            });
        }
    }

    return errors;
}

// ── Extension Validation ────────────────────────────────────────────

function validateExtension(extension, diagramType) {
    const errors = [];

    if (!extension || typeof extension !== 'object') {
        return [{ field: 'extension', message: 'extension must be an object' }];
    }

    if (diagramType === 'sequence') {
        // Validate participants
        if (extension.participants && Array.isArray(extension.participants)) {
            for (let i = 0; i < extension.participants.length; i++) {
                const p = extension.participants[i];
                if (!p.id) errors.push({ field: `extension.participants[${i}].id`, message: 'Missing id' });
                if (!p.label) errors.push({ field: `extension.participants[${i}].label`, message: 'Missing label' });
            }
        }
        // Validate messages
        if (extension.messages && Array.isArray(extension.messages)) {
            const orders = new Set();
            for (let i = 0; i < extension.messages.length; i++) {
                const m = extension.messages[i];
                if (!m.from) errors.push({ field: `extension.messages[${i}].from`, message: 'Missing from' });
                if (!m.to) errors.push({ field: `extension.messages[${i}].to`, message: 'Missing to' });
                if (!m.label) errors.push({ field: `extension.messages[${i}].label`, message: 'Missing label' });
                if (m.order === undefined) {
                    errors.push({ field: `extension.messages[${i}].order`, message: 'Missing order' });
                } else if (orders.has(m.order)) {
                    errors.push({ field: `extension.messages[${i}].order`, message: `Duplicate message order: ${m.order}` });
                } else {
                    orders.add(m.order);
                }
            }
        }
    }

    if (diagramType === 'er') {
        const VALID_CARDINALITIES = ['1:1', '1:N', 'N:1', 'N:M'];
        if (extension.entities && Array.isArray(extension.entities)) {
            for (let i = 0; i < extension.entities.length; i++) {
                const e = extension.entities[i];
                if (!e.id) errors.push({ field: `extension.entities[${i}].id`, message: 'Missing entity id' });
                if (!e.label) errors.push({ field: `extension.entities[${i}].label`, message: 'Missing label' });
                if (e.fields && Array.isArray(e.fields)) {
                    for (let j = 0; j < e.fields.length; j++) {
                        const f = e.fields[j];
                        if (!f.name) errors.push({ field: `extension.entities[${i}].fields[${j}].name`, message: 'Missing field name' });
                        if (!f.type) errors.push({ field: `extension.entities[${i}].fields[${j}].type`, message: 'Missing field type' });
                    }
                }
            }
        }
        if (extension.relationships && Array.isArray(extension.relationships)) {
            for (let i = 0; i < extension.relationships.length; i++) {
                const r = extension.relationships[i];
                if (!r.from) errors.push({ field: `extension.relationships[${i}].from`, message: 'Missing from' });
                if (!r.to) errors.push({ field: `extension.relationships[${i}].to`, message: 'Missing to' });
                if (r.cardinality && !VALID_CARDINALITIES.includes(r.cardinality)) {
                    errors.push({ field: `extension.relationships[${i}].cardinality`, message: `Invalid cardinality: "${r.cardinality}"` });
                }
            }
        }
    }

    return errors;
}

// Update validateIR to also validate groups and schemaVersion
const originalValidateIR = validateIR;
validateIR = function(ir) {
    const errors = originalValidateIR(ir);

    // Guard: null/undefined returned early by original validator
    if (!ir || typeof ir !== 'object') return errors;

    // schemaVersion
    if (ir.schemaVersion) {
        const VALID_VERSIONS = ['1.0'];
        if (!VALID_VERSIONS.includes(ir.schemaVersion)) {
            errors.push({ field: 'schemaVersion', message: `Unknown schemaVersion: "${ir.schemaVersion}"` });
        }
    }

    // groups
    if (ir.groups) {
        if (!Array.isArray(ir.groups)) {
            errors.push({ field: 'groups', message: 'groups must be an array' });
        } else {
            const groupIds = new Set();
            const allNodeIds = new Set(ir.nodes.map(n => n.id));
            for (let i = 0; i < ir.groups.length; i++) {
                const g = ir.groups[i];
                if (!g.id) {
                    errors.push({ field: `groups[${i}].id`, message: 'Missing group id' });
                } else if (groupIds.has(g.id)) {
                    errors.push({ field: `groups[${i}].id`, message: `Duplicate group id: "${g.id}"` });
                } else {
                    groupIds.add(g.id);
                }
                if (g.nodeIds) {
                    for (const nid of g.nodeIds) {
                        if (!allNodeIds.has(nid)) {
                            errors.push({ field: `groups[${i}].nodeIds`, message: `Group references undefined node: "${nid}"` });
                        }
                    }
                }
            }
        }
    }

    // Extension
    if (ir.extension) {
        const extErrors = validateExtension(ir.extension, ir.meta?.type);
        errors.push(...extErrors);
    }

    return errors;
};

// ── Test Cases ─────────────────────────────────────────────────────

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

function assertDeepEqual(actual, expected, message) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
        throw new Error(`${message || 'Value mismatch'}: expected ${b}, got ${a}`);
    }
}

// ── Run Tests ──────────────────────────────────────────────────────

console.log('=== Unit Test: IR Schema Validation ===\n');

// Valid IRs
console.log('Valid IR documents:');

test('Valid architecture IR passes validation', () => {
    const errors = validateIR(VALID_IR_ARCHITECTURE);
    assert(errors.length === 0, `Expected 0 errors, got ${errors.length}: ${JSON.stringify(errors)}`);
});

test('Valid minimal IR passes validation', () => {
    const errors = validateIR(VALID_IR_MINIMAL);
    assert(errors.length === 0, `Expected 0 errors, got ${errors.length}`);
});

test('Valid ER IR passes validation', () => {
    const errors = validateIR(VALID_IR_ER);
    assert(errors.length === 0, `Expected 0 errors, got ${errors.length}`);
});

test('Valid IR without optional fields passes', () => {
    const ir = {
        meta: { type: 'flowchart' },
        nodes: [{ id: 'x', label: 'X', type: 'service' }],
        edges: [],
    };
    const errors = validateIR(ir);
    assert(errors.length === 0, `Expected 0 errors, got ${errors.length}`);
});

// Invalid IRs - Structural
console.log('\nInvalid IR documents — structural:');

test('Non-object IR rejected', () => {
    const errors = validateIR(null);
    assert(errors.length > 0, 'Expected errors for null IR');
});

test('Missing meta rejected', () => {
    const errors = validateIR(INVALID_IR_NO_META);
    assert(errors.length > 0, 'Expected errors for missing meta');
    assert(errors.some(e => e.field === 'meta'), 'Expected error on meta field');
});

test('Empty nodes array rejected', () => {
    const errors = validateIR(INVALID_IR_EMPTY_NODES);
    assert(errors.length > 0, 'Expected errors for empty nodes');
    assert(errors.some(e => e.field === 'nodes'), 'Expected error on nodes field');
});

test('Invalid diagram type rejected', () => {
    const errors = validateIR(INVALID_IR_BAD_TYPE);
    assert(errors.length > 0, 'Expected errors for invalid type');
});

test('Missing node ID rejected', () => {
    const errors = validateIR(INVALID_IR_MISSING_NODE_ID);
    assert(errors.some(e => e.field === 'nodes[0].id'), 'Expected error on missing node ID');
});

test('Dangling edge reference rejected', () => {
    const errors = validateIR(INVALID_IR_DANGLING_EDGE);
    const danglers = errors.filter(e => e.field === 'edges[0].target');
    assert(danglers.length > 0, 'Expected dangling edge reference error');
});

// Invalid IRs - Node validation
console.log('\nInvalid IR documents — node validation:');

test('Duplicate node IDs rejected', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [
            { id: 'dup', label: 'A', type: 'service' },
            { id: 'dup', label: 'B', type: 'service' },
        ],
        edges: [],
    };
    const errors = validateIR(ir);
    assert(errors.some(e => e.field === 'nodes[1].id' && e.message.includes('Duplicate')), 'Expected duplicate ID error');
});

test('Invalid node type rejected', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [{ id: 'x', label: 'X', type: 'INVALID_SHAPE_TYPE' }],
        edges: [],
    };
    const errors = validateIR(ir);
    assert(errors.some(e => e.field === 'nodes[0].type'), 'Expected invalid node type error');
});

test('Invalid node role rejected', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [{ id: 'x', label: 'X', type: 'service', role: 'INVALID_ROLE' }],
        edges: [],
    };
    const errors = validateIR(ir);
    assert(errors.some(e => e.field === 'nodes[0].role'), 'Expected invalid role error');
});

// Invalid IRs - Edge validation
console.log('\nInvalid IR documents — edge validation:');

test('Edge type validation', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [
            { id: 'a', label: 'A', type: 'service' },
            { id: 'b', label: 'B', type: 'service' },
        ],
        edges: [{ source: 'a', target: 'b', type: 'INVALID_EDGE_TYPE' }],
    };
    const errors = validateIR(ir);
    assert(errors.some(e => e.field === 'edges[0].type'), 'Expected invalid edge type error');
});

test('Edge missing source rejected', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [{ id: 'a', label: 'A', type: 'service' }],
        edges: [{ target: 'a' }],
    };
    const errors = validateIR(ir);
    assert(errors.some(e => e.field === 'edges[0].source'), 'Expected missing source error');
});

test('Edge missing target rejected', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [{ id: 'a', label: 'A', type: 'service' }],
        edges: [{ source: 'a' }],
    };
    const errors = validateIR(ir);
    assert(errors.some(e => e.field === 'edges[0].target'), 'Expected missing target error');
});

// Layout validation
console.log('\nLayout validation:');

test('Valid layout direction accepted', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [{ id: 'a', label: 'A', type: 'service' }],
        edges: [],
        layout: { direction: 'LR', layers: [['a']] },
    };
    const errors = validateIR(ir);
    assert(errors.length === 0, `Expected 0 errors, got ${errors.length}`);
});

test('Invalid layout direction rejected', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [{ id: 'a', label: 'A', type: 'service' }],
        edges: [],
        layout: { direction: 'DIAGONAL' },
    };
    const errors = validateIR(ir);
    assert(errors.some(e => e.field === 'layout.direction'), 'Expected layout direction error');
});

// All 10 diagram types
console.log('\nAll 10 diagram types accepted:');

const ALL_TYPES = ['architecture', 'sequence', 'er', 'flowchart', 'deployment',
                   'class', 'c4', 'state-machine', 'network', 'data-flow'];

for (const type of ALL_TYPES) {
    test(`Diagram type "${type}" accepted`, () => {
        const ir = {
            meta: { type },
            nodes: [{ id: 'x', label: 'X', type: 'service' }],
            edges: [],
        };
        const errors = validateIR(ir);
        assert(errors.length === 0, `Expected 0 errors for type ${type}, got: ${JSON.stringify(errors)}`);
    });
}

// All 10 node types
console.log('\nAll node types accepted:');

const ALL_NODE_TYPES = ['service', 'database', 'queue', 'gateway', 'external',
                        'container', 'actor', 'decision', 'cloud', 'document'];

for (const nodeType of ALL_NODE_TYPES) {
    test(`Node type "${nodeType}" accepted`, () => {
        const ir = {
            meta: { type: 'architecture' },
            nodes: [{ id: 'x', label: 'X', type: nodeType }],
            edges: [],
        };
        const errors = validateIR(ir);
        assert(errors.length === 0, `Expected 0 errors for node type ${nodeType}, got: ${JSON.stringify(errors)}`);
    });
}

// ── Extension IRs (DESIGN.md §7.3) ────────────────────────────────

console.log('\nExtension IR — Sequence diagram:');

test('Valid sequence extension IR passes', () => {
    const ir = {
        meta: { type: 'sequence', title: 'Login Flow' },
        nodes: [
            { id: 'user', label: 'User', type: 'actor', role: 'primary' },
            { id: 'api', label: 'API', type: 'service', role: 'accent' },
            { id: 'db', label: 'Database', type: 'database', role: 'success' },
        ],
        edges: [
            { source: 'user', target: 'api', label: 'POST /login', type: 'primary' },
            { source: 'api', target: 'db', label: 'SELECT user', type: 'primary' },
            { source: 'db', target: 'api', label: 'User Data', type: 'return' },
            { source: 'api', target: 'user', label: 'JWT Token', type: 'return' },
        ],
        extension: {
            participants: [
                { id: 'user', label: 'User', kind: 'actor' },
                { id: 'api', label: 'API', kind: 'service' },
                { id: 'db', label: 'Database', kind: 'service' },
            ],
            messages: [
                { from: 'user', to: 'api', label: 'POST /login', order: 1 },
                { from: 'api', to: 'db', label: 'SELECT user', order: 2 },
                { from: 'db', to: 'api', label: 'User Data', order: 3 },
                { from: 'api', to: 'user', label: 'JWT Token', order: 4 },
            ],
        },
    };
    const errors = validateIR(ir);
    assert(errors.length === 0, `Expected 0 errors, got ${errors.length}: ${JSON.stringify(errors)}`);
});

test('Sequence extension message order uniqueness enforced', () => {
    const ir = {
        meta: { type: 'sequence' },
        nodes: [
            { id: 'a', label: 'A', type: 'actor' },
            { id: 'b', label: 'B', type: 'service' },
        ],
        edges: [{ source: 'a', target: 'b', type: 'primary' }],
        extension: {
            participants: [
                { id: 'a', label: 'A', kind: 'actor' },
                { id: 'b', label: 'B', kind: 'service' },
            ],
            messages: [
                { from: 'a', to: 'b', label: 'Msg 1', order: 1 },
                { from: 'b', to: 'a', label: 'Msg 2', order: 1 },
            ],
        },
    };
    const errors = validateExtension(ir.extension, 'sequence');
    assert(errors.length > 0, 'Expected duplicate order error');
});

console.log('\nExtension IR — ER diagram:');

test('Valid ER extension IR passes', () => {
    const ir = {
        meta: { type: 'er', title: 'User Management' },
        nodes: [
            { id: 'users', label: 'users', type: 'database', role: 'primary' },
            { id: 'orders', label: 'orders', type: 'database', role: 'primary' },
        ],
        edges: [
            { source: 'users', target: 'orders', label: '1:N', type: 'primary' },
        ],
        extension: {
            entities: [
                {
                    id: 'users', label: 'users',
                    fields: [
                        { name: 'id', type: 'BIGINT', pk: true },
                        { name: 'email', type: 'VARCHAR', unique: true },
                    ],
                },
                {
                    id: 'orders', label: 'orders',
                    fields: [
                        { name: 'id', type: 'BIGINT', pk: true },
                        { name: 'user_id', type: 'BIGINT', fk: 'users' },
                    ],
                },
            ],
            relationships: [
                { from: 'users', to: 'orders', cardinality: '1:N', label: 'places' },
            ],
        },
    };
    const errors = validateIR(ir);
    assert(errors.length === 0, `Expected 0 errors, got ${errors.length}: ${JSON.stringify(errors)}`);
});

test('ER extension missing entity id rejected', () => {
    const ext = {
        entities: [
            { label: 'NoID', fields: [] },
        ],
        relationships: [],
    };
    const errors = validateExtension(ext, 'er');
    const hasEntityErr = errors.some(e => e.field && e.field.includes('entities'));
    assert(hasEntityErr || errors.length > 0, `Expected missing entity id error, got ${JSON.stringify(errors)}`);
});

test('ER extension invalid cardinality rejected', () => {
    const ext = {
        entities: [
            { id: 'a', label: 'A', fields: [] },
            { id: 'b', label: 'B', fields: [] },
        ],
        relationships: [
            { from: 'a', to: 'b', cardinality: 'FIVE_TO_MANY', label: 'x' },
        ],
    };
    const errors = validateExtension(ext, 'er');
    assert(errors.some(e => e.field && e.field.includes('cardinality')), 'Expected invalid cardinality error');
});

// ── schemaVersion Validation ────────────────────────────────────────

console.log('\nschemaVersion validation:');

test('schemaVersion "1.0" accepted', () => {
    const ir = {
        schemaVersion: '1.0',
        meta: { type: 'architecture' },
        nodes: [{ id: 'x', label: 'X', type: 'service' }],
        edges: [],
    };
    const errors = validateIR(ir);
    assert(errors.length === 0, `Expected 0 errors, got ${errors.length}`);
});

test('Missing schemaVersion produces warning (not error)', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [{ id: 'x', label: 'X', type: 'service' }],
        edges: [],
    };
    const errors = validateIR(ir);
    // schemaVersion is optional — no error
    assert(errors.length === 0, `Expected 0 errors for missing schemaVersion, got ${errors.length}`);
});

test('Unknown schemaVersion rejected', () => {
    const ir = {
        schemaVersion: '999.0',
        meta: { type: 'architecture' },
        nodes: [{ id: 'x', label: 'X', type: 'service' }],
        edges: [],
    };
    const errors = validateIR(ir);
    assert(errors.some(e => e.field === 'schemaVersion'), 'Expected schemaVersion error');
});

// ── Groups Validation ────────────────────────────────────────────────

console.log('\nGroups validation:');

test('Valid groups accepted', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [
            { id: 'web', label: 'Web', type: 'service' },
            { id: 'api', label: 'API', type: 'service' },
            { id: 'db', label: 'DB', type: 'database' },
        ],
        edges: [],
        groups: [
            { id: 'frontend', label: 'Frontend', nodeIds: ['web'] },
            { id: 'backend', label: 'Backend', nodeIds: ['api', 'db'] },
        ],
    };
    const errors = validateIR(ir);
    assert(errors.length === 0, `Expected 0 errors, got ${errors.length}: ${JSON.stringify(errors)}`);
});

test('Group referencing nonexistent node rejected', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [{ id: 'x', label: 'X', type: 'service' }],
        edges: [],
        groups: [{ id: 'g', label: 'G', nodeIds: ['NONEXISTENT'] }],
    };
    const errors = validateIR(ir);
    assert(errors.some(e => e.field && e.field.includes('groups')), 'Expected group nonexistent node error');
});

test('Duplicate group ID rejected', () => {
    const ir = {
        meta: { type: 'architecture' },
        nodes: [{ id: 'x', label: 'X', type: 'service' }],
        edges: [],
        groups: [
            { id: 'dup', label: 'A', nodeIds: ['x'] },
            { id: 'dup', label: 'B', nodeIds: ['x'] },
        ],
    };
    const errors = validateIR(ir);
    assert(errors.some(e => e.message && e.message.includes('Duplicate')), 'Expected duplicate group ID error');
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
