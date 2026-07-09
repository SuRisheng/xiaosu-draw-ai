#!/usr/bin/env node
/**
 * install.js — Local install helper for xiaosu-draw-ai.
 *
 * Copies or links the skill directory to the agent's skills directory.
 * Not a platform-specific installer — just a convenience script.
 *
 * Usage:
 *   node install.js                        # Interactive install
 *   node install.js --check                # Check prerequisites only
 *   node install.js --agent <name>         # Install for specific agent
 *   node install.js --output <dir>         # Custom output directory
 *   node install.js --help                 # Show help
 *
 * Supported targets:
 *   claude-code    Claude Code (writes to ~/.claude/skills/)
 *   generic        Generic agent (requires --output <dir>)
 *
 * Exit codes:
 *   0 — Success
 *   1 — Prerequisites not met
 *   2 — Installation failed
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Argument Parsing ──────────────────────────────────────────────

function parseArgs() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`xiaosu-draw-ai installer

Usage: node install.js [options]

Options:
  --check          Check prerequisites only (no installation)
  --agent <name>   Target: claude-code, generic
  --output <dir>   Custom output directory (required for --agent generic)
  --verbose        Verbose output
  --help, -h       Show this help

Examples:
  node install.js                           # Interactive install
  node install.js --agent claude-code       # Install for Claude Code
  node install.js --output ~/.agents/skills/xiaosu-draw-ai  # Install to custom dir
  node install.js --check                   # Check if ready to install

Prerequisites:
  - Node.js >= 14.0
  - draw.io desktop app CLI >= 24.0.0 (PATH or detectable)
  - (Optional) Python 3 for validate.py
`);
        process.exit(0);
    }

    return {
        check: args.includes('--check'),
        agent: args.includes('--agent') ? args[args.indexOf('--agent') + 1] || 'generic' : null,
        output: args.includes('--output') ? args[args.indexOf('--output') + 1] : null,
        verbose: args.includes('--verbose'),
    };
}

// ── Prerequisite Checks ────────────────────────────────────────────

function checkNodeVersion() {
    const version = process.version;
    const major = parseInt(version.replace('v', '').split('.')[0], 10);
    return {
        ok: major >= 14,
        version,
        message: major >= 14 ? `Node.js ${version} ✓` : `Node.js ${version} ✗ (need >= 14)`,
    };
}

function checkDrawioCLI(verbose) {
    const platform = process.platform;
    const candidates = [];

    if (platform === 'win32') {
        candidates.push(
            'drawio',
            'draw.io',
            'C:\\Program Files\\draw.io\\draw.io.exe',
            path.join(process.env.LOCALAPPDATA || '', 'draw.io', 'draw.io.exe')
        );
    } else if (platform === 'darwin') {
        candidates.push(
            'drawio',
            'draw.io',
            '/Applications/draw.io.app/Contents/MacOS/draw.io'
        );
    } else {
        candidates.push('drawio', 'draw.io', '/usr/bin/drawio', '/usr/local/bin/drawio');
    }

    for (const bin of candidates) {
        try {
            const result = spawnSync(bin, ['--version'], {
                timeout: 10000,
                windowsHide: true,
                stdio: 'pipe',
                encoding: 'utf-8',
            });

            const output = (result.stdout || '').toString().trim();
            if (output || result.status === 0) {
                // Try to extract version number
                const verMatch = output.match(/(\d+\.\d+\.\d+)/);
                const version = verMatch ? verMatch[1] : 'unknown';
                const major = verMatch ? parseInt(verMatch[1].split('.')[0], 10) : 0;

                return {
                    ok: true,
                    binary: bin,
                    version,
                    majorVersion: major,
                    message: `draw.io CLI: ${bin} v${version} ✓`,
                };
            }
        } catch (e) {
            if (verbose) console.error(`  Tried ${bin}: ${e.message}`);
        }
    }

    return {
        ok: false,
        binary: null,
        version: null,
        majorVersion: 0,
        message: 'draw.io CLI: not found ✗',
    };
}

function checkPython(verbose) {
    const candidates = ['python3', 'python'];

    for (const bin of candidates) {
        try {
            const result = spawnSync(bin, ['--version'], {
                timeout: 5000,
                windowsHide: true,
                stdio: 'pipe',
                encoding: 'utf-8',
            });
            const output = (result.stdout || result.stderr || '').toString().trim();
            if (output.includes('Python')) {
                return {
                    ok: true,
                    binary: bin,
                    version: output.replace('Python ', ''),
                    message: `Python: ${output} ✓`,
                };
            }
        } catch (e) {
            if (verbose) console.error(`  Tried ${bin}: ${e.message}`);
        }
    }

    return {
        ok: false,
        binary: null,
        version: null,
        message: 'Python 3: not found (optional, validate.py needs it) ⚠',
    };
}

// ── Agent Config Writers ───────────────────────────────────────────

function getAgentInstallPath(agent) {
    const home = os.homedir();

    switch (agent) {
        case 'claude-code':
            return path.join(home, '.claude', 'skills', 'xiaosu-draw-ai');
        case 'generic':
            return null; // requires --output
        default:
            return path.join(home, '.agents', 'skills', 'xiaosu-draw-ai');
    }
}

function writeInstallConfig(installDir, sourceDir, agent) {
    // Copy skill files to install directory
    const filesToCopy = [
        'SKILL.md',
    ];

    const dirsToCopy = [
        'references',
        'styles',
        'templates',
        'scripts',
    ];

    // Create install directory
    fs.mkdirSync(installDir, { recursive: true });

    // Copy individual files
    for (const file of filesToCopy) {
        const src = path.join(sourceDir, file);
        const dst = path.join(installDir, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dst);
        }
    }

    // Copy directories
    for (const dir of dirsToCopy) {
        const src = path.join(sourceDir, dir);
        const dst = path.join(installDir, dir);
        if (fs.existsSync(src)) {
            fs.mkdirSync(dst, { recursive: true });
            copyDirRecursive(src, dst);
        }
    }

    // Write agent-specific config metadata
    const metadata = {
        name: 'xiaosu-draw-ai',
        version: readVersion(sourceDir),
        installed_at: new Date().toISOString(),
        agent,
        platform: process.platform,
        node_version: process.version,
    };

    fs.writeFileSync(
        path.join(installDir, '.install-meta.json'),
        JSON.stringify(metadata, null, 2) + '\n'
    );

    return metadata;
}

function copyDirRecursive(src, dst) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const dstPath = path.join(dst, entry.name);
        if (entry.isDirectory()) {
            fs.mkdirSync(dstPath, { recursive: true });
            copyDirRecursive(srcPath, dstPath);
        } else {
            fs.copyFileSync(srcPath, dstPath);
        }
    }
}

function readVersion(sourceDir) {
    const skillPath = path.join(sourceDir, 'SKILL.md');
    try {
        const content = fs.readFileSync(skillPath, 'utf-8');
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (fmMatch) {
            const versionMatch = fmMatch[1].match(/^version:\s*(.+)$/m);
            if (versionMatch) {
                return versionMatch[1].trim();
            }
        }
        return 'unknown';
    } catch {
        return 'unknown';
    }
}

// ── Interactive Install ────────────────────────────────────────────

function interactiveInstall(sourceDir) {
    console.log('\n=== xiaosu-draw-ai Installer ===\n');
    console.log('Which agent platform are you using?');
    console.log('  1. Claude Code');
    console.log('  2. Generic (custom path)');
    console.log('');

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('Enter number (1-2): ', (answer) => {
            rl.close();

            const agentMap = {
                '1': 'claude-code',
                '2': 'generic',
            };

            const agent = agentMap[answer.trim()] || 'claude-code';
            let installDir = getAgentInstallPath(agent);

            if (agent === 'generic') {
                const rl2 = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                });
                rl2.question('Enter install directory: ', (dir) => {
                    rl2.close();
                    resolve({ agent, installDir: dir.trim() || installDir });
                });
            } else {
                resolve({ agent, installDir });
            }
        });
    });
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
    const options = parseArgs();
    const sourceDir = path.resolve(__dirname, '..');

    console.log('xiaosu-draw-ai — Prerequisite Check');
    console.log('====================================\n');

    // Run prerequisite checks
    const nodeCheck = checkNodeVersion();
    const drawioCheck = checkDrawioCLI(options.verbose);
    const pythonCheck = checkPython(options.verbose);

    console.log(`  ${nodeCheck.message}`);
    console.log(`  ${drawioCheck.message}`);
    console.log(`  ${pythonCheck.message}`);

    const allOk = nodeCheck.ok && drawioCheck.ok;

    if (!allOk) {
        console.log('\n⚠  Some prerequisites are not met.');
        if (!drawioCheck.ok) {
            console.log('\nTo install draw.io CLI:');
            console.log('  Windows: Download from https://www.drawio.com/');
            console.log('           Add "C:\\Program Files\\draw.io" to PATH');
            console.log('  macOS:   brew install --cask drawio');
            console.log('  Linux:   snap install drawio');
            console.log('           Or download AppImage from drawio.com');
        }
    }

    if (options.check) {
        // Check-only mode: exit with status
        console.log(allOk ? '\n✓ Ready to install.' : '\n✗ Prerequisites not met.');
        process.exit(allOk ? 0 : 1);
    }

    if (!allOk) {
        console.error('\nError: Cannot install — prerequisites not met.');
        process.exit(1);
    }

    // Proceed with installation
    console.log('\n✓ All prerequisites met.\n');

    // Determine install target
    (async () => {
        let agent, installDir;

        if (options.agent) {
            agent = options.agent;
            installDir = options.output || getAgentInstallPath(agent);
        } else {
            const choice = await interactiveInstall(sourceDir);
            agent = choice.agent;
            installDir = choice.installDir;
        }

        if (!installDir) {
            console.error('Error: No install directory specified. Use --output <dir>.');
            process.exit(2);
        }

        console.log(`\nInstalling for: ${agent}`);
        console.log(`Install directory: ${installDir}`);

        try {
            const metadata = writeInstallConfig(installDir, sourceDir, agent);

            console.log(`\n✓ Installation complete!`);
            console.log(`  Version: ${metadata.version}`);
            console.log(`  Agent: ${metadata.agent}`);
            console.log(`  Location: ${installDir}`);

            // Print usage hint
            if (agent === 'claude-code') {
                console.log(`\n  Restart Claude Code to load the skill, then say:`);
                console.log(`  "画一个电商系统的架构图" — or describe any diagram in natural language.`);
            } else {
                console.log(`\n  Configure your agent to load skills from: ${installDir}`);
                console.log(`  See README.md for agent-specific setup instructions.`);
            }
        } catch (err) {
            console.error(`\nError: Installation failed: ${err.message}`);
            process.exit(2);
        }
    })();
}

main();
