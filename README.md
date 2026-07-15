[English](README.md) | [中文](README_CN.md)

---

# xiaosu-draw-ai

> Universal AI diagramming skill — pure SKILL.md + draw.io CLI driven, not coupled to any specific Agent platform.

**Generate production-quality architecture, sequence, ER, flowchart, deployment, class, C4, state machine, network, and data flow diagrams** from natural language descriptions.

**Version:** 1.0.0 &nbsp;|&nbsp; **License:** MIT

[:book: Full User Guide](https://ocnlhn7o8ml8.feishu.cn/wiki/ZBcow9h8YiSvmOkQdjbcKlDgn9f) &nbsp;|&nbsp; [:blue_book: Design Doc](https://ocnlhn7o8ml8.feishu.cn/wiki/AdwMwTV8ci6rJdkisSBccaBbnnf)

---

## About

xiaosu-draw-ai is an AI-powered diagramming skill that turns natural language into editable `.drawio` files. Based on the draw.io desktop CLI, it supports **10 diagram types** across **3 rendering pipelines**: data-driven importers (SQL → ER, OpenAPI → architecture), Mermaid conversion (`.mmd` → `.drawio`), and AI hand-written XML (full layout control). Every diagram passes through **mandatory quality gates**: structural validation (P0-P2), heuristic visual audit (P3), and AI visual self-check.

The skill ships as a single directory — copy or symlink into any agent's skills directory. No API keys, no platform lock-in. Output is standard `.drawio` XML, editable in draw.io desktop, VS Code, or any MXGraph editor.

---

## Features

| Feature | Description |
|---------|-------------|
| **Natural Language → Diagram** | Describe in Chinese or English; AI handles layout, colors, and routing across 10 diagram types with 20 guided prompt templates |
| **3 Auto-Routed Pipelines** | A: data-driven imports (SQL→ER, OpenAPI→arch); B: Mermaid conversion (`.mmd`→`.drawio`, source preserved); C: AI hand-writes XML (full visual control) |
| **7 Visual Styles** | Flat Icon (default), Dark Terminal, Blueprint, Notion Clean, Glassmorphism, Claude Official, OpenAI — with 7 semantic arrow kinds (primary/async/cache/control/feedback/neutral) |
| **P0-P3 Quality Gates** | Auto structural check + heuristic visual audit + AI self-check; preview/final export separation; max 3 auto-repair rounds |
| **Modify Existing Diagrams** | Edit `.mmd` source → re-convert (Pipeline B); parse `.drawio` XML → targeted edit (Pipeline C); auto-search by name; in-document Mermaid block editing |
| **Template-Driven Doc Gen** | Feed a template doc + requirements → AI infers diagram positions from headings/Mermaid blocks → generates text + diagrams into a complete document |
| **Cross-Platform** | Windows / macOS / Linux via draw.io CLI; auto-detection of CLI path (no manual PATH config needed) |

---

## Diagram Types

| Type | Trigger (EN) | Trigger (ZH) | Layout |
|------|-------------|-------------|--------|
| **System Architecture** | "architecture", "microservices" | "架构图", "系统设计" | Top→down layers |
| **Sequence Diagram** | "sequence diagram", "interaction flow" | "时序图", "交互流程" | Left→right, time↓ |
| **ER Diagram** | "ER diagram", "database design" | "ER图", "数据库设计" | Spread, min crossings |
| **Flowchart** | "flowchart", "business process" | "流程图", "业务流程" | Top→down, branches |
| **Deployment** | "deployment", "infrastructure" | "部署图", "基础设施" | Through security zones |
| **UML Class** | "class diagram", "UML" | "类图", "对象模型" | Inheritance↓, assoc→ |
| **C4 Model** | "C4", "container diagram" | "C4", "容器图" | Person→System→External |
| **State Machine** | "state machine", "state transition" | "状态机", "状态迁移" | Left→right states |
| **Network Topology** | "network diagram", "topology" | "网络拓扑", "拓扑图" | Through network zones |
| **Data Flow** | "data flow", "DFD", "pipeline" | "数据流", "DFD", "管道" | Top→down pipeline |

---

## Installation

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [draw.io Desktop](https://www.drawio.com/) | ≥ 24.0 | CLI export engine |
| Python 3 | ≥ 3.8 | Structural validation |
| Node.js | ≥ 14.0 | Export, build, audit, install |

> `export.js` auto-detects draw.io CLI across Windows/macOS/Linux — manual PATH configuration is usually unnecessary.

### Quick Install (Recommended)

```bash
# Symlink for development (changes take effect immediately)
# macOS / Linux
ln -s "$(pwd)/skills/xiaosu-draw-ai" ~/.claude/skills/xiaosu-draw-ai

# Windows (admin or Developer Mode)
mklink /D "%USERPROFILE%\.claude\skills\xiaosu-draw-ai" "<repo>\skills\xiaosu-draw-ai"
```

### Release Install

```bash
node skills/xiaosu-draw-ai/scripts/build.js
cp -r .claude/skills/xiaosu-draw-ai ~/.claude/skills/xiaosu-draw-ai
```

> **Do NOT copy only `SKILL.md`** — `references/`, `scripts/`, `styles/`, and `templates/` must be colocated.

---

## Quick Start: Modifying an Existing Diagram

### Mermaid source (.mmd) — edit source, regenerate

```bash
# 1. Edit the .mmd file (or Mermaid block in your Markdown doc)
# 2. Re-convert
node skills/xiaosu-draw-ai/scripts/mermaid-convert.js diagram.mmd --output diagram.drawio
# 3. Validate + export
python3 skills/xiaosu-draw-ai/scripts/validate.py diagram.drawio
node skills/xiaosu-draw-ai/scripts/export.js diagram.drawio --final
```

**The `.mmd` file is the editable source.** Never edit the generated `.drawio` directly — changes will be lost on re-conversion.

### Hand-written XML (.drawio) — parse, edit, regenerate

```bash
# AI parses structure → shows summary → applies targeted XML edits → validates → exports
node skills/xiaosu-draw-ai/scripts/xml-parser.js diagram.drawio --json
```

### From PNG (--final export) — extract then edit

```bash
node skills/xiaosu-draw-ai/scripts/png-extract.js diagram.drawio.png --output temp.drawio
```

---

## Choosing a Visual Style

Add a keyword to your description:

| Style | Trigger (EN) | Trigger (ZH) |
|-------|-------------|-------------|
| **Flat Icon** *(default)* | *(none)* | *(不指定)* |
| **Dark Terminal** | "dark", "terminal" | "深色", "暗色" |
| **Blueprint** | "blueprint", "engineering" | "蓝图", "工程图" |
| **Notion Clean** | "clean", "minimal" | "简洁", "极简" |
| **Glassmorphism** | "glass", "frosted", "modern" | "玻璃", "毛玻璃" |
| **Claude Official** | "claude style", "warm" | "暖色", "专业" |
| **OpenAI** | "openai style", "spartan" | "极简", "简朴" |

See `references/style-presets.md` for the full lookup protocol and customization guide.

---

## Template-Driven Document Generation

Feed a template (Feishu Wiki / Markdown / Docx) + requirements:

> "Use this template [link] + these requirements to generate an e-commerce system design doc with React + iOS frontend, Kong gateway, user/order/product services, MySQL + Redis."

AI reads template → infers diagram positions from Mermaid blocks, `.drawio.png` embeds, or section headings → shows blueprint → generates chapter by chapter.

Write `@xiaosu-draw-ai` annotation blocks directly in your document:

```markdown
@xiaosu-draw-ai 绘制用户登录时序图
【图类型】时序图
【内容】
1、参与者：浏览器、Web应用、API网关、认证服务、数据库
2、正常流程：输入凭证 → POST /login → 校验 → JWT → 成功
3、异常分支：密码错误 401；账号锁定 423
【风格】Notion Clean
```

Then tell the AI "generate all diagrams in this article."

---

## Quality System

| Level | Check | Blocks? | Detects |
|-------|-------|---------|---------|
| **P0** | `validate.py` | Yes (exit 2) | Dangling edges, duplicate IDs, XML corruption |
| **P1** | `validate.py` | Yes (exit 1) | Overlapping nodes, edge-through-vertex, crossings |
| **P2** | `validate.py` | No (exit 0) | Off-grid coords, off-center connections |
| **P3** | `audit.js` + AI visual | Advisory | Label overflow, edge overlap, z-order |

Max **3 auto-repair rounds**. All three pipelines enter the same quality gate.

---

## Token Consumption

| Metric | Simple diagram (16 nodes, 7 edges) | Complex diagram (59 nodes, 30 edges) |
|--------|-------------------------------------|--------------------------------------|
| Input tokens | ~26,000 | ~26,000 |
| Output tokens | ~8,000 | ~8,000 |
| Time | ~2 min | ~5 min 30s |
| Pipeline | C | C (Python script) |
| Est. cost (Opus 4.8) | ~$0.20 | ~$0.33 |

> Say "benchmark" or "统计性能" for precise per-session metrics via `benchmark.md`.

---

## Development

```bash
# Structural lint
python3 skills/xiaosu-draw-ai/scripts/validate.py <file.drawio> --score

# Export preview / final
node skills/xiaosu-draw-ai/scripts/export.js <file.drawio>
node skills/xiaosu-draw-ai/scripts/export.js <file.drawio> --final

# Build distributable package
node skills/xiaosu-draw-ai/scripts/build.js

# Run tests
python3 -m pytest tests/unit/ -v
node tests/integration/test_golden_regression.js
```

---

## Project Structure

```
xiaosu-draw-ai/
├── README.md / README_CN.md
├── CLAUDE.md                         # Developer routing guide
├── LICENSE
│
├── skills/xiaosu-draw-ai/            # The Skill package
│   ├── SKILL.md                      # Agent workflow entry point
│   ├── references/                   # 15 on-demand rule documents
│   ├── templates/                    # 20 prompt templates (zh/ + en/)
│   ├── styles/                       # Schema + 7 built-in JSON presets
│   ├── scripts/                      # 13 scripts (validate, export, build, etc.)
│   └── data/                         # Reserved structured data
│
├── tests/                            # L0-L2 test suite
├── .drawio/                          # Dev verification diagrams
├── .github/workflows/                # CI (4 jobs)
└── .claude/skills/                   # Build output (do not edit)
```

---

## License

MIT
