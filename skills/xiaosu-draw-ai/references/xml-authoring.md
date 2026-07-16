# Authoring .drawio XML

> How to hand-write valid `.drawio` XML files for Pipeline C generation.
> Adapted from drawio-skill `references/xml-authoring.md`.
> For quality rules, see `references/rules.md`.

---

## Content-First Sizing Pipeline (R034)

**CRITICAL: Build from text outward, not from coordinates inward.** The layout is derived, not decided.

### Step 0: Text Hierarchy

> **Priority**: The selected style JSON's `font` field values take priority over these
> defaults. If the JSON says `titleFontSize=16`, use 16, not 18. The 4-tier hierarchy
> structure is mandatory; the exact px values are style-dependent.

| Role | Tag | fontSize | fontStyle | Usage |
|------|-----|----------|-----------|-------|
| H1 — 图名 | diagram title | `18` | `1` (bold) | Top of page |
| H2 — 分层 | swimlane header | `14` | `1` (bold) | Container titles |
| Body — 模块 | module label | `13` | `0` | Node labels |
| Caption — 说明 | description | `10` | `0` | Sub-labels, edge labels |

### Step 1: Element Size from Text

For each module node, calculate minimum dimensions from its text content:

```
text_px_width(char) = fontSize (CJK) or fontSize × 0.6 (Latin)
text_px_width(bold) = text_px_width × 1.05
text_px_height(lines) = Σ(line_i_fontSize × 1.4)
w = ceil(text_px_width + spacingLeft + spacingRight) to nearest 10, minimum 90
h = ceil(text_px_height + spacingTop + spacingBottom) to nearest 10, minimum 50
```

Where spacing = 15px per side (R033).

**CRITICAL**: For swimlanes, verify header fits (R037): `w = max(derived_from_children, header_text_px + 30)`. The +30 = 20px (collapse icon) + 10px (OS font variance safety margin). Header overflow is a P0 defect.

### Step 2: Group Unification (R029 + R036)

All sibling modules in the same swimlane row MUST share the same **height**. Use `max(h)` of all siblings (R029).

**Cross-swimlane width unification (R036):** When multiple vertically stacked swimlanes share the same column layout, unify widths across ALL swimlanes: `W = max(all module widths across all swimlanes)`. Apply W to every module. Then recalculate swimlane width: `swimlane_w = margin × 2 + N_cols × W + (N_cols-1) × gap`. This guarantees columns align vertically and eliminates right-side whitespace. Exception: if `max(w)/min(w) > 1.5`.

### Step 3: Container Size from Children

```
container_w = margin_left + Σ(child_w) + Σ(gaps) + margin_right
container_h = header + margin_top + max(child_h) + margin_bottom
```

Where margins ∈ [10, 20] (R030), connected gaps = 80 (R031), unconnected gaps ∈ [10, 50] (R032).

**Sub-container sizing (R037+R038)**: A sub-swimlane's width is `max(children_derived, header_text_px + 30)`. When the header forces a wider swimlane, sub-items fill proportionally: `item_w = max(text_derived, swimlane_w × 0.65)`, then centered: `x = (swimlane_w - item_w) / 2`.

### Step 4: Layout & Axis Alignment

Position children left-to-right with calculated gaps. All children at same `y = header + margin_top`. y-center = `y + h/2` — identical for all siblings since they share the same height.

### Step 4b: Container Dimension Matching (R039)

After deriving each container's size from children, unify dimensions for visual consistency:

- **Vertically stacked** (same column) → unify **width**: all use `max(w)`
- **Horizontally adjacent** (same row) → unify **height**: all use `max(h)`

Extra space is absorbed by the right/bottom margin. Items stay at their calculated positions.

### Step 5: Standalone Elements

Actors and external nodes placed LAST, adjacent to their connected peer. Apply R029 (y-center alignment) and R031 (80px gap) — then work backward to determine their x, y coordinates.

### Step 6: Edge Routing

Edges routed last. Intra-container edges (parent=container): direct source→target with exitX/entryX. Cross-container edges (parent="1"): L-route through inter-layer gap, ≤2 waypoints (R023).

### Step 7: Validation

Run validate.py. Fix P0/P1 errors. Max 3 repair rounds.

---

## File Skeleton

Every `.drawio` file follows this exact structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio" version="26.0.0" type="device">
  <diagram name="Page-1" id="page-1">
    <mxGraphModel dx="1434" dy="810" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0" pageBgColor="#ffffff">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- User cells start from id="2" -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

**Critical rules:**
- `id="0"` — root cell. Must exist. Never reference as parent.
- `id="1"` — default parent layer. All top-level shapes use `parent="1"`.
- User cells **must** use `id` starting from `"2"`, incrementing sequentially.
- Never skip IDs or use non-sequential numbers.
- `pageBgColor` — sets the diagram background color. When applying style presets (e.g., Claude Official `#f8f6f3`, Dark Terminal `#1e1e1e`), set this attribute to the style's background value. Default: `#ffffff`.

---

## Vertex (Shape) Template

Every shape node must have an **expanded** `<mxGeometry>` child element:

```xml
<mxCell id="2" value="Label Text" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="200" height="60" as="geometry" />
</mxCell>
```

**Required attributes:**
- `id` — unique numeric string, starting from `"2"`
- `value` — display label. **HTML tags in value MUST be XML-escaped**: `<br>` → `&amp;lt;br&amp;gt;`, `<b>` → `&amp;lt;b&amp;gt;`, `<font>` → `&amp;lt;font&amp;gt;`. Writing unescaped `<br>` directly triggers R004 XML parse errors. For line breaks, use `&amp;lt;br&amp;gt;` (i.e., `&lt;br&gt;` in the raw XML).
- `style` — semicolon-separated key=value pairs (see Shape Styles below)
- `vertex="1"` — marks this as a shape
- `parent` — `"1"` for top-level, or container's `id` for nested shapes

**Required child:**
- `<mxGeometry x="..." y="..." width="..." height="..." as="geometry" />`

---

## Shape Styles (Quick Reference)

### Basic Shapes

| Shape | Style String |
|-------|-------------|
| Rectangle | `rounded=0;whiteSpace=wrap;html=1;` |
| Rounded Rectangle | `rounded=1;whiteSpace=wrap;html=1;` |
| Ellipse / Circle | `ellipse;whiteSpace=wrap;html=1;` |
| Rhombus (Diamond) | `rhombus;whiteSpace=wrap;html=1;` |
| Cylinder (Database) | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| Parallelogram | `shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;` |
| Hexagon | `shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;` |
| Cloud | `ellipse;shape=cloud;whiteSpace=wrap;html=1;` |
| Document | `shape=document;whiteSpace=wrap;html=1;boundedLbl=1;` |
| Actor (stick figure) | `shape=actor;whiteSpace=wrap;html=1;` |

### Container Shapes

| Shape | Style String |
|-------|-------------|
| Swimlane | `swimlane;startSize=30;fillColor=#B0C4DE;strokeColor=#6c8ebf;` |
| Group (transparent) | `group;fillColor=none;strokeColor=#999999;dashed=1;` |
| Container (opaque) | `container=1;collapsible=0;fillColor=#f5f5f5;strokeColor=#666666;` |

> **CRITICAL — Z-order:** Do NOT use `swimlaneFillColor` on swimlanes. It creates an opaque body fill that covers cross-layer edges regardless of document order. The swimlane body must remain transparent so edges are visible when passing through. Visual grouping is achieved through the colored header (`fillColor`) + stroke border. See R040 in `rules.md`.
>
> **Note:** For transparent containers that should not block mouse events, add `pointerEvents=0` to the style string.

---

## Edge (Connector) Template

Every edge **must** have an expanded `<mxGeometry>` child — **never** self-closing:

```xml
<mxCell id="5" value="Edge Label" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;" edge="1" parent="1" source="2" target="3">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

**Required attributes:**
- `edge="1"` — marks this as an edge
- `parent` — `"1"` for top-level, or container's `id` if source and target are in same container
- `source` — vertex `id` where the edge starts
- `target` — vertex `id` where the edge ends

**Required child:**
- `<mxGeometry relative="1" as="geometry" />` — **must be expanded form**, never `<mxGeometry relative="1" as="geometry"/>` (self-closing edges do not render)

### Edge with Waypoints

For manual path control, add `<Array as="points">` inside `<mxGeometry>`:

```xml
<mxCell id="6" style="edgeStyle=orthogonalEdgeStyle;..." edge="1" parent="1" source="2" target="3">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="320" y="70" />
      <mxPoint x="320" y="150" />
    </Array>
  </mxGeometry>
</mxCell>
```

### Edge Label Positioning

The label position can be offset from the edge center using `x` and `y` on `<mxGeometry relative="1">`:

| Attribute | Axis | Range | Meaning |
|-----------|------|-------|---------|
| `x` | **Along the edge path** | `[-1, 1]` | `-1` = source end, `0` = center (default), `1` = target end |
| `y` | **Perpendicular to edge** | pixels | Positive = right of edge direction, negative = left |

**Critical**: `x` follows the edge PATH, not the diagram's x-axis. For a vertical edge (top→bottom), `x=-0.5` moves the label **up** toward the source. For a horizontal edge (left→right), `x=-0.5` moves the label **left** toward the source.

**Pixel calculation**: `pixel_offset = x × (edge_length / 2)`. Example: a 400px vertical edge with `x="-0.6"` moves the label `0.6 × 200 = 120px` toward the source (up).

```xml
<!-- Default: label at edge center -->
<mxGeometry relative="1" as="geometry" />

<!-- Move label 120px toward source along a 400px vertical edge -->
<mxGeometry x="-0.6" relative="1" as="geometry" />
```

### Edge Styles

| Style | Key-Value Pairs |
|-------|----------------|
| Orthogonal (default) | `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;` |
| Straight | `edgeStyle=none;rounded=0;` |
| Curved | `edgeStyle=orthogonalEdgeStyle;curved=1;` |
| Dashed | Add `dashed=1;dashPattern=8 4;` |
| No arrow | Omit `endArrow` or set `endArrow=none;` |
| Arrow (filled) | `endArrow=classic;endFill=1;` |
| Arrow (open) | `endArrow=open;endFill=0;` |
| Arrow (diamond) | `endArrow=diamond;endFill=1;` |
| Bidirectional | Add `startArrow=classic;startFill=1;` |
| Flow animation | Add `flowAnimation=1;` |

---

## Connection Point Distribution

When multiple edges connect to the same shape, distribute connection points to avoid overlap.

Connection points are specified via `exitX`/`exitY` (source side) and `entryX`/`entryY` (target side):

| Position | exitX/entryX | exitY/entryY |
|----------|-------------|-------------|
| Top center | `0.5` | `0` |
| Bottom center | `0.5` | `1` |
| Left center | `0` | `0.5` |
| Right center | `1` | `0.5` |

**Multi-edge distribution (3 edges on the same side):**

| Edge # | exitX / entryX |
|--------|---------------|
| 1 (left) | `0.25` |
| 2 (center) | `0.5` |
| 3 (right) | `0.75` |

> **Rule R035**: Connection points must be ≥ 20px from any corner. Avoid `exitX=0` with `exitY=0`, etc.

---

## Default Color Palette (Phase 1)

Inspired by drawio-skill `default.json`:

| Semantic Role | fillColor | strokeColor | Typical Use |
|--------------|-----------|-------------|-------------|
| **Primary** / Service | `#dae8fc` | `#6c8ebf` | Microservices, APIs, application logic |
| **Success** / Database | `#d5e8d4` | `#82b366` | Data stores, databases, caches |
| **Warning** / Queue | `#fff2cc` | `#d6b656` | Message queues, event buses, async |
| **Accent** / Gateway | `#ffe6cc` | `#d79b00` | API gateways, load balancers, proxies |
| **Danger** / Error | `#f8cecc` | `#b85450` | Security, authentication, error paths |
| **Neutral** / External | `#f5f5f5` | `#666666` | External systems, third-party services |
| **Secondary** / Config | `#e1d5e7` | `#9673a6` | Config, CI/CD, infrastructure |

**Text styling:**
- `fontFamily=Helvetica;fontSize=12;` — default
- Title/large text: `fontSize=14;fontStyle=1;` (1=bold)
- Small labels: `fontSize=10;`
- Monospace: `fontFamily=Courier New;`

---

## Layout Tips

### Grid Alignment
- All coordinates (`x`, `y`, `width`, `height`) should be multiples of **10px** (rule R020).
- Set `gridSize="10"` in `<mxGraphModel>`.

### Spacing
- See `references/rules.md` for the full spacing/layout constants table.
- Rapid reference:
  - Node-to-node: ≥ 80px edge-to-edge
  - Layer-to-layer connected: `max(80, 24 + N × 18)` px, where N = cross-layer edges
  - Layer-to-layer unconnected: 40px (R006 → R032)
  - Same-row connected (R031): 80px edge-to-edge gap
  - Same-row unconnected (R032): 50px edge-to-edge gap (default when no edges per R006)
  - Page margin: ≥ 40px

### Routing Corridors
- Reserve 80px-wide corridors between component groups for edge routing.
- Edges should not share the exact same path (rule R033).

### Hub Node Placement
- Place central nodes (API gateways, message buses) at `x=center, y=middle` of their connected components.
- Route edges from/to hub with waypoints for clean orthogonal paths.

### Edge Simplicity (R006, R016–R018, R023, R025)

**R067 — Explicit exit/entry points for special edges only:** For simple forward-flow edges (top→down center-to-center), the default connection is sufficient — do NOT add explicit `exitX`/`exitY`/`entryX`/`entryY`. Only specify them when: (a) **feedback loops** that exit/enter from the side per R066, (b) **branch edges** from decisions where N≥2 edges exit the same source (distribute per R045), or (c) **multi-entry** where N≥2 edges enter the same target from the same side. When explicit exit/entry IS used, the waypoint coordinates MUST match the computed point exactly: `wp.x = node.x + node.w × portX`, deviation >2px = R016 violation.

**CRITICAL (R006):** Before adding ANY edge, verify the user described the relationship:
- "X contains A, B, C" → do NOT add edges between A, B, C modules
- "X calls Y" or "A → B" → add the described edge
- Container-level edges (User → App) are acceptable when the user describes a system with parts
- When in doubt, do NOT add the edge — a diagram without edges is correct; a diagram with invented edges is wrong

**Routing execution order** (apply in sequence; each decision constrains the next):

```
0. R051 — Determine edge parent:
   source and target in same swimlane? → parent="<swimlane-id>"
   source and target in different swimlanes? → parent="1"
   one is top-level (parent="1")? → parent="1"

1. R049 — Try direct path FIRST:
   same-column (source directly above target)? → exitY=1, entryY=0, 0 waypoints
   same-row (source directly left of target)? → exitX=1, entryX=0, 0 waypoints
   Skip to step 5 if direct path works and passes R050.

2. R018 — Exit strategy (only if direct path fails):
   For each source node: is there a sibling in the same column AND row below?
   ├─ YES → Side-exit (exitX=1 or 0, exitY=0.5). wp1 must be ≥10px from exit along exit direction.
   └─ NO  → Bottom-exit (exitX=0.5, exitY=1). Simpler routing preferred.

3. R017 — Assign unique routing y-level:
   Assign each cross-layer edge a distinct routing_y in the inter-layer gap.
   Levels spaced ≥15px apart.

4. R050 — Obstacle check (MANDATORY):
   Trace every segment against ALL non-source/non-target node bounding boxes.
   If any segment passes within ≤15px of a node → INVALID, re-route.
   Re-route through nearest available side corridor (left/right of blocking node).

5. R047 — Waypoint-entry/exit axis alignment:
   For horizontal entry (entryX=0/1): last wp y MUST equal entry y.
   For vertical entry (entryY=0/1): last wp x MUST equal entry x.
   For horizontal exit (exitX=0/1): first wp y MUST equal exit y.
   For vertical exit (exitY=0/1): first wp x MUST equal exit x.

6. R016 — Align last waypoint with entry:
   wp_last MUST have x == entry_x (within ±0px).
   This guarantees the final segment is vertical → arrow always points down.
   entryX must produce integer x: use 0.3/0.7 for w=110, 0.5 for w=90.

7. R023 — Verify waypoint count:
   Bottom-exit: 2 waypoints (wp1=source routing, wp2=entry alignment).
   Side-exit: 2 waypoints (wp1=clearance offset, wp2=entry alignment).
   Avoid ≥3 waypoints.
```

- **Minimize waypoints (R023).** A direct edge needs 0 waypoints. Bottom-exit needs 2 waypoints. Side-exit needs 2 waypoints. Never use ≥3.
- **Side-exit 10px clearance (R018).** wp1_x = exit_x ± 12 (12px from exit point along exit direction) to avoid the edge appearing to hug the node border.
- **Bottom-exit preferred** when no node sits below the source (R018 decision rule).
- **Entry point precision (R016).** `entryX` must produce an integer x-coordinate. For w=110 nodes: use `entryX=0.3` (x+33) or `entryX=0.7` (x+77). For w=90 nodes: use `entryX=0.5` (x+45). Never use `0.33/0.67` on non-divisible widths.
- **Routing corridor levels (R017).** Each cross-layer edge must use a unique `routing_y`. Space ≥ 15px apart.
- **Single-connection nodes (R024)** should be placed directly adjacent to their peer, aligned on the edge axis. An actor that only connects to one service should sit right above/beside it, not at the opposite canvas edge.
- **Axis alignment (R025):** Before placing nodes, check: are A and B connected by a horizontal edge? → same y-center. Connected by a vertical edge? → same x-center. Deviation ≤ 10px. Reorder siblings within a swimlane so connected nodes are adjacent — never let an edge pass through an unrelated node C between A and B.
- **Arrow direction must match the visual flow.** A top→down edge ends with the arrow pointing down into the target's top edge; a left→right edge ends with the arrow pointing right into the target's left edge.
- **Feedback/loopback edge routing (R066):** When an edge returns to an earlier step (retry loop, "不通过" branch, rejection path), route it on the **outside** of the main flow — not through the center. If the main flow is top→down, feedback edges should exit from the LEFT or RIGHT side of the source node and enter from the LEFT or RIGHT side of the target node. Use `dashed=1` to visually distinguish feedback from main flow. Choose the side with fewer existing edges/nodes to minimize crossings. **A feedback edge may share the same entryX/entryY as a forward edge when their approach directions differ** (e.g., a top-entering forward edge and a left-entering feedback edge both targeting `entryX=0.5;entryY=0` — the different approach paths make them visually distinct without collision).
- **Proportional sizing (R027):** Actors ≈ `60×70`, services ≈ `150×50`. Sub-components may be narrower (`≥120`). Keep scale consistent across the diagram.
- **Container fit (R026):** `swimlane_w = margin × 2 + Σ(child_w) + Σ(gap)`. Gap = 50px for unconnected (R032, default per R006) or 80px for connected (R031). Margin = 40px each side.

### Z-Order Convention

Edge visibility depends on document order relative to containers:

- **Cross-layer edges** (`parent="1"`, source and target in different containers): declare **AFTER** all swimlane and vertex elements. This ensures edges render on top of swimlane boundaries — critical when an edge passes through a swimlane's visual area. Edges hidden behind swimlanes are a common user complaint.
- **Intra-layer edges** (`parent="<container-id>"`): natural children of their parent swimlane. They render within the container context. Document order relative to other intra-layer children determines their z-order.
- **Legend**: always last, after all diagram edges.

Correct order: `title → standalone vertices → swimlanes (with children) → cross-layer edges → intra-layer edges → legend`

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Self-closing `<mxGeometry/>` on edge | Use expanded `<mxGeometry relative="1" as="geometry"></mxGeometry>` |
| Missing `as="geometry"` on mxGeometry | Always include `as="geometry"` |
| `id` values not sequential | Start from `"2"`, increment by 1 for each cell |
| Container `parent` not matching | Child `parent` must equal container's `id` |
| Edge `parent` not set to container | If source/target are in a container, edge parent should be that container's `id` |
| Edge connects to container instead of child | Edges should connect to leaf nodes, not swimlane containers. **Exception:** External actors (user, third-party system) may connect to a swimlane container when the semantic relationship is with the system as a whole (e.g., User → App System). When connecting to a swimlane, target the swimlane's top edge (`entryY=0`) at center (`entryX=0.5`), and route the edge to the swimlane boundary — the connection visually anchors to the container edge. |
| Array as="points" with 0 points | Omit the entire `<Array>` if no waypoints are needed |
