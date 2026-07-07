# Authoring .drawio XML

> How to hand-write valid `.drawio` XML files for Pipeline C generation.
> Adapted from drawio-skill `references/xml-authoring.md`.
> For quality rules, see `references/rules.md`.

---

## File Skeleton

Every `.drawio` file follows this exact structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio" version="26.0.0" type="device">
  <diagram name="Page-1" id="page-1">
    <mxGraphModel dx="1434" dy="810" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0">
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
- `value` — display label (supports `&lt;br&gt;` for line breaks)
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
| Swimlane | `swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;` |
| Group (transparent) | `group;fillColor=none;strokeColor=#999999;dashed=1;` |
| Container (opaque) | `container=1;collapsible=0;fillColor=#f5f5f5;strokeColor=#666666;` |

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
  - Layer-to-layer: ≥ 120px vertical gap
  - Same row: 100–120px horizontal gap
  - Page margin: ≥ 40px

### Routing Corridors
- Reserve 80px-wide corridors between component groups for edge routing.
- Edges should not share the exact same path (rule R033).

### Hub Node Placement
- Place central nodes (API gateways, message buses) at `x=center, y=middle` of their connected components.
- Route edges from/to hub with waypoints for clean orthogonal paths.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Self-closing `<mxGeometry/>` on edge | Use expanded `<mxGeometry relative="1" as="geometry"></mxGeometry>` |
| Missing `as="geometry"` on mxGeometry | Always include `as="geometry"` |
| `id` values not sequential | Start from `"2"`, increment by 1 for each cell |
| Container `parent` not matching | Child `parent` must equal container's `id` |
| Edge `parent` not set to container | If source/target are in a container, edge parent should be that container's `id` |
| Edge connects to container instead of child | Edges should connect to leaf nodes, not swimlane containers |
| Array as="points" with 0 points | Omit the entire `<Array>` if no waypoints are needed |
