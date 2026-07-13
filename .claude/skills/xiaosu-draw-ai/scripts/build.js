#!/usr/bin/env node
/**
 * build.js — Packaging workflow for xiaosu-draw-ai.
 *
 * Reads version from SKILL.md frontmatter (single source of truth),
 * validates required files, and assembles the distributable
 * package into .claude/skills/xiaosu-draw-ai/.
 *
 * Usage:
 *   node scripts/build.js              # Full build
 *   node scripts/build.js --dry-run    # Preview without writing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_ROOT = path.resolve(__dirname, '..');           // skills/xiaosu-draw-ai/
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..'); // project root
const OUTPUT_DIR = path.join(PROJECT_ROOT, '.claude', 'skills', 'xiaosu-draw-ai');

// ── Helpers ───────────────────────────────────────────────────────

function readVersion() {
    const skillPath = path.join(SKILL_ROOT, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
        throw new Error('SKILL.md not found. Unable to determine version.');
    }
    const content = fs.readFileSync(skillPath, 'utf-8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
        throw new Error('SKILL.md missing YAML frontmatter (--- ... ---).');
    }
    const versionMatch = fmMatch[1].match(/^version:\s*(.+)$/m);
    if (!versionMatch) {
        throw new Error('SKILL.md frontmatter missing required field: "version"');
    }
    const version = versionMatch[1].trim();
    if (!/^\d+\.\d+\.\d+/.test(version)) {
        throw new Error(`SKILL.md version is not valid semver: "${version}"`);
    }
    return version;
}

function checkFile(filePath, label) {
    const fullPath = path.join(SKILL_ROOT, filePath);
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
    const content = fs.readFileSync(path.join(SKILL_ROOT, filePath), 'utf-8');
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
    const warnings = [];

    // Check SKILL.md version (single source of truth)
    try {
        const version = readVersion();
        console.log(`  ✓ SKILL.md version: ${version}`);
    } catch (e) {
        errors.push(e.message);
    }

    // Critical files
    const required = [
        ['SKILL.md', 'SKILL.md (agent workflow)'],
        ['references/rules.md', 'references/rules.md (P0-P3 rules)'],
        ['references/xml-authoring.md', 'references/xml-authoring.md (XML guide)'],
        ['references/diagram-types.md', 'references/diagram-types.md (type presets)'],
        ['references/mermaid-authoring.md', 'references/mermaid-authoring.md (Pipeline B guide)'],
        ['references/visual-audit.md', 'references/visual-audit.md (P3 audit guide)'],
        ['references/style-presets.md', 'references/style-presets.md (style lookup protocol)'],
        ['styles/schema.json', 'styles/schema.json (style JSON schema)'],
        ['styles/built-in/flat-icon.json', 'styles/built-in/flat-icon.json (default style)'],
        ['styles/built-in/dark-terminal.json', 'styles/built-in/dark-terminal.json (dark terminal)'],
        ['styles/built-in/blueprint.json', 'styles/built-in/blueprint.json (blueprint)'],
        ['styles/built-in/notion-clean.json', 'styles/built-in/notion-clean.json (notion clean)'],
        ['scripts/validate.py', 'scripts/validate.py (structural lint)'],
        ['scripts/export.js', 'scripts/export.js (CLI export)'],
        ['scripts/utils.js', 'scripts/utils.js (shared utilities)'],
    ];
    for (const [fp, label] of required) {
        const err = checkFile(fp, label);
        if (err) errors.push(err);
    }

    // Validate SKILL.md frontmatter
    const fmErr = validateFrontmatter('SKILL.md');
    if (fmErr) errors.push(fmErr);

    // Git tag check (P1 — warning, does not block build)
    try {
        const version = readVersion();
        const tagName = `v${version}`;
        const tagResult = execSync(`git tag -l "${tagName}"`, {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        if (tagResult !== tagName) {
            warnings.push(`Git tag "${tagName}" not found. Create with: git tag -a ${tagName} -m "Release ${tagName}"`);
        }
    } catch (e) {
        warnings.push(`Could not check git tags: ${e.message}`);
    }

    // Test pollution checklist (P1 — see design doc Section 8.3)
    const pollution = checkTestPollution();
    for (const w of pollution) {
        warnings.push(w);
    }

    return { errors, warnings };
}

// ── Test Pollution Check ────────────────────────────────────────────

function checkTestPollution() {
    const warnings = [];
    const crypto = require('crypto');

    // 1. Check tests/golden/ files haven't been modified
    const goldenDir = path.join(PROJECT_ROOT, 'tests', 'golden');
    const scoresPath = path.join(goldenDir, 'scores.json');
    if (fs.existsSync(scoresPath)) {
        try {
            const scores = JSON.parse(fs.readFileSync(scoresPath, 'utf-8'));
            const entries = fs.readdirSync(goldenDir, { withFileTypes: true });
            for (const e of entries) {
                if (e.isFile() && e.name.endsWith('.drawio')) {
                    const filePath = path.join(goldenDir, e.name);
                    const hash = crypto.createHash('sha256')
                        .update(fs.readFileSync(filePath))
                        .digest('hex').substring(0, 16);
                    // Warn if golden file has no entry in scores.json
                    if (!scores[e.name]) {
                        warnings.push(`Test pollution: tests/golden/${e.name} has no entry in scores.json (may have been modified outside validation)`);
                    }
                }
            }
        } catch (e) {
            warnings.push(`Test pollution: could not verify golden file integrity: ${e.message}`);
        }
    }

    // 2. Check for /tmp/xiaosu-draw-ai-test-* residue
    const os = require('os');
    const tmpDir = os.tmpdir();
    try {
        const tmpEntries = fs.readdirSync(tmpDir, { withFileTypes: true });
        const testResidue = tmpEntries.filter(e => e.name.startsWith('xiaosu-draw-ai-test-') || e.name.startsWith('test-audit-'));
        if (testResidue.length > 0) {
            warnings.push(`Test pollution: ${testResidue.length} temp test file(s) found in ${tmpDir} (clean up *.drawio test artifacts)`);
        }
    } catch (e) {
        // tmp dir not readable — skip
    }

    // 3. Check for lingering draw.io processes (platform-specific)
    try {
        if (process.platform === 'win32') {
            const tasklist = execSync('tasklist /FI "IMAGENAME eq draw.io.exe" 2>nul', {
                encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
            });
            if (tasklist.includes('draw.io.exe')) {
                warnings.push('Test pollution: draw.io process still running (may interfere with build)');
            }
        } else {
            const ps = execSync('pgrep -x draw.io 2>/dev/null || true', {
                encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
            }).trim();
            if (ps) {
                warnings.push('Test pollution: draw.io process still running (may interfere with build)');
            }
        }
    } catch (e) {
        // pgrep/tasklist not available — skip
    }

    // 4. Check source directories for unexpected modifications
    // (Heuristic: check that key files have reasonable modification times — not in the future)
    const sourceFiles = [
        'scripts/validate.py',
        'references/rules.md',
        'templates/en/architecture.md',
    ];
    for (const sf of sourceFiles) {
        const sfPath = path.join(SKILL_ROOT, sf);
        if (fs.existsSync(sfPath)) {
            const mtime = fs.statSync(sfPath).mtimeMs;
            const now = Date.now();
            if (mtime > now) {
                warnings.push(`Test pollution: ${sf} has modification time in the future (clock skew or tampering)`);
            }
        }
    }

    // 5. Check that tests/README.md documents the test isolation policy
    const testReadme = path.join(PROJECT_ROOT, 'tests', 'README.md');
    if (fs.existsSync(testReadme)) {
        const readmeContent = fs.readFileSync(testReadme, 'utf-8').toLowerCase();
        if (!readmeContent.includes('isolation') && !readmeContent.includes('no pollution')) {
            warnings.push('Test pollution: tests/README.md does not document test isolation policy');
        }
    }

    return warnings;
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

Copy the entire \`xiaosu-draw-ai/\` directory to your agent's skills directory.
**Do not copy only \`SKILL.md\`** — the \`references/\`, \`scripts/\`, \`styles/\`,
and \`templates/\` directories must be colocated with \`SKILL.md\`.

### Claude Code
\`\`\`bash
cp -r ./.claude/skills/xiaosu-draw-ai ~/.claude/skills/xiaosu-draw-ai
\`\`\`

### Generic (any Agent platform)
\`\`\`bash
cp -r ./.claude/skills/xiaosu-draw-ai <your-agent-skills-dir>/xiaosu-draw-ai
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
references/           Rulebook & authoring guides
scripts/              validate.py, audit.js, export.js, build.js, install.js, utils.js
styles/               Visual style presets (schema + 7 built-in)
templates/            Prompt templates (zh/ + en/)
data/                 Structured JSON data files
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
        description: 'Universal AI diagramming skill — pure SKILL.md + draw.io CLI driven. Phase 2: Pipeline C with full quality gates, templates, visual audit, and 7 style presets.',
        license: 'MIT',
        buildDate: now,
        requires: {
            drawio: '>=24.0.0',
            python: '>=3.0',
            node: '>=14.0',
        },
        platforms: ['windows', 'macos', 'linux'],
        pipeline: 'A/B/C (v1.0.0)',
        files: [
            'SKILL.md',
            'references/',
            'scripts/',
            'styles/',
            'templates/',
            'data/',
        ],
    };
}

// ── Build ─────────────────────────────────────────────────────────

function build(dryRun = false) {
    console.log('=== xiaosu-draw-ai build ===\n');

    // Step 1: Validate
    console.log('1. Validating source files...');
    const { errors, warnings } = validateAll();
    if (errors.length > 0) {
        console.error('Validation errors:');
        for (const e of errors) {
            console.error(`  ✗ ${e}`);
        }
        process.exit(1);
    }
    if (warnings.length > 0) {
        console.warn('Validation warnings (non-blocking):');
        for (const w of warnings) {
            console.warn(`  ⚠ ${w}`);
        }
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
    console.log('  ✓ Created .claude/skills/xiaosu-draw-ai/\n');

    // Step 4: Copy source files (exclude tests/, .drawio/, .gitkeep files, build artifacts)
    console.log('4. Copying source files...');
    const copyExclude = ['tests', '.drawio', '.claude', 'node_modules', '__pycache__', '.git', 'CHANGELOG.md'];

    const dirsToCopy = ['references', 'scripts', 'styles', 'templates', 'data'];
    for (const dir of dirsToCopy) {
        const src = path.join(SKILL_ROOT, dir);
        const dest = path.join(OUTPUT_DIR, dir);
        if (fs.existsSync(src)) {
            copyDir(src, dest);
            console.log(`  Copied: ${dir}/`);
        }
    }

    // Copy SKILL.md (version is already in frontmatter — single source of truth)
    console.log('5. Copying SKILL.md...');
    const skillSrc = path.join(SKILL_ROOT, 'SKILL.md');
    const skillDest = path.join(OUTPUT_DIR, 'SKILL.md');
    fs.copyFileSync(skillSrc, skillDest);
    console.log(`  ✓ Copied SKILL.md (version: ${version})\n`);

    // Step 6: Generate README.md
    console.log('6. Generating README.md...');
    const readmeContent = generateReadme(version);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readmeContent, 'utf-8');
    console.log('  ✓ Generated README.md\n');

    // Step 7: Generate manifest.json
    console.log('7. Generating manifest.json...');
    const manifest = generateManifest(version);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    console.log('  ✓ Generated manifest.json\n');

    // Step 8: Report
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
