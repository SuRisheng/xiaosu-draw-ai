[English](README.md) | [中文](README_CN.md)

---

# xiaosu-draw-ai

> Universal AI diagramming skill — pure SKILL.md + draw.io CLI driven, not coupled to any specific Agent platform.

**Generate production-quality architecture, sequence, ER, flowchart, deployment, class, C4, state machine, network, and data flow diagrams** from natural language descriptions.

**Version:** 1.0.0 &nbsp;|&nbsp; **Phase:** 4 (all 3 pipelines) &nbsp;|&nbsp; **License:** MIT

---

## About

xiaosu-draw-ai is an AI-powered diagramming skill that turns natural language into editable `.drawio` files. Built on the draw.io desktop CLI, it supports 10 diagram types across 3 rendering pipelines — AI hand-writes XML (Pipeline C), Mermaid conversion (Pipeline B), and data-driven importers for SQL and OpenAPI (Pipeline A). Every diagram passes through mandatory quality gates: structural validation (P0-P2), heuristic visual audit (P3), and AI visual self-check.

The skill is packaged as a single directory — `skills/xiaosu-draw-ai/` — containing the agent workflow (`SKILL.md`), 14 reference documents, 20 prompt templates (Chinese + English), 7 structured JSON style presets, and 13 scripts for validation, export, routing, and installation. It installs by copying or symlinking into any agent's skills directory. No API keys, no platform lock-in, no runtime dependencies beyond draw.io CLI, Python 3, and Node.js.

Designed for developers, architects, and anyone who wants diagrams that are structurally correct, visually readable, and always editable — without learning draw.io XML or Mermaid syntax.

---

## Features

| Feature | Description |
|---------|-------------|
| **10 Diagram Types** | Architecture, Sequence, ER, Flowchart, Deployment, Class, C4, State Machine, Network, Data Flow |
| **3 Rendering Pipelines** | A: data-driven (SQL/OpenAPI → diagram), B: Mermaid (.mmd → .drawio), C: AI hand-writes XML |
| **7 Visual Styles** | Flat Icon (default), Dark Terminal, Blueprint, Notion Clean, Glassmorphism, Claude Official, OpenAI |
| **P0-P3 Quality Gates** | Structural lint (Python), heuristic audit (Node.js), AI visual self-check |
| **20 Prompt Templates** | Chinese (zh/) + English (en/), 10 diagram types each — with guided discovery questions |
| **Arrow Semantics** | 7 semantic edge kinds: primary, async, memoryRead, memoryWrite, control, feedback, neutral |
| **Cross-Platform** | Windows, macOS, Linux — unified export via draw.io CLI |
| **No Lock-In** | Output is standard `.drawio` XML — editable in draw.io desktop, VS Code, or any MXGraph editor |

---

## Diagram Types

| Type | Trigger examples | Layout |
|------|-----------------|--------|
| **System Architecture** | "architecture diagram", "microservices" | Top→bottom layers |
| **Sequence Diagram** | "sequence diagram", "interaction flow" | Left→right, time↓ |
| **ER Diagram** | "ER diagram", "database design" | Spread, min crossings |
| **Flowchart** | "flowchart", "business process" | Top→bottom, branches |
| **Deployment Diagram** | "deployment", "infrastructure" | Through security zones |
| **UML Class Diagram** | "class diagram", "UML" | Inheritance↓, association→ |
| **C4 Model** | "C4 diagram", "container diagram" | Person→System→External |
| **State Machine** | "state machine", "state transition" | Left→right states |
| **Network Topology** | "network diagram", "topology" | Through network zones |
| **Data Flow Diagram** | "data flow", "DFD", "data pipeline" | Top→bottom pipeline |

---

## Installation

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [draw.io Desktop](https://www.drawio.com/) | ≥ 24.0.0 | CLI export engine (PNG/SVG/PDF) |
| Python 3 | ≥ 3.8 | Structural validation (`validate.py`) |
| Node.js | ≥ 14.0 | Export, build, audit, install scripts |

### Method 1: Symlink (recommended for development)

Changes to source take effect immediately — no rebuild needed.

**macOS / Linux:**
```bash
ln -s "$(pwd)/skills/xiaosu-draw-ai" ~/.claude/skills/xiaosu-draw-ai
```

**Windows (requires admin or Developer Mode):**
```cmd
mklink /D "%USERPROFILE%\.claude\skills\xiaosu-draw-ai" "<repo>\skills\xiaosu-draw-ai"
```

### Method 2: Release install (from built package)

```bash
# 1. Build the distributable package
node skills/xiaosu-draw-ai/scripts/build.js

# 2. Copy to your agent's skills directory
# macOS / Linux
cp -r ./.claude/skills/xiaosu-draw-ai ~/.claude/skills/xiaosu-draw-ai

# Windows (PowerShell)
Copy-Item -Recurse .\.claude\skills\xiaosu-draw-ai $env:USERPROFILE\.claude\skills\xiaosu-draw-ai
```

### Method 3: Generic agent platform

Copy the entire `skills/xiaosu-draw-ai/` directory to your agent's skills directory. **Do NOT copy only `SKILL.md`** — `references/`, `scripts/`, `styles/`, and `templates/` must be colocated.

---

## How to Add a Diagram Template

Templates are markdown files that guide the AI through requirements gathering. There are 20 templates — 10 diagram types × 2 languages (`zh/` + `en/`).

### Add a new diagram type

**1. Create the template** at `skills/xiaosu-draw-ai/templates/{zh|en}/<new-type>.md`:

```markdown
# <Diagram Name>

## What this diagram shows
One-sentence description.

## When to use
- Scenario A
- Scenario B

## How to describe your needs
1. What is the system/flow called?
2. What are the main components?
3. How do they connect?

## Example
> Draw a ...

## Constraints (AI MUST follow)
- Layout: direction, layer spacing, node spacing (write exact px values)
- Shapes: which shapes for which roles (write exact shape names)
- Edges: arrow styles, routing rules
- Colors: use style preset, do not guess
```

**2. Add type presets** in `skills/xiaosu-draw-ai/references/diagram-types.md` — define shapes, colors, layout defaults, edge styles, and spacing rules for the new type.

**3. Register in `SKILL.md`** — add the new type to the template-conversation table so the AI knows when to route to it.

### Customize an existing template

Edit the `## Constraints` section — that's what the AI reads before generating. Use specific px values and shape names. Never use placeholder text like `<insert shapes here>`.

---

## How to Modify Styles

Styles are structured JSON presets at `skills/xiaosu-draw-ai/styles/built-in/`. Each file defines the complete visual parameters the AI uses when generating a diagram. The schema is defined in `styles/schema.json`.

### Style file structure

```json
{
  "name": "my-style",
  "palette": {
    "primary":   { "fillColor": "#dae8fc", "strokeColor": "#6c8ebf" },
    "success":   { "fillColor": "#d5e8d4", "strokeColor": "#82b366" },
    "warning":   { "fillColor": "#fff2cc", "strokeColor": "#d6b656" },
    "accent":    { "fillColor": "#ffe6cc", "strokeColor": "#d79b00" },
    "danger":    { "fillColor": "#f8cecc", "strokeColor": "#b85450" },
    "neutral":   { "fillColor": "#f5f5f5", "strokeColor": "#666666" },
    "secondary": { "fillColor": "#e1d5e7", "strokeColor": "#9673a6" }
  },
  "roles": {
    "service":   "primary",
    "database":  "success",
    "queue":     "warning",
    "gateway":   "accent",
    "error":     "danger",
    "external":  "neutral",
    "security":  "secondary",
    "container": "primary"
  },
  "shapes": {
    "service":   "rounded=1;whiteSpace=wrap;html=1",
    "database":  "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15"
  },
  "font": { "fontFamily": "Helvetica", "fontSize": 12 },
  "edges": {
    "style": "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1",
    "arrow": "endArrow=classic;endFill=1"
  }
}
```

### Create a new style

1. **Copy an existing preset** from `styles/built-in/` as a starting point.
2. **Edit the JSON** — adjust `palette` colors, `roles` mappings, `font` settings, `shapes`, and `edges` tokens.
3. **Validate** against the schema:
   ```bash
   node -e "const s=require('./skills/xiaosu-draw-ai/styles/schema.json'); console.log(JSON.parse(require('fs').readFileSync('./skills/xiaosu-draw-ai/styles/built-in/my-style.json','utf8')))"
   ```
4. **Register** in `skills/xiaosu-draw-ai/references/style-presets.md` — add the style to the lookup table with trigger keywords (e.g. "dark", "modern", "minimal").
5. **Add to `SKILL.md`** Style Selection table so the AI knows when to select it.

### Override a specific color

Each semantic role maps to a palette slot via the `roles` field. The AI resolves `roles.<role>` → `palette.<slot>` at generation time. To change "all services to orange":

```json
"palette": { "primary": { "fillColor": "#fff3e0", "strokeColor": "#e65100" } }
```

No script changes needed — the lookup protocol handles it.

### Built-in styles

| Style | File | Best for | Trigger words |
|-------|------|----------|---------------|
| Flat Icon | `flat-icon.json` | Architecture, ER, flowcharts (default) | *(default)* |
| Dark Terminal | `dark-terminal.json` | Data flow, network, AI architectures | "dark", "terminal", "dark mode" |
| Blueprint | `blueprint.json` | Architecture, class/ER, sequence | "blueprint", "engineering" |
| Notion Clean | `notion-clean.json` | All types — universal | "clean", "minimal", "notion" |
| Glassmorphism | `glassmorphism.json` | AI/agent, product demos, keynotes | "glass", "frosted", "modern" |
| Claude Official | `claude-official.json` | Architecture, system docs | "claude style", "warm", "professional" |
| OpenAI | `openai.json` | Technical docs, API diagrams | "openai style", "spartan", "ultra-clean" |

---

## Quality System

Every diagram passes through mandatory quality gates before delivery:

| Level | Checked By | Blocks? | What It Catches |
|-------|-----------|---------|-----------------|
| **P0** | `validate.py` automated | Yes (exit 2) | Dangling edges, duplicate IDs, XML corruption |
| **P1** | `validate.py` automated | Yes (exit 1) | Overlapping nodes, edge-through-vertex, edge crossings |
| **P2** | `validate.py` automated | No (exit 0) | Off-grid coords, off-center connections, short arrow segments |
| **P3** | `audit.js` heuristic + AI visual audit | Advisory | Label truncation, edge overlap, z-order, legend collision |

Maximum **3 auto-repair rounds**. If validation still fails after 3 attempts, the AI reports remaining issues and asks whether to proceed.

---

## Development

```bash
# Structural lint on a .drawio file
python3 skills/xiaosu-draw-ai/scripts/validate.py <file.drawio> --score

# Export preview PNG
node skills/xiaosu-draw-ai/scripts/export.js <file.drawio>

# Build distributable package
node skills/xiaosu-draw-ai/scripts/build.js
node skills/xiaosu-draw-ai/scripts/build.js --dry-run          # Preview without writing

# Run tests
python3 -m pytest tests/unit/
node tests/unit/test_ir_schema.js
node tests/integration/test_golden_regression.js
```

---

## Project Structure

```
xiaosu-draw-ai/
├── README.md / README_CN.md          # Project overview (EN + CN)
├── doc/DESIGN.md                     # Authoritative design document
├── CHANGELOG.md                      # Release history
├── CLAUDE.md                         # Developer routing guide (Chinese)
├── LICENSE
│
├── skills/xiaosu-draw-ai/            # The Skill package
│   ├── SKILL.md                      # Agent behavior entry point
│   ├── references/                   # 14 on-demand rule documents
│   ├── templates/                    # 20 prompt templates (zh/ + en/)
│   ├── styles/                       # Schema + 7 built-in JSON presets
│   ├── scripts/                      # 13 scripts (validate, export, build, install, etc.)
│   └── data/                         # Structured data index (reserved)
│
├── tests/                            # L0-L2 test suite (unit, integration, e2e, golden)
├── .drawio/                          # Dev verification diagrams
├── .github/workflows/                # CI (4 jobs)
└── .claude/skills/                   # Build output (do not hand-edit)
```

---

## License

MIT
