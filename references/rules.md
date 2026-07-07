# P0-P3 Pixel-Level Rule System

> Unified quality rulebook. Each rule defines what `validate.py` (automated) and AI visual audit (manual) enforce.
>
> Sources: drawio-skill validate.py error categories + fireworks-tech-graph layout best practices.

---

## Rule Format

Each rule follows this structure:

```
R0XX | Priority | Category | Detection Method | Description
```

**Priorities:**
- **P0** — Blocking (exit code 2). Must fix before proceeding.
- **P1** — Must Fix (exit code 1). Fix and re-run validation.
- **P2** — Warning (exit code 0). Recorded but does not block.
- **P3** — Advisory. AI visual audit only. Cannot be automated.

**Detection Methods:**
- `[validate.py]` — Fully automated by the structural lint script.
- `[AI 视觉]` — Requires AI to visually inspect the exported PNG.
- `[混合]` — Partially automated; AI visual confirmation recommended.

---

## P0 — Blocking (Exit Code 2)

Rules that indicate structural corruption. **Must fix before proceeding.**

| ID | Description | Detection | Auto-fix? |
|----|-------------|-----------|-----------|
| **R001** | **Dangling edge**: `source` or `target` attribute references a cell `id` that does not exist in the document. | `[validate.py]` | No |
| **R002** | **Duplicate / reserved ID**: A user cell uses `id="0"` or `id="1"` (reserved for root cells), or two cells share the same `id`. | `[validate.py]` | No |
| **R003** | **Parent-child breakage**: A cell's `parent` attribute references a cell `id` that does not exist. | `[validate.py]` | No |
| **R004** | **XML syntax violation**: Illegal `--` inside XML comments, unescaped special characters (`<`, `>`, `&` in text content), or malformed tags. | `[validate.py]` | No |
| **R005** | **Missing geometry**: A vertex `mxCell` lacks a child `<mxGeometry>` element, or an edge `mxCell` has a self-closing `<mxGeometry/>` instead of an expanded form. | `[validate.py]` | No |

---

## P1 — Must Fix (Exit Code 1)

Rules that indicate layout or quality defects. **Fix and re-run validation.**

| ID | Description | Detection | Auto-fix? |
|----|-------------|-----------|-----------|
| **R010** | **Overlapping siblings**: Two leaf-node vertices (same parent) have bounding boxes that overlap with less than **8px** safety margin. | `[validate.py]` | No |
| **R011** | **Edge through vertex**: A waypointed edge's line segment passes through the bounding box of a vertex that is neither its source nor target. | `[validate.py]` | No |
| **R012** | **Edge crossing**: Two waypointed edges have line segments that cross each other. | `[validate.py]` | No |
| **R013** | **Insufficient spacing — connected**: Edge-connected node pair has center-to-center distance < minimum for their layout direction. | `[validate.py]` | No |
| **R014** | **Off-canvas**: Any vertex has `x < 0` or `y < 0` coordinates. | `[validate.py]` | No |
| **R015** | **Self-closing edge**: An edge `mxCell` lacks a child `<mxGeometry>` element (uses self-closing tag). Edges must have expanded `<mxGeometry relative="1" as="geometry"/>`. | `[validate.py]` | No |

---

## P2 — Warning (Exit Code 0)

Rules that indicate suboptimal quality. **Recorded in validation output but do not block.**

| ID | Description | Detection |
|----|-------------|-----------|
| **R020** | **Off-grid geometry**: Vertex `x`, `y`, `width`, or `height` values are not multiples of **10px**. | `[validate.py]` |
| **R021** | **Non-centered connection point**: `exitX`/`exitY`/`entryX`/`entryY` is not `0.5` (centered) and there is no visible multi-edge justification on that side. | `[validate.py]` |
| **R022** | **Arrow final segment too short**: The last line segment of a waypointed edge is less than **15px** long. | `[validate.py]` |

---

## P3 — Advisory (AI Visual Audit Only)

Rules that require visual judgment. Cannot be reliably automated; AI checks exported PNG.

| ID | Description | Source |
|----|-------------|--------|
| **R030** | **Label truncation**: Text content visually overflows its shape boundary. | drawio-skill Step 5 |
| **R031** | **Edge-shape visual overlap**: An edge (especially without waypoints) visually crosses an unrelated shape's interior. | drawio-skill Step 5 |
| **R032** | **Edge-label overlap**: An edge label collides with other visual elements (nodes, other labels, connectors). | drawio-skill Step 5 |
| **R033** | **Stacked edges**: Multiple edges follow the same visual path (indistinguishable). | drawio-skill Step 5 |
| **R034** | **Wrong arrow direction**: Arrow head points in the wrong direction relative to the connected shape's edge. | drawio-skill Step 5 |
| **R035** | **Corner connection**: Arrow connects within **20px** of a shape's corner (instead of edge midpoint). | fireworks-tech-graph |
| **R036** | **Missing arrow label background**: An arrow label has no background rectangle, making it unreadable when crossing lines. | fireworks-tech-graph |
| **R037** | **Insufficient component spacing**: Visual clearance between unrelated components appears less than **80px**. | fireworks-tech-graph |
| **R038** | **Z-order violation**: Arrows render visually on top of components (should be behind). | fireworks-tech-graph |
| **R039** | **Legend overlap / unreadable**: Legend collides with diagram content or is too small to read. | General |

---

## Spacing & Layout Constants

Source: fireworks-tech-graph `svg-layout-best-practices.md`, adapted for draw.io XML.

| Constant | Value | Applies To |
|----------|-------|------------|
| Component-to-component clearance | ≥ **80px** (edge to edge) | All diagram types |
| Layer-to-layer vertical gap | ≥ **120px** | Architecture, deployment, flowchart |
| Same-layer horizontal gap | **100–120px** | Horizontal layout rows |
| Grid alignment | Snap to **10px** multiples | All coordinates (`x`, `y`, `width`, `height`) |
| Connection point corner clearance | ≥ **20px** from any corner | Edge connection points |
| Stagger parallel arrows | **15–20px** offset | Multiple edges between same layers |
| Canvas margin | ≥ **40px** from edges | viewBox / page boundaries |
| Routing corridor width | ≥ **80px** | Dedicated vertical/horizontal channels for edges |
| Arrow final segment minimum | ≥ **15px** | Last segment before arrow head |

---

## Z-Order Convention

When rendering a diagram, layer elements in this order (bottom → top):

1. Canvas background
2. Grouping containers (swimlanes, dashed boundary rects)
3. Arrow / edge paths
4. Arrow label background rectangles
5. Components (vertex shapes)
6. Component text labels
7. Arrow label text
8. Legend

---

## Readability Scoring

`validate.py --score` uses the following weights:

| Issue | Weight |
|-------|--------|
| Edge through vertex (R011) | × 20 |
| Edge crossing (R012) | × 10 |
| Overlapping siblings (R010) | × 5 |
| Off-grid geometry (R020) | × 1 |
| Non-centered connection point (R021) | × 2 |
| Short arrow segment (R022) | × 3 |

Lower score = better readability. Score of **0** = perfect.
