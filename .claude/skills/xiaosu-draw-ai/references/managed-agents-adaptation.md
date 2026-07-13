# Managed Agents Adaptation Guide

> **Status:** Phase 5 — planned, NOT yet implemented.
> **When to read:** When adapting xiaosu-draw-ai from a local Claude Code Skill to a Managed Agent on the Claude API platform.
> **Source:** DESIGN.md §2 — Platform boundaries.

---

## Key Differences: Local Skill vs Managed Agent

| Concept | Local Skill (current) | Managed Agent (future) |
|---------|----------------------|------------------------|
| **Deployment** | `~/.claude/skills/` directory on disk | Agent configuration in the cloud |
| **Lifecycle** | Loaded on-demand per session | Persistent — Agent once, Session many |
| **Configuration** | `SKILL.md` + supporting files | Agent config: `model`, `system`, `tools`, `skills` |
| **Resources** | Local filesystem (`references/`, `styles/`, `scripts/`) | Bundled with Agent or fetched from remote |
| **Secrets** | Environment variables | Vault (never in SKILL.md or system prompt) |
| **Execution** | Agent's local Node.js/Python runtime | Server-side sandbox |

---

## Adaptation Rules

### R1: Agent vs Session

**DO NOT create a new Agent per request.** The Agent is a persistent object; Sessions are transient.

```
WRONG: Each "draw a diagram" request → new Agent
RIGHT: One "xiaosu-draw-ai" Agent → many Sessions
```

Configuration that belongs to the **Agent** (set once):
- `model` (which Claude model to use)
- `system` (system prompt — can reference SKILL.md content)
- `tools` (draw.io CLI wrapper, validate.py invocation, export.js invocation)
- `skills` (reference to the xiaosu-draw-ai skill package)

Configuration that belongs to the **Session** (per-request):
- User messages ("画一个架构图")
- Diagram-specific context (file paths, diagram name)
- Iteration state (which pipeline, how many retries)

### R2: Skill Package Structure

The skill package must remain a directory with `SKILL.md` at root, NOT a single file:

```
skills/xiaosu-draw-ai/
├── SKILL.md          ← Agent reads this as the entry point
├── references/       ← On-demand knowledge (rules, guides)
├── templates/        ← User interaction guides
├── styles/           ← Visual presets
├── scripts/          ← Validation, export, routing utilities
└── data/             ← Structured indexes
```

### R3: Secrets in Vault, Never in SKILL.md

| What | Where | Why |
|------|-------|-----|
| API keys, tokens | Vault | Never in system prompts, SKILL.md, or memory |
| File paths | Environment or Session config | May differ between deployments |
| draw.io CLI path | Tool configuration | Platform-dependent |
| Output directory | Session parameter | May vary per request |

### R4: Keep Local Skill Simplicity

Do NOT sacrifice the local Skill's simplicity for Managed Agent compatibility.
The local `SKILL.md + directory` model remains the reference implementation.
Managed Agent adaptation is a wrapper layer, not a rewrite.

---

## Adaptation Steps (When Ready)

### Step 1: Create Agent Configuration

```json
{
  "name": "xiaosu-draw-ai",
  "model": "claude-sonnet-5",
  "system": "You are a diagramming assistant. Follow the workflow in SKILL.md...",
  "tools": ["drawio-cli", "python-validate", "node-export"],
  "skills": ["xiaosu-draw-ai"]
}
```

### Step 2: Map Scripts to Tools

Each `scripts/` utility becomes a registered tool:

| Script | Tool Name | Input | Output |
|--------|-----------|-------|--------|
| `validate.py` | `python-validate` | `.drawio` file path | JSON (errors, warnings, score) |
| `export.js` | `node-export` | `.drawio` file path + flags | Output file path |
| `audit.js` | `node-audit` | `.drawio` file path | JSON (P3 findings) |
| `mermaid-convert.js` | `mermaid-convert` | `.mmd` file path | `.drawio` file path |
| `router.js` | (library, not a tool) | — | Called internally |

### Step 3: Adapt File I/O

Local Skill reads/writes to `.drawio/` directory. Managed Agent needs a sandbox path:

```javascript
// Local
const outputDir = path.join(process.cwd(), '.drawio');

// Managed Agent
const outputDir = process.env.SANDBOX_DIR || path.join(process.cwd(), '.drawio');
```

### Step 4: Test Golden Regression

After adaptation, run the full golden regression suite to confirm no quality degradation:

```bash
node tests/integration/test_golden_regression.js
# Must produce 10/10 passed
```

---

## Constraints (Do Not Violate)

1. **Never put API keys in SKILL.md.** Even for testing.
2. **Never create Agent-per-request.** One Agent, many Sessions.
3. **Never make local Skill harder to use** to accommodate Managed Agents.
4. **Never skip quality gates** just because the Agent is remote.
5. **Always run the golden regression** after adapting to confirm score parity.

---

## Cross-Reference

- **DESIGN.md §2**: Full platform boundary specification
- **SKILL.md §Installation Notes**: Local install instructions
- **README.md §Installation**: User-facing install guide
- **scripts/install.js**: Local install helper
