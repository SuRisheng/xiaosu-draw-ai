---
name: xiaosu-draw-ai
version: 1.0.0
description: >-
  Universal AI diagramming skill powered by draw.io CLI. Generate production-quality
  architecture, sequence, ER, flowchart, deployment, class, C4, state machine, network,
  and data flow diagrams from natural language descriptions.
  Phase 4: All 3 pipelines active (A: data-driven importers, B: Mermaid conversion, C: hand-written XML) with full quality gates, templates, visual audit, and 7 style presets.
license: MIT
homepage: https://github.com/rshsu/xiaosu-draw-ai
compatibility: >-
  Requires draw.io desktop app CLI (>= 24.0.0) on PATH.
  validate.py needs Python 3. export.js needs Node.js.
platforms: [windows, macos, linux]
metadata: {"hermes":{"tags":["drawio","diagram","architecture","flowchart","visualization","uml","sequence","er"],"category":"design","requires_tools":["drawio","draw.io"],"related_skills":["mermaid","plantuml"]}}
---

# xiaosu-draw-ai

Generate `.drawio` XML files and export to PNG/SVG/PDF using the native draw.io desktop CLI.
Pipeline C (AI hand-writes XML) is the active path with full quality gates, templates, and visual audit. Pipeline B (Mermaid conversion) and Pipeline A (data-driven importers) are planned for later phases.

## When to Use

Trigger when the user asks to create, draw, or generate:

- **Architecture diagram** — system, microservices, cloud architecture
- **Sequence diagram** — interaction flows, message sequences
- **ER diagram** — entities, relationships, database design
- **Flowchart** — business processes, decision flows
- **Deployment diagram** — infrastructure, nodes, network zones
- **UML Class diagram** — classes, inheritance, composition
- **C4 model** — context, container, component, code levels
- **State machine diagram** — states, transitions, events
- **Network topology** — network devices, connections, zones
- **Data flow diagram** — data sources, transformations, sinks

## Prerequisites

Before generating any diagram, verify the environment.

**Detection commands** (run in sequence until one succeeds):

```bash
# Check draw.io CLI — try PATH first, then known install locations
drawio --version 2>/dev/null || draw.io --version 2>/dev/null \
  || { [ -f "C:/Program Files/draw.io/draw.io.exe" ] && echo "draw.io CLI found at C:/Program Files/draw.io/"; } \
  || { [ -f "/Applications/draw.io.app/Contents/MacOS/draw.io" ] && echo "draw.io CLI found at /Applications/draw.io.app/"; } \
  || echo "draw.io CLI: NOT FOUND"

# Check Node.js (for export.js, mermaid-convert.js)
node --version

# Check Python 3 (for validate.py)
python3 --version || python --version
```

> **Windows Git Bash note:** `drawio` may not be on PATH even when installed. The scripts (`export.js`, `mermaid-convert.js`) auto-detect known install locations across all platforms. If the bash check fails but the scripts work, the CLI is correctly installed.

### R042 — CLI Not Found: Install First, Fall Back Only If Declined

**If draw.io CLI is not detected, the FIRST action is to offer installation — do NOT silently fall back to XML-only mode.** This is a P0 workflow rule.

The agent MUST:

1. **Detect** — Check all of the following (stop at first success):
   - `drawio --version` (PATH)
   - `draw.io --version` (PATH, alternate name)
   - Windows: `Test-Path "C:\Program Files\draw.io\draw.io.exe"` (PowerShell) or `ls "C:/Program Files/draw.io/draw.io.exe"` (bash)
   - macOS: `ls /Applications/draw.io.app/Contents/MacOS/draw.io`
   Only report "not found" if ALL checks fail.
2. **Offer** installation with platform-specific guidance:
   - **Windows**: `winget install JGraph.Draw` or download from https://www.drawio.com/
   - **macOS**: `brew install --cask drawio`
   - **Linux**: `snap install drawio` or download AppImage from https://www.drawio.com/
3. **Wait** for the user's choice:
   - **Accept** → Guide step-by-step. After install, verify with `drawio --version`. Then resume normal workflow with export support.
   - **Decline** → Only then fall back to "XML-only mode": generate `.drawio` XML, skip export steps, and tell the user they can open the file in draw.io desktop or https://app.diagrams.net/.
   - **Already installed elsewhere** → The user provides the path; use it directly.

**This rule applies to every entry point** (Pipeline A/B/C) and every interaction (new diagram, modify existing, export). Without CLI, preview export and visual self-check (Steps 4-5) are impossible — the quality gate is degraded. The agent must inform the user of this trade-off when they decline installation.

> **Why this matters:** The draw.io CLI enables PNG/SVG/PDF export with embedded XML (`--final` mode), Mermaid conversion (Pipeline B, requires ≥ v30), and visual self-check (Steps 4-5). Without it, the skill can only produce raw XML — no preview, no visual quality audit, no final export.

### R043 — Node.js Missing: Offer Install, Continue with Degraded Export

**If `node --version` fails, the FIRST action is to offer installation.** This is a P0 workflow rule.

The agent MUST:

1. **Detect** that `node --version` fails.
2. **Offer** installation:
   - **All platforms**: Download from https://nodejs.org/ (LTS recommended, ≥ 14.0).
   - **Windows**: `winget install OpenJS.NodeJS.LTS`
   - **macOS/Linux**: `brew install node` or use `nvm` (https://github.com/nvm-sh/nvm).
3. **Wait** for user choice:
   - **Accept** → Guide install, verify with `node --version`, resume.
   - **Decline** → Continue without Node.js. **Lost functionality**: `export.js` (no PNG/SVG/PDF export), `mermaid-convert.js`, `build.js`. **Still works**: `validate.py` (Python-based), XML generation (Pipeline C). The agent MUST tell the user they won't get preview images or final exports — only raw `.drawio` XML.
   - **Already installed elsewhere** → Use the provided path.

> **Why this matters:** Without Node.js, the skill cannot export diagrams to PNG/SVG/PDF. Users can still get valid `.drawio` XML and open it manually, but there's no automated preview.

### R044 — Python 3 Missing: Offer Install, Continue Without Validation

**If `python3 --version` (or `python --version`) fails, the FIRST action is to offer installation.** This is a P0 workflow rule.

The agent MUST:

1. **Detect** that both `python3 --version` and `python --version` fail.
2. **Offer** installation:
   - **All platforms**: Download from https://python.org/ (≥ 3.8).
   - **Windows**: `winget install Python.Python.3.13` (or latest 3.x)
   - **macOS**: `brew install python3`
   - **Linux**: `sudo apt install python3` (Debian/Ubuntu) or `sudo dnf install python3` (Fedora)
   - **Important**: On Windows, ensure "Add Python to PATH" is checked during install.
3. **Wait** for user choice:
   - **Accept** → Guide install, verify with `python3 --version`, resume.
   - **Decline** → Continue without Python. **Lost functionality**: `validate.py` (structural lint, P0-P2 checks). **Still works**: XML generation (Pipeline C), export (if Node.js + draw.io CLI present). The agent MUST warn that quality gates (Steps 3) will be skipped — no structural validation before delivery.
   - **Already installed elsewhere** → Use the provided path.

> **Why this matters:** Without Python 3, the skill cannot run `validate.py` for structural lint (R001-R022). The diagram may have dangling edges, overlaps, or off-grid geometry that would normally be caught. The agent should apply manual checks from `references/rules.md` as a best-effort substitute.

## Bundled Resources

Read these reference files only when needed. Do NOT pre-load them.

| File | Read When |
|------|-----------|
| `references/diagram-types.md` | Identifying diagram type — shape, color, layout, and edge presets (during Step 1 Plan) |
| `templates/zh/<type>.md` | User describes a diagram in Chinese — guided discovery questions and constraints |
| `templates/en/<type>.md` | User describes a diagram in English — guided discovery questions and constraints |
| `references/xml-authoring.md` | Hand-writing `.drawio` XML (every Pipeline C generation) |
| `references/mermaid-authoring.md` | Writing Mermaid `.mmd` for Pipeline B conversion |
| `references/pipeline-a-authoring.md` | Implementing or using data-driven importers (Pipeline A) |
| `references/style-presets.md` | Understanding style lookup protocol (role→palette, edge kind→edge style) |
| `styles/schema.json` | Understanding the JSON schema for style presets |
| `styles/built-in/<style>.json` | Applying a specific style during Step 2 — read the matching preset JSON |
| `references/icons.md` | Annotating diagrams with technology-specific brand colors and icons |
| `references/rules.md` | Checking specific P0-P3 rule definitions, spacing constants, or scoring weights |
| `references/visual-audit.md` | Performing Step 5 visual self-check — P3 decision table (see→fix→XML example) |
| `references/troubleshooting.md` | CLI not found, export failures, encoding issues, version problems |
| `references/dense-diagram-simplification.md` | Diagram has 15+ nodes or user says "too cluttered" — apply simplification strategies |
| `references/benchmark.md` | User says "benchmark", "measure", "统计性能", or "耗时统计" — collect timing and token metrics |
| `references/feishu-embed.md` | **Delivering any diagram — MANDATORY before every delivery.** Determine target platform (Wiki/Docx/GitHub/Slack etc.) and correct output format (Mermaid code block vs PNG vs both). Prevents exporting Mermaid as PNG when native code would be better. |
| `references/article-diagram-embedding.md` | User provides a template article link + requirements to generate a new document — OR — user says "update diagrams in this article" after editing text — OR — article contains `@xiaosu-draw-ai` annotations. Read template structure, extract diagram type/position hints, batch generate all diagrams. |
| `scripts/xml-parser.js` | User provides an existing .drawio file to modify — parse XML to see current nodes/edges/containers |
| `scripts/png-extract.js` | User provides a .drawio.png (--final export) — extract the embedded source XML |
| `scripts/mermaid-convert.js` | User has .mmd source → Pipeline B regeneration; re-editing Mermaid-based diagrams |

## Template-Guided Conversations

When the user describes a diagram request, first match it to a template:

| User Intent (zh) | User Intent (en) | Template | Default Pipeline |
|-------------|---------------|----------------|--------------|
| "架构图"、"系统设计" | "architecture", "system design" | `architecture.md` | C (hand-write XML) |
| "时序图"、"交互流程" | "sequence", "interaction flow" | `sequence.md` | B (Mermaid) if CLI ≥ v30, else C |
| "ER图"、"数据库设计" | "ER", "database design" | `er.md` | B (Mermaid) if CLI ≥ v30, else C |
| "流程图"、"业务流程" | "flowchart", "workflow" | `flowchart.md` | C (hand-write XML) |
| "部署图"、"基础设施" | "deployment", "infrastructure" | `deployment.md` | C (hand-write XML) |
| "类图"、"UML" | "class diagram", "UML" | `class.md` | B (Mermaid) if CLI ≥ v30, else C |
| "C4"、"容器图" | "C4", "container diagram" | `c4.md` | C (hand-write XML) |
| "状态机"、"状态图" | "state machine", "state diagram" | `state-machine.md` | B (Mermaid) if CLI ≥ v30, else C |
| "网络拓扑" | "network", "topology" | `network.md` | C (hand-write XML) |
| "数据流"、"DFD" | "data flow", "DFD" | `data-flow.md` | C (hand-write XML) |

> **Pipeline routing is determined by the decision tree below, not by user CLI flags.**
> Structure-first types (sequence, ER, class, state machine) default to Pipeline B only when CLI ≥ v30.
> If the user requests visual customization ("精美", "beautiful", "好看"), use Pipeline C for full style control.
> If draw.io CLI < v30, always use Pipeline C.

## Pipeline Selection

Route based on **data source** (what the user provides) and **diagram type** (what kind of diagram).
Data source determines how structure is extracted; visual quality requirements determine how it's rendered. These two concerns are orthogonal.

### Modify Existing Diagram

When the user provides an existing diagram file and asks to change it:

| User Provides | Action |
|--------------|--------|
| `.mmd` / `.mermaid` file + modification request | **Pipeline B source found!** Edit the `.mmd` source directly → re-run `node scripts/mermaid-convert.js <file>.mmd --output <file>.drawio` → validate → export. The `.mmd` file is the **editable source** — always prefer editing it over the generated `.drawio`. |
| `.drawio` file + modification request | **First, check if a corresponding `.mmd` source file exists** (same base name, same directory). If YES → edit `.mmd` per above. If NO → determine the format: open the file and look for `<UserObject>` elements. **If UserObject found**: this is a Mermaid-generated file without its source. Tell the user: "This was generated from Mermaid. I can edit the XML directly, but it's fragile — better to recreate a `.mmd` source file first. Should I extract the Mermaid structure and create one?" **If no UserObject**: hand-written Pipeline C XML. Run `node scripts/xml-parser.js <file> --json` to get current structure → show summary → apply targeted XML edits. |
| `.drawio.png` (--final export) + modification request | Run `node scripts/png-extract.js <file> --output temp.drawio` to extract the embedded source XML. Then follow the `.drawio` file flow above (check for `.mmd` source, check for UserObject format). Clean up temp file after. |
| Plain PNG (no embedded XML) + modification request | Tell the user: "This PNG doesn't contain editable source data. Do you have the original .drawio or .mmd file? If not, I can analyze the image visually and redraw it with your changes — but I'll be recreating it from scratch, not modifying the original." Then proceed per user's choice. |
| User says "modify the XXX diagram" (no file provided, by name or description) | **If the diagram is embedded in a document** (user says "the architecture diagram in README" or "the sequence diagram in the wiki"): read that document, find the Mermaid code block, edit it in place. The document IS the source. **If standalone**: look for `.mmd` files in `.drawio/` with matching names. If the user's description is ambiguous, ask: "Which diagram do you mean? I see: [list .mmd files with their `%% title:` headers]." |
| User provides a Markdown document (.md) or Wiki page containing Mermaid code blocks | Read the document. Extract all ` ```mermaid ` code blocks. Show the user which diagrams are embedded. For new diagrams: append new Mermaid blocks to the document. For modifications: edit the existing Mermaid block in-place. **This is the preferred workflow for Pipeline B** — the document is the single source of truth, no separate `.mmd` file needed. |

After parsing the existing structure and identifying the source format, the rest of the workflow:
- **Mermaid source (.mmd)**: edit `.mmd` → convert → validate → export → deliver
- **Hand-written XML (.drawio, no UserObject)**: show IR-like summary → confirm → modify XML → validate → export → visual self-check → deliver
- **UserObject XML (Mermaid-generated, no .mmd)**: warn about fragility → offer to create .mmd source → modify → validate → export

```
User requests a diagram or modification
  │
  ├─ Is the user modifying an existing diagram?
  │     (.mmd file, .drawio file, .drawio.png, or plain PNG + change description)
  │
  │    ├─ YES → Is a .mmd source file available (same name)?
  │    │      ├─ YES → Pipeline B re-edit: edit .mmd → re-convert → validate → deliver
  │    │      └─ NO  → Extract XML → check for UserObject format
  │    │             ├─ UserObject found → Mermaid-generated, no source. Warn + offer to create .mmd.
  │    │             └─ Standard mxCell → Pipeline C re-edit: parse → modify XML → validate → deliver
  │    │
  │    └─ NO → Continue with fresh generation
  │
  ├─ Did the user provide a parseable source file?
  │     (SQL DDL, OpenAPI spec, Terraform, K8s YAML, Docker Compose, code class definitions)
  │
  │    ├─ YES → Is there a matching importer?
  │    │      ├─ YES → Pipeline A (importer extracts IR)
  │    │      └─ NO  → Read file content → template-guided discovery → Pipeline B/C
  │    │
  │    └─ NO → Continue
  │
  ├─ Did the user provide a document (PRD, README, meeting notes)?
  │
  │    ├─ YES → Extract structure from document → show IR summary → Pipeline B/C
  │    └─ NO  → Continue
  │
  ├─ Is the diagram type structure-first?
  │     (sequence / ER / class / state machine / gantt)
  │
  │    ├─ YES → Is CLI ≥ v30 AND user has NO strong visual requirements?
  │    │      ├─ YES → Pipeline B (Mermaid conversion)
  │    │      └─ NO  → Pipeline C (hand-write XML)
  │    │
  │    └─ NO → Layout-first type (architecture / deployment / flowchart / network / C4 / data-flow)
  │           → Pipeline C (hand-write XML)
```

> **Visual quality requests** ("精美", "beautiful", "professional", "keynote-ready") affect how rendering is done, not how structure is extracted. A "beautiful architecture diagram" is still Pipeline C — just with a more suitable style preset. A "beautiful sequence diagram" downgrades from Pipeline B to C.
>
> **Multi-condition overlap**: When the user provides both code AND a diagram type AND visual requirements, data source takes priority: extract structure via Pipeline A, then decide rendering (B or C) separately.

## Template-Driven Document Generation

When the user says "用这个模板（link）+ 这些需求，生成一份 XX 设计文档" — OR — the user provides an article containing `@xiaosu-draw-ai` annotations and asks to generate/update diagrams. Read `references/article-diagram-embedding.md` for the full specification.

### Two modes of @xiaosu-draw-ai annotation

| Mode | Format | Use case |
|------|--------|---------|
| **Mode 1: Template annotation** | `<!-- @xiaosu-draw-ai type=系统架构图 desc=分层展示前端→网关→服务→数据 -->` | Template article: mark WHERE a diagram goes and WHAT TYPE it should be. Invisible in rendered view. |
| **Mode 2: Inline diagram request** | `@xiaosu-draw-ai 绘制<名>` + `【图类型】【内容】【风格】` blocks | Article with explicit diagram specs. Agent generates directly from these blocks. |

### Workflow: Template + Requirements → New Document

```
User gives: template link + requirements ("画一个电商系统的设计文档")
  │
  ├─ Step 1: Read template
  │     Fetch outline + full body
  │     Extract all @xiaosu-draw-ai annotations (both modes)
  │     Build template map: sections, diagram positions, types
  │
  ├─ Step 2: Show blueprint to user
  │     "模板有 7 个章节，3 个图表位置：
  │      §2 → 系统架构图, §3.1 → 时序图, §3.2 → ER图"
  │     Wait for user confirmation
  │
  ├─ Step 3: Generate content + diagrams section by section
  │     Write text based on user requirements (follow template structure)
  │     At each annotation position:
  │       - Mode 1: derive diagram content from user requirements + surrounding text
  │       - Mode 2: use explicit 【内容】 as spec
  │       - Generate diagram (Pipeline B for sequence/ER/class/state,
  │         Pipeline C for architecture/deployment/flowchart/C4/network/data-flow)
  │       - Run validate.py → export → insert at position
  │
  └─ Step 4: Deliver complete new document
        Template structure + user-driven content + generated diagrams
```

### Critical rule: Template images are type hints ONLY

Template example images tell the Agent "a system architecture diagram goes here" — they do NOT provide the diagram content. The Agent MUST derive what nodes, edges, and layers the new diagram should contain from:
1. The user's requirements (primary source)
2. The `desc=` field in the annotation (intent hint)
3. The surrounding article text (context)

**Copying structure from a template's example image into a new diagram is a process violation.**

### Article text changed → diagrams stale

When the user says "文章内容改了，更新里面的图":

1. Re-read current article text
2. For each `@xiaosu-draw-ai` annotation position:
   - Mode 2: compare `【内容】` with current article text. If diverged, flag mismatch to user.
   - Mode 1: re-derive diagram content from current text
3. Regenerate diagrams that have drifted
4. Report changes: "已更新 §2 架构图（新增 Payment Service 节点）"

### Batch processing

When multiple annotations exist in one article:
1. Scan ALL first → show summary table → wait for confirmation
2. Generate sequentially (one at a time, avoid file conflicts)
3. Track progress ("2/3 done")
4. Per-diagram error handling: 3 fix attempts, then mark as `⚠️ 失败` and continue
5. Report all results at the end

## Style Selection

| Style | File | Best For | User Triggers |
|-------|------|----------|---------------|
| 1: Flat Icon | `styles/built-in/flat-icon.json` | Architecture, ER, flowcharts (default) | (no style specified) |
| 2: Dark Terminal | `styles/built-in/dark-terminal.json` | Data flow, network, AI/agent architectures | "dark", "terminal", "dark mode" |
| 3: Blueprint | `styles/built-in/blueprint.json` | Architecture, class/ER, sequence, state machines | "blueprint", "engineering", "technical drawing" |
| 4: Notion Clean | `styles/built-in/notion-clean.json` | All types — universally good | "clean", "minimal", "notion", "simple" |
| 5: Glassmorphism | `styles/built-in/glassmorphism.json` | AI/agent, product demos, keynotes | "glass", "frosted", "modern", "futuristic" |
| 6: Claude Official | `styles/built-in/claude-official.json` | Architecture, system docs, onboarding | "claude style", "warm", "professional", "friendly" |
| 7: OpenAI | `styles/built-in/openai.json` | Technical docs, API diagrams, content-first | "openai style", "minimal", "spartan", "ultra-clean" |

> **Apply style by**: reading the matching `styles/built-in/*.json` file during Step 2 (Generate XML) and
> using its exact color tokens (fillColor/strokeColor), typography (fontFamily/fontSize), and shape defaults.

## User Interaction Policy

How to interact with the user at each stage of the diagramming process:

| Scenario | Agent Behavior |
|----------|---------------|
| User description is clear and complete | Do NOT ask more questions. Extract IR summary and generate directly. |
| Missing diagram type | Ask a single multiple-choice question: architecture / flow / data / sequence. |
| Missing key components | Ask 1–3 targeted questions. Do NOT present a long questionnaire. |
| User provides a document (PRD, README, meeting notes) | Read the document first. Extract structure, show IR summary, ask user to confirm. |
| User provides code/SQL/OpenAPI | Check if matching importer exists. If not, explain the fallback path. |
| User asks for "better looking" or "prettier" | Switch or suggest a different style preset. Do NOT re-ask structure questions. |
| User provides a `.mmd` file | **Pipeline B source found.** Read it, show structure summary, ask what to change. Edit `.mmd` text → re-convert → validate → deliver. |
| User revises 5+ times | For Pipeline C: suggest opening the `.drawio` file in draw.io desktop. For Pipeline B: the `.mmd` source can be iterated indefinitely since edits are text-based. |

### IR Summary Format

Before generating, show the user a human-readable summary (not raw JSON):

```markdown
I understand you want a **[diagram type]**:

- **Layers/Components**: [list]
- **Connections**: [key flows]
- **Style**: [preset name]

If this looks right, I'll generate the diagram. If not, what should I change?
```

Wait for user confirmation before generating XML.

## Workflow: Pipeline C — AI Hand-Writes XML

Follow this 6-step process. Do NOT skip steps 4-5 (quality gates).

### Step 1: Plan

Before writing XML, plan the diagram structure:

1. **Identify diagram type** — match user request to a diagram type above. If ambiguous, ask: "What kind of diagram: A. System architecture B. Sequence/flow C. Data/ER?" Use the matching template from `templates/zh/` or `templates/en/` for guided discovery questions.

2. **Read diagram presets** — open `references/diagram-types.md` and read the section for the matched diagram type. This gives you shape recommendations, color assignments, layout direction, edge styles, and spacing rules specific to that type.

3. **List components** — what shapes are needed? What are their semantic roles? Use `references/diagram-types.md` for color assignments by role.

4. **Determine layout** — top-to-bottom or left-to-right? How many tiers/layers? Use the layout direction and spacing rules from `references/diagram-types.md`.

5. **Plan edges** — which components connect? What arrow types? Use the edge style presets from `references/diagram-types.md`.

State your plan to the user before generating. Example:
> "I'll create a **system architecture** diagram with:
> - **Layer 1 (Frontend)**: Web App, iOS App
> - **Layer 2 (Gateway)**: API Gateway (Kong)
> - **Layer 3 (Services)**: User Service, Order Service, Product Service
> - **Layer 4 (Data)**: MySQL, Redis
> - **Layout**: Top-to-bottom, 4 tiers, 120px layer spacing
> - **Edges**: Frontend → Gateway → Services → Data"

### Step 2: Generate XML

Read `references/xml-authoring.md`. For the matched diagram type, also reference `references/diagram-types.md` for type-specific presets. For the default color palette, read `styles/built-in/flat-icon.json` (or `styles/schema.json` for the schema).

Generate a valid `.drawio` XML file and write it to `.drawio/<diagram-name>.drawio`.

**CRITICAL rules:**
- **R006 — No invented edges:** Only add edges for relationships the user explicitly described. "X contains A, B, C" does NOT imply edges between A, B, C. Container-level edges (User → App) are acceptable when the user describes parts composing a system. A diagram without edges is correct; a diagram with invented edges is wrong. When in doubt, omit the edge.
- File skeleton: `id="0"` and `id="1"` are root cells. User cells start from `id="2"`, incrementing.
- Every vertex must have `<mxGeometry x="..." y="..." width="..." height="..." as="geometry" />`.
- Every edge must have expanded `<mxGeometry relative="1" as="geometry"></mxGeometry>` — never self-closing.
- All coordinates must be multiples of **10px** (rule R020).
- Use the color tokens from `styles/built-in/flat-icon.json` for fillColor/strokeColor (or user-specified style from `styles/built-in/`).
- Follow spacing constants from `references/rules.md`:
  - Component-to-component ≥ 80px
  - Layer-to-layer ≥ 120px
  - Same-row ≥ 100-120px
  - Page margin ≥ 40px

### Step 3: Validate

Run structural lint:

```bash
python3 scripts/validate.py .drawio/<diagram-name>.drawio
```

**Response to results:**
- **P0 errors** (exit code 2): MUST fix. Re-examine the XML, correct the structural issue, re-run.
- **P1 violations** (exit code 1): Fix and re-run.
- **P2 warnings** (exit code 0): Consider fixing. Not blocking.

**Maximum 3 repair attempts.** If validation still fails after 3 fixes, report the remaining issues to the user and ask whether to proceed.

### Step 4: Export Draft

Export a preview PNG for visual review:

```bash
node scripts/export.js .drawio/<diagram-name>.drawio
```

This produces a width-capped PNG (2000px) without embedded XML. The file will be at `.drawio/<diagram-name>.png`.

### Step 5: Visual Self-Check

Read `references/visual-audit.md` for the full P3 audit guide with per-rule detection instructions and XML fix examples.

Examine the exported PNG for P3 issues (visual only, from `references/visual-audit.md`):

- **R030** — Label truncation: text overflowing shape boundaries
- **R031** — Edge-shape visual overlap: edges crossing unrelated shapes
- **R032** — Edge-label overlap: edge labels colliding with elements
- **R033** — Stacked edges: multiple edges on the same visual path
- **R034** — Wrong arrow direction
- **R035** — Corner connections (within 20px of corners)
- **R036** — Missing arrow label background
- **R037** — Insufficient component spacing (< 80px visually)
- **R038** — Z-order violations
- **R039** — Legend overlap

For each issue found, consult the "How to fix" section in `references/visual-audit.md`, apply the suggested XML change, re-validate, re-export, and re-check.

If vision is available: read the PNG, check all 10 rules against the visual-audit guide. **Maximum 2 self-check rounds.**
If vision is NOT available: skip, note "visual check skipped" to the user.

### Step 6: Review & Final Export

Show the draft PNG to the user. Collect feedback. Apply targeted XML edits (re-validate after each edit).

When the user approves:

```bash
# Final export with embedded editable XML
node scripts/export.js .drawio/<diagram-name>.drawio --final

# For SVG (if requested)
node scripts/export.js .drawio/<diagram-name>.drawio --final --format svg
```

Final PNG output: `.drawio/<diagram-name>.drawio.png` (double extension, embeds editable .drawio XML).
Final SVG output: `.drawio/<diagram-name>.svg`.

---

## Workflow: Pipeline B — Mermaid Conversion (Phase 4, active)

For structure-first diagrams (sequence, ER, class, state machine) when draw.io CLI ≥ v30.

### Step B1: Check CLI Version

```bash
node scripts/mermaid-convert.js --check
```
If Pipeline B is available, proceed. If not (CLI missing or < v30), fall back to Pipeline C.

### Step B2: Write Mermaid (.mmd)

Read `references/mermaid-authoring.md`. Write Mermaid syntax to a `.mmd` file.
Use the diagram type's section from `references/diagram-types.md` for color styling
(via Mermaid `style` and `classDef` statements).

**Store `.mmd` alongside `.drawio` output — the `.mmd` file is the editable source.**
Never delete it. Both files should be version-controlled:
```
.drawio/<diagram-name>.mmd      ← Editable source (text diff, easy review)
.drawio/<diagram-name>.drawio   ← Generated output (for draw.io + export)
.drawio/<diagram-name>.png      ← Rendered preview
```

### Step B3: Convert to .drawio

```bash
node scripts/mermaid-convert.js .drawio/<diagram-name>.mmd --output .drawio/<diagram-name>.drawio
```
**Never** apply `--layout` to a Mermaid-converted file (it's already laid out).

### Step B4: Validate + Export + Self-Check

Same as Pipeline C Steps 3–5:
```bash
python3 scripts/validate.py .drawio/<diagram-name>.drawio
node scripts/export.js .drawio/<diagram-name>.drawio
```
Visual self-check per `references/visual-audit.md` (max 2 rounds).

### Step B5: Platform-Aware Delivery

**See global "Output Format Decision" section below.** This gate applies to ALL pipelines, not just Pipeline B. Read `references/feishu-embed.md` before every delivery.

For Pipeline B specifically: the `.mmd` file is the **single source of truth**. Default to delivering the Mermaid code block (not PNG) for any platform that supports Mermaid rendering (Feishu Wiki, GitHub, Notion, Obsidian). Export PNG only as backup or when the platform requires it.

### Step B6: Review + Final Export

Same as Pipeline C Step 6. Apply Output Format Decision (see global section) before delivering.

---

## Workflow A: Data-Driven (Phase 4, planned)

For users who provide parseable source files (SQL DDL, OpenAPI, Terraform, K8s YAML, code classes).
Read `references/pipeline-a-authoring.md` for importer API and IR schema.

---

## Quality Gates

Quality gates are **mandatory, not optional**. Every diagram must pass validation before delivery.

| Level | Checked By | Exit Code | Action |
|-------|-----------|-----------|--------|
| **P0** — Structural corruption | `validate.py` | 2 | **Block.** Fix before proceeding. |
| **P1** — Layout defects | `validate.py` | 1 | **Block.** Fix and re-validate. |
| **P2** — Quality warnings | `validate.py` | 0 | Advisory. Fix if practical. |
| **P3** — Visual issues | `audit.js` heuristic + AI visual audit (`visual-audit.md`) | 0 | Fix if vision is available. Max 2 self-check rounds. |

**Repair limit**: Maximum 3 validate.py repair attempts. If still failing, report remaining issues to user and ask whether to proceed.

**All three pipelines enter the same gate.** Regardless of whether the diagram was generated via Pipeline A (importers), B (Mermaid conversion), or C (hand-written XML), the output `.drawio` file must pass validate.py, export a preview, and undergo visual self-check before delivery.

For detailed P3 rules (R030–R039), see `references/visual-audit.md` — a decision table with "what to look for → how to fix → XML example" for each rule.

---

## Output Format Decision（交付前必查，全管道通用）

**Before delivering any diagram — regardless of Pipeline A/B/C — determine the target platform and choose the correct output format. This is a mandatory gate, not a suggestion.**

Read `references/feishu-embed.md` for the full platform matrix. Quick reference:

| Target Platform | Preferred Format | Why |
|----------------|---------|-----|
| **Feishu Wiki** | ````mermaid` code block | Wiki Markdown natively renders Mermaid — no PNG needed |
| **Feishu Docx** | PNG (`--final`) | Docx does not support Mermaid code blocks |
| **GitHub/GitLab Markdown** | ````mermaid` code block | Native Mermaid rendering in most Markdown renderers |
| **Notion / Obsidian** | ````mermaid` code block | Both support Mermaid syntax natively |
| **Confluence** | ````mermaid` code block + PNG fallback | Plugin-dependent |
| **Slack / IM / 邮件** | PNG preview | Messages do not render Mermaid |
| **Word / PPT / PDF** | PNG (`--final`) | Universal image format required |

**Decision flow:**

```
Diagram generated (any pipeline)
  │
  ├─ Is the diagram from Mermaid source (Pipeline B or hand-written .mmd)?
  │   ├─ YES → Does the target platform support Mermaid rendering?
  │   │   ├─ YES → Deliver ```mermaid code block as PRIMARY artifact
  │   │   │         + .drawio PNG as backup
  │   │   └─ NO  → Deliver PNG as primary artifact
  │   │             Keep .mmd source for future edits — ALWAYS
  │   └─ NO  (Pipeline A/C — no Mermaid source)
  │         → Deliver PNG + .drawio source
  │
  └─ Common mistake: Exporting Mermaid as PNG for Feishu Wiki
      → Wiki supports Mermaid natively; PNG loses editability.
      → Check target BEFORE choosing export method.
```

> **Hard rule**: If you have `.mmd` source AND the target supports Mermaid, you MUST deliver the Mermaid code block. Exporting to PNG in this scenario is a process violation.

---

## Review Loop

After delivering the draft diagram in the correct format:

1. **Show** the deliverable to the user (Mermaid code block or PNG depending on platform).
2. **Collect** feedback — the user may request label changes, layout adjustments, or component additions.
3. **Apply** edits (edit `.mmd` source for Mermaid, edit XML for Pipeline C, re-extract for Pipeline A).
4. **Re-validate** after each edit with `python3 scripts/validate.py`.
5. **Re-deliver** in the same format as determined by the Output Format Decision.
6. **Repeat** until the user approves or 5 revision rounds are reached.

If the user reaches 5+ revisions without converging, suggest opening the `.drawio` file directly in the draw.io desktop app for fine-tuning.

When the user approves, proceed to final export.

---

## Export Policy

**Preview vs Final exports are separate stages:**

| Stage | Command | Embeds XML? | Purpose |
|-------|---------|------------|---------|
| Draft Preview | `node scripts/export.js <file>.drawio` | No | Clean PNG for visual review; avoids confusing vision models |
| Final PNG | `node scripts/export.js <file>.drawio --final` | Yes (`-e`) | Re-openable in draw.io desktop |
| Final SVG/PDF | `node scripts/export.js <file>.drawio --final --format svg` | Optional | Per user requirements |

**CLI detection order**: `drawio` → `draw.io` → Windows default path → macOS Applications path. Use whichever is found. Do NOT assume the binary name.

---

## Error Recovery

| Situation | Action |
|-----------|--------|
| draw.io CLI not found | **R042**: Offer installation first. Only fall back to XML-only delivery if user declines. See Prerequisites section. |
| draw.io CLI < v30 | Disable Pipeline B; use Pipeline C for all diagrams |
| Node.js not found | **R043**: Offer installation first. If declined, skip all Node.js scripts (export, mermaid-convert, build). XML-only delivery. |
| Python 3 not found | **R044**: Offer installation first. If declined, skip validate.py (no structural lint). Warn user: no quality gate before delivery. |
| validate.py P0 error | Fix XML structure, re-validate (max 3 rounds) |
| validate.py P1 violation | Fix layout issue, re-validate (max 3 rounds) |
| Export produces blank PNG | Check XML validity, try `--width` flag |
| Export produces 0-byte file | Check disk space, retry with explicit `--output` path |
| Export fails | Check CLI path, output directory, headless environment. If still failing, deliver raw `.drawio` XML |
| Vision not available | Skip visual self-check; explicitly note "visual check skipped" to user |
| User revises 5+ rounds | Suggest opening `.drawio` file in draw.io desktop for fine-tuning |

---

## Installation Notes

The skill is installed by copying/linking the entire `skills/xiaosu-draw-ai/` directory into the agent's skills directory. **Do NOT copy only `SKILL.md`** — `references/`, `scripts/`, `styles/`, and `templates/` must be colocated.

**Development install (symlink, changes take effect immediately):**
```bash
# macOS / Linux
ln -s "$(pwd)/skills/xiaosu-draw-ai" ~/.claude/skills/xiaosu-draw-ai
```

```cmd
REM Windows (cmd, requires admin or Developer Mode)
mklink /D "%USERPROFILE%\.claude\skills\xiaosu-draw-ai" "<repo>\skills\xiaosu-draw-ai"
```

**Release install (from built package):**
```bash
cp -r ./.claude/skills/xiaosu-draw-ai ~/.claude/skills/xiaosu-draw-ai
```

