#!/usr/bin/env node
/**
 * build.js — Packaging workflow for xiaosu-draw-ai.
 *
 * Reads VERSION, validates required files, and assembles the distributable
 * package into output/xiaosu-draw-ai/.
 *
 * Usage:
 *   node scripts/build.js              # Full build
 *   node scripts/build.js --dry-run    # Preview without writing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'output', 'xiaosu-draw-ai');

// ── Helpers ───────────────────────────────────────────────────────

function readVersion() {
    const vPath = path.join(ROOT, 'VERSION');
    if (!fs.existsSync(vPath)) {
        throw new Error('VERSION file not found. Create it with a semver string (e.g., "0.1.0").');
    }
    return fs.readFileSync(vPath, 'utf-8').trim();
}

function checkFile(filePath, label) {
    const fullPath = path.join(ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
        return `Missing: ${label} (${filePath})`;
    }
    return null;
}

function dirSize(dirPath) {
    let total = 0;
    function walk(d) {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const e of entries) {
            const p = path.join(d, e.name);
            if (e.isFile()) {
                total += fs.statSync(p).size;
            } else if (e.isDirectory()) {
                walk(p);
            }
        }
    }
    if (fs.existsSync(dirPath)) {
        walk(dirPath);
    }
    return total;
}

function fileCount(dirPath) {
    let count = 0;
    function walk(d) {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const e of entries) {
            if (e.isFile()) count++;
            else if (e.isDirectory()) walk(path.join(d, e.name));
        }
    }
    if (fs.existsSync(dirPath)) walk(dirPath);
    return count;
}

function copyDir(src, dest, exclude = []) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const e of entries) {
        if (exclude.includes(e.name)) continue;
        const srcPath = path.join(src, e.name);
        const destPath = path.join(dest, e.name);
        if (e.isFile()) {
            fs.copyFileSync(srcPath, destPath);
        } else if (e.isDirectory()) {
            copyDir(srcPath, destPath, exclude);
        }
    }
}

// ── Validation ────────────────────────────────────────────────────

function validateFrontmatter(filePath) {
    const content = fs.readFileSync(path.join(ROOT, filePath), 'utf-8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
        return `SKILL.md missing YAML frontmatter (--- ... ---).`;
    }
    const fm = fmMatch[1];
    const required = ['name', 'version', 'description'];
    for (const field of required) {
        if (!fm.includes(`${field}:`)) {
            return `SKILL.md frontmatter missing required field: "${field}"`;
        }
    }
    return null;
}

function validateAll() {
    const errors = [];

    // Check VERSION
    try {
        const version = readVersion();
        if (!/^\d+\.\d+\.\d+/.test(version)) {
            errors.push(`VERSION is not valid semver: "${version}"`);
        }
    } catch (e) {
        errors.push(e.message);
    }

    // Critical files
    const required = [
        ['SKILL.md', 'SKILL.md (agent workflow)'],
        ['CLAUDE.md', 'CLAUDE.md (mod routing table)'],
        ['references/rules.md', 'references/rules.md (P0-P3 rules)'],
        ['references/xml-authoring.md', 'references/xml-authoring.md (XML guide)'],
        ['scripts/validate.py', 'scripts/validate.py (structural lint)'],
        ['scripts/export.js', 'scripts/export.js (CLI export)'],
    ];
    for (const [fp, label] of required) {
        const err = checkFile(fp, label);
        if (err) errors.push(err);
    }

    // Validate SKILL.md frontmatter
    const fmErr = validateFrontmatter('SKILL.md');
    if (fmErr) errors.push(fmErr);

    return errors;
}

// ── Generate README ───────────────────────────────────────────────

function generateReadme(version) {
    return `# xiaosu-draw-ai v${version}

> Universal AI diagramming skill — pure SKILL.md + draw.io CLI driven.

Generate production-quality architecture, sequence, ER, flowchart, deployment,
class, C4, state machine, network, and data flow diagrams from natural language
descriptions.

## Quick Start

Describe your system in natural language and the AI will generate a \`.drawio\`
file with proper layout, colors, and connections.

## Installation

### Claude Code
\`\`\`bash
npx skills add <your-repo>/xiaosu-draw-ai
\`\`\`

### Codex
\`\`\`bash
codex skill install <your-repo>/xiaosu-draw-ai
\`\`\`

### Cursor
Copy \`SKILL.md\` to your \`.cursor/skills/\` directory.

### Generic
\`\`\`bash
git clone <your-repo>/xiaosu-draw-ai ~/.agents/skills/xiaosu-draw-ai
\`\`\`

## Dependencies

- **draw.io desktop app** — CLI ≥ 24.0.0 on PATH
- **Python 3** — for \`validate.py\` (structural lint)
- **Node.js** — for \`export.js\` and \`build.js\`

## Diagram Types

| Type | Trigger Examples |
|------|-----------------|
| Architecture | "architecture diagram", "system design" |
| Sequence | "sequence diagram", "interaction flow" |
| ER Diagram | "ER diagram", "database design" |
| Flowchart | "flowchart", "business process" |
| Deployment | "deployment diagram", "infrastructure" |
| UML Class | "class diagram", "UML" |
| C4 Model | "C4 diagram", "container diagram" |
| State Machine | "state machine", "state diagram" |
| Network Topology | "network diagram", "topology" |
| Data Flow | "data flow diagram", "DFD" |

## Project Structure

\`\`\`
SKILL.md              Agent workflow instructions
CLAUDE.md             Modification routing table (dev guide)
references/           Rulebook & authoring guides
scripts/              validate.py, export.js, build.js
styles/               Visual style reference (Phase 2+)
templates/            Prompt templates (Phase 2+)
tests/golden/         Regression test fixtures
\`\`\`

## License

MIT
`;
}

// ── Generate Manifest ─────────────────────────────────────────────

function generateManifest(version) {
    const now = new Date().toISOString().split('T')[0];
    return {
        name: 'xiaosu-draw-ai',
        version,
        description: 'Universal AI diagramming skill — pure SKILL.md + draw.io CLI driven',
        license: 'MIT',
        buildDate: now,
        requires: {
            drawio: '>=24.0.0',
            python: '>=3.0',
            node: '>=14.0',
        },
        platforms: ['windows', 'macos', 'linux'],
        pipeline: 'C only (Phase 1)',
        files: [
            'SKILL.md',
            'references/',
            'scripts/',
            'styles/',
            'templates/',
        ],
    };
}

// ── Build ─────────────────────────────────────────────────────────

function build(dryRun = false) {
    console.log('=== xiaosu-draw-ai build ===\n');

    // Step 1: Validate
    console.log('1. Validating source files...');
    const errors = validateAll();
    if (errors.length > 0) {
        console.error('Validation errors:');
        for (const e of errors) {
            console.error(`  ✗ ${e}`);
        }
        process.exit(1);
    }
    console.log('  ✓ All validations passed.\n');

    // Step 2: Read version
    const version = readVersion();
    console.log(`2. Version: ${version}\n`);

    if (dryRun) {
        console.log('[DRY RUN] Would create output at:', OUTPUT_DIR);
        return;
    }

    // Step 3: Clean and create output directory
    console.log('3. Preparing output directory...');
    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('  ✓ Created output/xiaosu-draw-ai/\n');

    // Step 4: Copy source files (exclude tests/, .drawio/, .gitkeep files, build artifacts)
    console.log('4. Copying source files...');
    const copyExclude = ['tests', '.drawio', 'output', 'node_modules', '__pycache__', '.git', 'xiaosu-draw-ai-design.md', 'CHANGELOG.md'];

    const dirsToCopy = ['references', 'scripts', 'styles', 'templates'];
    for (const dir of dirsToCopy) {
        const src = path.join(ROOT, dir);
        const dest = path.join(OUTPUT_DIR, dir);
        if (fs.existsSync(src)) {
            copyDir(src, dest);
            console.log(`  Copied: ${dir}/`);
        }
    }

    // Copy SKILL.md
    fs.copyFileSync(path.join(ROOT, 'SKILL.md'), path.join(OUTPUT_DIR, 'SKILL.md'));
    console.log('  Copied: SKILL.md');
    console.log();

    // Step 5: Generate README.md
    console.log('5. Generating README.md...');
    const readmeContent = generateReadme(version);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readmeContent, 'utf-8');
    console.log('  ✓ Generated README.md\n');

    // Step 6: Generate manifest.json
    console.log('6. Generating manifest.json...');
    const manifest = generateManifest(version);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    console.log('  ✓ Generated manifest.json\n');

    // Step 7: Report
    console.log('=== Build Report ===');
    const nFiles = fileCount(OUTPUT_DIR);
    const totalSize = dirSize(OUTPUT_DIR);
    const sizeKB = (totalSize / 1024).toFixed(1);
    console.log(`  Files: ${nFiles}`);
    console.log(`  Size:  ${sizeKB} KB`);
    console.log(`  Output: ${OUTPUT_DIR}`);
    console.log('\n✓ Build complete!');
}

// ── Main ──────────────────────────────────────────────────────────

const dryRun = process.argv.includes('--dry-run');
build(dryRun);
