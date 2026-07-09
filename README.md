# xiaosu-draw-ai

> 通用 AI 制图 Skill —— 纯 SKILL.md + draw.io CLI 驱动，不与任何 Agent 平台耦合。
> Universal AI diagramming skill — pure SKILL.md + draw.io CLI driven, not coupled to any specific Agent platform.

Generate production-quality **architecture, sequence, ER, flowchart, deployment, class, C4, state machine, network, and data flow diagrams** from natural language descriptions.

**Current Phase**: Phase 4 — All 3 pipelines implemented (A: data-driven, B: Mermaid conversion, C: AI hand-writes XML) with full quality gates, 20 templates, visual audit, and 7 style presets.

## Quick Start

Describe your system in natural language and the AI generates a `.drawio` file:

> "Draw a microservices architecture diagram with an API Gateway (Kong), User Service, Order Service, Product Service, MySQL databases, and Redis cache."

The AI will plan the layout, write XML, validate structure, export a preview PNG, self-check visually, and deliver the final diagram.

## Diagram Types (10 supported)

| Type | Trigger Examples |
|------|-----------------|
| System Architecture | "architecture diagram", "system design", "microservices" |
| Sequence Diagram | "sequence diagram", "interaction flow", "message flow" |
| ER Diagram | "ER diagram", "entity relationship", "database design" |
| Flowchart | "flowchart", "business process", "workflow" |
| Deployment Diagram | "deployment diagram", "infrastructure", "network architecture" |
| UML Class Diagram | "class diagram", "UML", "object model" |
| C4 Model | "C4 diagram", "container diagram", "context diagram" |
| State Machine | "state machine", "state diagram", "state transition" |
| Network Topology | "network diagram", "topology", "network map" |
| Data Flow Diagram | "data flow", "DFD", "data pipeline" |

## Installation

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [draw.io Desktop](https://www.drawio.com/) | ≥ 24.0.0 | CLI export engine |
| Python 3 | ≥ 3.8 | `validate.py` structural lint |
| Node.js | ≥ 14.0 | `export.js` + `build.js` |

### Development Install (symlink — recommended during development)

Link the source directory directly so changes take effect immediately:

**macOS / Linux:**
```bash
ln -s "$(pwd)/skills/xiaosu-draw-ai" ~/.claude/skills/xiaosu-draw-ai
```

**Windows (requires admin or Developer Mode):**
```cmd
mklink /D "%USERPROFILE%\.claude\skills\xiaosu-draw-ai" "<repo>\skills\xiaosu-draw-ai"
```

### Release Install (from built package)

After running `node skills/xiaosu-draw-ai/scripts/build.js`, copy the build output:

```bash
# macOS / Linux
cp -r ./.claude/skills/xiaosu-draw-ai ~/.claude/skills/xiaosu-draw-ai

# Windows (PowerShell)
Copy-Item -Recurse .\.claude\skills\xiaosu-draw-ai $env:USERPROFILE\.claude\skills\xiaosu-draw-ai
```

### Generic Agent Platform

Copy the entire `skills/xiaosu-draw-ai/` directory to your agent's skills directory. **Do not copy only `SKILL.md`** — the `references/`, `scripts/`, `styles/`, and `templates/` directories must be colocated with `SKILL.md`.

## Project Structure

```
xiaosu-draw-ai/
├── README.md                         # Project overview (this file)
├── doc/
│   └── DESIGN.md                     # Authoritative design document
├── CHANGELOG.md                      # Human-maintained changelog
├── CLAUDE.md                         # Dev modification routing table (Chinese)
├── LICENSE
│
├── skills/                           # Source Skill package (primary dev target)
│   └── xiaosu-draw-ai/
│       ├── SKILL.md                  # Core: Agent behavior entry point
│       ├── references/               # On-demand generation rules
│       │   ├── rules.md              # P0-P3 pixel-level quality rules
│       │   ├── diagram-types.md      # Diagram type presets (shapes/colors/layout/edges)
│       │   ├── xml-authoring.md      # .drawio XML authoring guide
│       │   ├── visual-audit.md       # P3 visual audit decision table
│       │   ├── style-presets.md      # Style lookup protocol
│       │   ├── mermaid-authoring.md  # Mermaid conversion guide (Pipeline B)
│       │   ├── pipeline-a-authoring.md # Data-driven importer guide (Pipeline A)
│       │   ├── icons.md              # Brand colors + icon mapping
│       │   ├── feishu-embed.md       # Feishu/Lark embedding guide
│       │   └── troubleshooting.md    # CLI/encoding/headless troubleshooting
│       ├── templates/                # Prompt templates (zh/ + en/)
│       ├── styles/                   # JSON style presets (schema + 7 built-in)
│       ├── scripts/                  # validate.py, audit.js, export.js, build.js, install.js
│       └── data/                     # Structured data index (reserved)
│
├── tests/                            # Test suite (L0-L3)
│   ├── golden/                       # Regression test fixtures
│   ├── unit/                         # Unit tests (no external deps)
│   ├── integration/                  # Integration tests (need draw.io CLI)
│   └── e2e/                          # End-to-end tests (manual trigger only)
│
├── .drawio/                          # Dev verification diagrams
├── .github/workflows/                # CI
│
└── output/                           # Build artifacts (generated by build.js, do not hand-edit)
    └── xiaosu-draw-ai/               # Distributable package
```

## Development

```bash
# Structural lint on a .drawio file
python3 skills/xiaosu-draw-ai/scripts/validate.py tests/golden/architecture.drawio --score

# Export preview PNG
node skills/xiaosu-draw-ai/scripts/export.js tests/golden/architecture.drawio

# Build distributable package
node skills/xiaosu-draw-ai/scripts/build.js                    # Full build
node skills/xiaosu-draw-ai/scripts/build.js --dry-run          # Preview without writing
```

## Quality System

The project enforces a **P0-P3 rule system**:

| Level | Mechanism | Blocking? |
|-------|-----------|-----------|
| P0 | `validate.py` automated | Yes (exit 2) — structural corruption |
| P1 | `validate.py` automated | Yes (exit 1) — layout defects |
| P2 | `validate.py` automated | No (exit 0) — suboptimal quality |
| P3 | `audit.js` heuristic + AI visual audit (`visual-audit.md` decision table) | No — visual quality, requires judgment |

See `skills/xiaosu-draw-ai/references/rules.md` for the complete rule catalog.

## Pipelines (Roadmap)

| Pipeline | Status | Description |
|----------|--------|-------------|
| **C** — AI hand-writes XML | **Phase 2 (active)** | AI generates `.drawio` XML from natural language |
| **B** — Mermaid conversion | Phase 3 (implemented) | AI writes `.mmd` → CLI converts to `.drawio` |
| **A** — Data-driven | Phase 4 (implemented) | Importers extract structure from code/IaC/SQL |

## License

MIT
