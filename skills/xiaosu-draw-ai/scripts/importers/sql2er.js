#!/usr/bin/env node
/**
 * sql2er.js — Pipeline A importer: SQL DDL → ER diagram IR.
 *
 * Parses SQL CREATE TABLE statements and extracts entities, fields,
 * primary keys, foreign keys, and unique constraints into an ER IR.
 *
 * Supported SQL dialects: MySQL, PostgreSQL (basic CREATE TABLE syntax).
 *
 * Usage:
 *   node scripts/importers/ir-importer.js --type sql2er schema.sql
 *
 * IR Output: diagram type 'er' with extension.entities + extension.relationships
 */

const { createIR, addNode, addEdge, addGroup, register } = require('./ir-importer');

// ── SQL Parser (simplified) ────────────────────────────────────────

const TABLE_RE = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?\s*\(([\s\S]*?)\);/gi;
const COL_RE = /[`"]?(\w+)[`"]?\s+(\w+(?:\s*\([^)]*\))?)\s*(.*)/i;
const PK_RE = /\bPRIMARY\s+KEY\s*\(([^)]+)\)/i;
const FK_RE = /\bFOREIGN\s+KEY\s*\([`"]?(\w+)[`"]?\)\s*REFERENCES\s+[`"]?(\w+)[`"]?\s*\([`"]?(\w+)[`"]?\)/gi;
const UNIQUE_RE = /\bUNIQUE\b/i;

function parseSQL(content) {
    const tables = [];
    let match;

    while ((match = TABLE_RE.exec(content)) !== null) {
        const tableName = match[1];
        const body = match[2];

        const table = {
            name: tableName,
            fields: [],
            primaryKeys: [],
            foreignKeys: [],
        };

        // Parse fields
        const lines = body.split(',').map(l => l.trim()).filter(l => l);
        for (const line of lines) {
            // Skip constraint-only lines
            if (/^\s*PRIMARY\s+KEY/i.test(line) ||
                /^\s*FOREIGN\s+KEY/i.test(line) ||
                /^\s*CONSTRAINT/i.test(line) ||
                /^\s*UNIQUE\s*\(/i.test(line) ||
                /^\s*INDEX/i.test(line) ||
                /^\s*KEY\s/i.test(line)) {
                continue;
            }

            const colMatch = line.match(COL_RE);
            if (!colMatch) continue;

            const colName = colMatch[1];
            let colType = colMatch[2].toUpperCase().replace(/\s+/g, ' ');
            const rest = (colMatch[3] || '').toUpperCase();

            const field = {
                name: colName,
                type: colType,
                pk: rest.includes('PRIMARY KEY'),
                unique: rest.includes('UNIQUE'),
                nullable: !rest.includes('NOT NULL'),
                autoIncrement: rest.includes('AUTO_INCREMENT') || rest.includes('SERIAL'),
            };

            table.fields.push(field);
            if (field.pk) table.primaryKeys.push(colName);
        }

        // Parse foreign keys
        let fkMatch;
        FK_RE.lastIndex = 0;
        while ((fkMatch = FK_RE.exec(body)) !== null) {
            table.foreignKeys.push({
                column: fkMatch[1],
                refTable: fkMatch[2],
                refColumn: fkMatch[3],
            });
        }

        tables.push(table);
    }

    return tables;
}

// ── IR Extraction ──────────────────────────────────────────────────

function extract(inputPath, options = {}) {
    const fs = require('fs');
    if (!fs.existsSync(inputPath)) {
        throw new Error(`File not found: ${inputPath}`);
    }

    const content = fs.readFileSync(inputPath, 'utf-8');
    const tables = parseSQL(content);

    if (tables.length === 0) {
        throw new Error('No CREATE TABLE statements found in input file.');
    }

    const ir = createIR('er', options.title || 'Database Schema');

    // Color palette for cycling through entities
    const palette = [
        { fill: '#dae8fc', stroke: '#6c8ebf' },
        { fill: '#d5e8d4', stroke: '#82b366' },
        { fill: '#e1d5e7', stroke: '#9673a6' },
        { fill: '#fff2cc', stroke: '#d6b656' },
        { fill: '#f5f5f5', stroke: '#666666' },
    ];

    const entityMap = {};
    const relationships = [];

    tables.forEach((table, idx) => {
        const entityId = table.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        entityMap[table.name] = entityId;

        const colors = palette[idx % palette.length];
        addNode(ir, entityId, table.name, 'database', 'primary', {
            technology: 'SQL',
            fillColor: colors.fill,
            strokeColor: colors.stroke,
        });

        // Build extension fields
        const fields = table.fields.map(f => ({
            name: f.name,
            type: f.type,
            pk: f.pk || undefined,
            unique: f.unique || undefined,
            nullable: f.nullable ? undefined : false,
        }));

        // Collect relationships
        for (const fk of table.foreignKeys) {
            relationships.push({
                from: entityId,
                to: null, // resolved below
                refTable: fk.refTable,
                fromColumn: fk.column,
                toColumn: fk.refColumn,
                label: `${table.name}.${fk.column} → ${fk.refTable}.${fk.refColumn}`,
            });
        }

        // Add entity extension
        if (!ir.extension) ir.extension = { entities: [], relationships: [] };
        ir.extension.entities.push({
            id: entityId,
            label: table.name,
            fields,
        });
    });

    // Resolve relationships
    for (const rel of relationships) {
        const refEntityId = entityMap[rel.refTable];
        if (refEntityId) {
            rel.to = refEntityId;
            addEdge(ir, rel.from, refEntityId, `FK: ${rel.fromColumn}`, 'primary');

            if (ir.extension) {
                ir.extension.relationships.push({
                    from: rel.from,
                    to: refEntityId,
                    cardinality: 'N:1',
                    label: `${rel.fromColumn} → ${rel.toColumn}`,
                });
            }
        }
    }

    // Auto-layout: spread entities
    const cols = Math.ceil(Math.sqrt(tables.length));
    const spacing = 280;
    ir.nodes.forEach((node, idx) => {
        node._x = 40 + (idx % cols) * spacing;
        node._y = 40 + Math.floor(idx / cols) * 200;
    });

    ir.layout = {
        direction: 'TB',
        layers: [ir.nodes.map(n => n.id)],
    };

    return ir;
}

// ── Detection ──────────────────────────────────────────────────────

function detect(inputPath) {
    const ext = require('path').extname(inputPath).toLowerCase();
    if (ext !== '.sql') return false;

    const fs = require('fs');
    const head = fs.readFileSync(inputPath, 'utf-8').slice(0, 2000);
    return /CREATE\s+TABLE/i.test(head);
}

// ── Register ───────────────────────────────────────────────────────

register({
    name: 'sql2er',
    description: 'SQL DDL → ER diagram',
    fileExtensions: ['.sql'],
    diagramType: 'er',
    detect,
    extract,
});

module.exports = { name: 'sql2er', detect, extract, parseSQL };
