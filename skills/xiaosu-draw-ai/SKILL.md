---
name: xiaosu-draw-ai
version: 1.0.0
description: >-
  Universal AI diagramming skill powered by draw.io CLI. Generate production-quality
  architecture, sequence, ER, flowchart, deployment, class, C4, state machine, network,
  and data flow diagrams from natural language descriptions.
  Phase 2: Pipeline C (AI hand-writes XML) with full quality gates, templates, visual audit, and 7 style presets. Pipeline B (Mermaid) planned.
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

Before generating any diagram, verify the environment:

```bash
# Check draw.io CLI is available
drawio --version   # or: draw.io --version

# Check Python 3 (for validate.py)
python3 --version

# Check Node.js (for export.js)
node --version
```

If draw.io CLI is not found, guide the user to install it:
- **Windows**: Download from https://www.drawio.com/ ; add `C:\Program Files\draw.io` to PATH
- **macOS**: `brew install --cask drawio`
- **Linux**: `snap install drawio` or download AppImage

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
| `references/feishu-embed.md` | Embedding final diagrams in Feishu/Lark docs, wikis, or messages |
| `scripts/xml-parser.js` | User provides an existing .drawio file to modify — parse XML to see current nodes/edges/containers |
| `scripts/png-extract.js` | User provides a .drawio.png (--final export) — extract the embedded source XML |

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
| `.drawio` file + modification request | Run `node scripts/xml-parser.js <file> --json` to get current structure. Read the parsed JSON — it contains `{ nodes, edges, containers }` with all ids, labels, styles, and absolute geometry. Show the user a summary of what's in the diagram, confirm the modification intent, then apply targeted XML edits. |
| `.drawio.png` (--final export) + modification request | Run `node scripts/png-extract.js <file> --output temp.drawio` to extract the embedded source XML. Then parse with `node scripts/xml-parser.js temp.drawio --json`. Proceed same as .drawio path. Clean up temp file after. |
| Plain PNG (no embedded XML) + modification request | Tell the user: "This PNG doesn't contain editable source data. Do you have the original .drawio file? If not, I can analyze the image visually and redraw it with your changes — but I'll be recreating it from scratch, not modifying the original." Then proceed per user's choice. |

After parsing the existing structure, the rest of the workflow is identical to a fresh generation:
show IR-like summary → confirm → modify XML → validate → export → visual self-check → deliver.

```
User requests a diagram or modification
  │
  ├─ Is the user modifying an existing diagram?
  │     (.drawio file, .drawio.png, or plain PNG + change description)
  │
  │    ├─ YES → Parse existing structure → show summary → apply changes
  │    │       └─ Then continue through quality gates below
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
| User revises 5+ times | Suggest opening the `.drawio` file in draw.io desktop for fine-tuning. |

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

## Workflow: Pipeline B — Mermaid Conversion (Phase 3, planned)

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

### Step B3: Convert to .drawio

```bash
node scripts/mermaid-convert.js .drawio/<diagram-name>.mmd --output .drawio/<diagram-name>.drawio
```
Delete the `.mmd` file after successful conversion.
**Never** apply `--layout` to a Mermaid-converted file (it's already laid out).

### Step B4: Validate + Export + Self-Check

Same as Pipeline C Steps 3–5:
```bash
python3 scripts/validate.py .drawio/<diagram-name>.drawio
node scripts/export.js .drawio/<diagram-name>.drawio
```
Visual self-check per `references/visual-audit.md` (max 2 rounds).

### Step B5: Review + Final Export

Same as Pipeline C Step 6.

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

## Review Loop

After delivering the draft PNG:

1. **Show** the preview PNG to the user.
2. **Collect** feedback — the user may request label changes, layout adjustments, or component additions.
3. **Apply** targeted XML edits (re-validate after each edit with `python3 scripts/validate.py`).
4. **Re-export** preview: `node scripts/export.js .drawio/<diagram-name>.drawio`
5. **Repeat** until the user approves or 5 revision rounds are reached.

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
| draw.io CLI not found | Deliver `.drawio` XML + install guide. Offer browser fallback at https://app.diagrams.net/ |
| draw.io CLI < v30 | Disable Pipeline B; use Pipeline C for all diagrams |
| validate.py P0 error | Fix XML structure, re-validate (max 3 rounds) |
| validate.py P1 violation | Fix layout issue, re-validate (max 3 rounds) |
| Export produces blank PNG | Check XML validity, try `--width` flag |
| Export produces 0-byte file | Check disk space, retry with explicit `--output` path |
| Export fails | Check CLI path, output directory, headless environment. If still failing, deliver raw `.drawio` XML |
| Python 3 not available | Skip `--score` flag on validate.py; basic checks still work |
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

