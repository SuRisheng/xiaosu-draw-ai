---
name: xiaosu-draw-ai
version: 0.1.0
description: >-
  Universal AI diagramming skill powered by draw.io CLI. Generate production-quality
  architecture, sequence, ER, flowchart, deployment, class, C4, state machine, network,
  and data flow diagrams from natural language descriptions.
  Phase 1: Pipeline C only (AI hand-writes .drawio XML).
license: MIT
compatibility: >-
  Requires draw.io desktop app CLI (>= 24.0.0) on PATH.
  validate.py needs Python 3. export.js needs Node.js.
platforms: [windows, macos, linux]
---

# xiaosu-draw-ai

Generate `.drawio` XML files and export to PNG/SVG/PDF using the native draw.io desktop CLI.
**Phase 1** supports Pipeline C: AI hand-writes draw.io XML guided by structural constraints.

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
| `references/xml-authoring.md` | Hand-writing `.drawio` XML (every Pipeline C generation) |
| `references/rules.md` | Need to check specific P0-P3 rule definitions, spacing constants, or scoring weights |

## Workflow (Phase 1: Pipeline C — AI Hand-Writes XML)

Follow this 6-step process. Do NOT skip steps 4-5 (quality gates).

### Step 1: Plan

Before writing XML, plan the diagram structure:

1. **Identify diagram type** — match user request to a diagram type above. If ambiguous, ask: "What kind of diagram: A. System architecture B. Sequence/flow C. Data/ER?"
2. **List components** — what shapes are needed? What are their semantic roles?
3. **Determine layout** — top-to-bottom or left-to-right? How many tiers/layers?
4. **Plan edges** — which components connect? What arrow types?

State your plan to the user before generating. Example:
> "I'll create a **system architecture** diagram with:
> - **Layer 1 (Frontend)**: Web App, iOS App
> - **Layer 2 (Gateway)**: API Gateway (Kong)
> - **Layer 3 (Services)**: User Service, Order Service, Product Service
> - **Layer 4 (Data)**: MySQL, Redis
> - **Layout**: Top-to-bottom, 4 tiers, 120px layer spacing
> - **Edges**: Frontend → Gateway → Services → Data"

### Step 2: Generate XML

Read `references/xml-authoring.md`. Generate a valid `.drawio` XML file and write it to `.drawio/<diagram-name>.drawio`.

**CRITICAL rules:**
- File skeleton: `id="0"` and `id="1"` are root cells. User cells start from `id="2"`, incrementing.
- Every vertex must have `<mxGeometry x="..." y="..." width="..." height="..." as="geometry" />`.
- Every edge must have expanded `<mxGeometry relative="1" as="geometry"></mxGeometry>` — never self-closing.
- All coordinates must be multiples of **10px** (rule R020).
- Use the default color palette from `references/xml-authoring.md` for fill/stroke colors.
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

Examine the exported PNG for P3 issues (visual only, from `references/rules.md`):

- **R030** — Label truncation: text overflowing shape boundaries
- **R031** — Edge-shape visual overlap: edges crossing unrelated shapes
- **R032** — Edge-label overlap: edge labels colliding with elements
- **R033** — Stacked edges: multiple edges on the same visual path
- **R034** — Wrong arrow direction
- **R035** — Corner connections (within 20px of corners)
- **R037** — Insufficient component spacing (< 80px visually)
- **R038** — Z-order violations
- **R039** — Legend overlap

If vision is available: read the PNG, check all 9 points above. **Maximum 2 self-check rounds.**
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

## Error Recovery

| Situation | Action |
|-----------|--------|
| draw.io CLI not found | Guide user to install (see Prerequisites) |
| validate.py P0 error | Fix XML structure, re-validate |
| validate.py P1 violation | Fix layout issue, re-validate |
| Export produces blank PNG | Check XML validity, try `--width` flag |
| Export produces 0-byte file | Check disk space, retry with explicit `--output` path |
| Python 3 not available | Skip `--score` flag on validate.py; basic checks still work |
| Vision not available | Skip visual self-check; note to user |

---

## Quick Reference: Export Commands

| Purpose | Command |
|---------|---------|
| Preview PNG (no embed) | `node scripts/export.js <file>.drawio` |
| Final PNG (embed XML) | `node scripts/export.js <file>.drawio --final` |
| Final SVG | `node scripts/export.js <file>.drawio --final --format svg` |
| Final PDF | `node scripts/export.js <file>.drawio --final --format pdf` |
| Custom width | `node scripts/export.js <file>.drawio --width 4000` |
| Custom scale | `node scripts/export.js <file>.drawio --final --scale 4` |
