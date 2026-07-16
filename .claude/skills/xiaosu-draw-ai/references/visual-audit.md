# Visual Audit Guide (P3 Rules)

> AI self-check reference for SKILL.md Step 5 (Visual Self-Check).
>
> **When to read:** After exporting a preview PNG (`node scripts/export.js <file>.drawio`),
> before the final export. Examine the exported image for the P3 issues below.
> Maximum 2 self-check rounds. If vision is unavailable, skip and note to the user.
>
> For P0–P2 automated rules, see `references/rules.md` and `scripts/validate.py`.

## Workflow

1. Export preview: `node scripts/export.js <file>.drawio`
2. Examine the PNG for each rule below
3. For each violation found, apply the XML fix described
4. Re-validate and re-export
5. After max 2 rounds: proceed or flag remaining issues

---

## R030 — Label Truncation

**What to look for:** Text content visually overflows its shape boundary. Text appears cut off, clipped at the shape edge, or a multi-line label has lines visibly wider than the shape.

**How to identify:**
- Estimate text width: each character at `fontSize=12` occupies approximately 7px
- For a shape with width=`W` and padding ≈ 16px, the max characters ≈ `(W - 16) / 7`
- Example: 200px wide → ~26 characters fit; 120px wide → ~15 characters
- Chinese characters are wider: ~12px each at fontSize=12
- If text is longer than the limit, it will truncate or wrap undesirably

**How to fix (in order of preference):**
1. Increase the shape's `width` by 20–40px
2. Reduce `fontSize` to 10
3. Split `value` into multiple lines with `&#xa;` or `&lt;br&gt;`
4. Shorten the label text

**Example:**
```xml
<!-- Before: 200px wide, text "Authentication and Authorization Service" ≈ 40 chars,
     likely truncated (fits ~26 chars at fontSize=12) -->
<mxCell id="2" value="Authentication and Authorization Service"
  style="rounded=1;whiteSpace=wrap;html=1;fontSize=12;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="200" height="50" as="geometry" />
</mxCell>

<!-- After: wider shape, or split label -->
<mxCell id="2" value="Auth &amp; Authz Service"
  style="rounded=1;whiteSpace=wrap;html=1;fontSize=12;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="200" height="50" as="geometry" />
</mxCell>
```

---

## R031 — Edge-Shape Visual Overlap

**What to look for:** An edge path that visually crosses through the interior of a shape that is neither its source nor its target. The edge passes through an unrelated shape's bounding box.

**How to identify:**
- Edges without waypoints are most at risk (direct straight line from source center to target center)
- Trace the edge path visually — if it cuts through any third shape, it's a violation
- Even edges with waypoints can cross shapes if the waypoints are poorly placed

**How to fix (in order of preference):**
1. Add `<Array as="points">` with intermediate waypoints to route around the obstacle
2. Move the obstacle shape to a different position
3. Reserve routing corridors (80px wide) between component groups
4. Adjust layout direction to minimize edge-shape crossings

**Example:**
```xml
<!-- Before: edge from id=2 to id=4 passes through id=3 -->
<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;..." edge="1" parent="1" source="2" target="4">
  <mxGeometry relative="1" as="geometry" />
</mxCell>

<!-- After: add waypoints to route around id=3 -->
<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;..." edge="1" parent="1" source="2" target="4">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="320" y="70" />
      <mxPoint x="320" y="150" />
    </Array>
  </mxGeometry>
</mxCell>
```

---

## R032 — Edge-Label Overlap

**What to look for:** An edge label collides with other visual elements — nodes, other edge labels, or connector points.

**How to identify:**
- Check each edge's `value` (label text) position relative to other shapes
- Edge labels on short edges (< 100px) are most likely to overlap with adjacent content
- Multiple labels in the same region can collide
- Labels at edge crossings are unreadable

**How to fix (in order of preference):**
1. Add `labelBackgroundColor=#FFFFFF;` to the edge style (simplest, most effective)
2. Move the label position by adjusting waypoints
3. Shorten the label text
4. Increase the edge length by adjusting shape positions

**Example:**
```xml
<!-- Before: label has no background, unreadable when crossing lines -->
style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;endFill=1;"

<!-- After: white background behind label -->
style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;endFill=1;labelBackgroundColor=#FFFFFF;"
```

---

## R033 — Stacked Edges

**What to look for:** Multiple edges follow the same visual path — they are indistinguishable from each other, appearing as a single thick line.

**How to identify:**
- Two or more edges connecting the same pair of shapes (or same set of waypoints)
- Edges with identical or very similar waypoint coordinates
- In the PNG, they overlap visually

**How to fix (in order of preference):**
1. Offset waypoints by 15–20px for each additional edge
2. Use different `exitX` / `exitY` values to distribute connection points
3. For 3 edges on the same side: `exitX=0.25`, `0.50`, `0.75`
4. Use curved edges (`curved=1`) for one path if only two edges

**Example:**
```xml
<!-- Edge 1 (leftmost): exitX=0.25 -->
<mxCell id="5" style="..." edge="1" parent="1" source="2" target="3"
  exitX="0.25" exitY="1" entryX="0.25" entryY="0">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="190" y="160" />
      <mxPoint x="190" y="230" />
    </Array>
  </mxGeometry>
</mxCell>

<!-- Edge 2 (center): exitX=0.50, waypoints offset by +20px -->
<mxCell id="6" style="..." edge="1" parent="1" source="2" target="3"
  exitX="0.50" exitY="1" entryX="0.50" entryY="0">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="210" y="160" />
      <mxPoint x="210" y="230" />
    </Array>
  </mxGeometry>
</mxCell>

<!-- Edge 3 (rightmost): exitX=0.75, waypoints offset by +40px -->
<mxCell id="7" style="..." edge="1" parent="1" source="2" target="3"
  exitX="0.75" exitY="1" entryX="0.75" entryY="0">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="230" y="160" />
      <mxPoint x="230" y="230" />
    </Array>
  </mxGeometry>
</mxCell>
```

---

## R034 — Wrong Arrow Direction

**What to look for:** An arrow head points in the wrong direction relative to the intended flow described by the user.

**How to identify:**
- Compare each edge's direction against the user's description
- If the user said "Client calls Server", the arrow should point from Client → Server
- In the XML: `source` = origin, `target` = destination with `endArrow`
- If the arrow head renders on the source side instead of target side, direction is reversed
- For response messages in sequence diagrams: reverse direction with open arrow

**How to fix:**
1. Swap the `source` and `target` attributes on the edge
2. Or, if layout is also wrong, swap the actual vertex positions
3. For bidirectional flows: use a separate edge for each direction

**Example:**
```xml
<!-- Before: reversed — arrow points from Server to Client -->
<mxCell id="5" edge="1" parent="1" source="3" target="2">
  <!-- Intended: Client(2) → Server(3) -->

<!-- After: correct direction -->
<mxCell id="5" edge="1" parent="1" source="2" target="3">
```

---

## R035 — Corner Connection

**What to look for:** An arrow connects within 20px of a shape's corner (instead of near the edge midpoint).

**How to identify:**
- Check `exitX` / `exitY` and `entryX` / `entryY` values
- Corner values (all produce corner connections):
  - `exitX=0, exitY=0` → top-left corner
  - `exitX=1, exitY=0` → top-right corner
  - `exitX=0, exitY=1` → bottom-left corner
  - `exitX=1, exitY=1` → bottom-right corner
- Values near 0 or 1 on both axes simultaneously
- Visually: arrow starts/ends at a corner rather than an edge midpoint

**How to fix:**
1. Set `exitX=0.5` / `exitY=0.5` for centered connections (preferred)
2. For side exit: set the perpendicular axis to `0.5`
   - Exit from top: `exitY=0`, `exitX=0.5`
   - Exit from bottom: `exitY=1`, `exitX=0.5`
   - Exit from left: `exitX=0`, `exitY=0.5`
   - Exit from right: `exitX=1`, `exitY=0.5`
3. For multi-edge distribution: use `0.25` / `0.50` / `0.75` (away from 0.0/1.0 extremes)

**Example:**
```xml
<!-- Before: corner connection (bottom-right corner) -->
<mxCell id="5" edge="1" parent="1" source="2" target="3"
  exitX="1" exitY="1">

<!-- After: bottom-center connection -->
<mxCell id="5" edge="1" parent="1" source="2" target="3"
  exitX="0.5" exitY="1">
```

---

## R036 — Missing Arrow Label Background

**What to look for:** An edge label has no background rectangle, making it unreadable when it crosses lines or shapes.

**How to identify:**
- Edge with a `value` (label text) that intersects with other diagram elements
- The label text is difficult to read against the background (diagram lines pass behind it)
- Check the edge style string — if `labelBackgroundColor` is missing, add it

**How to fix:**
Add `labelBackgroundColor=#FFFFFF;` to every edge style that has a label:
```xml
<!-- Before: no background on label -->
style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;endFill=1;"

<!-- After: white background makes label readable -->
style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;endFill=1;labelBackgroundColor=#FFFFFF;"
```

**Note:** This fix is trivial and should be applied proactively to all edges with labels. No visual check needed — just always add it.

---

## R037 — Insufficient Component Spacing

**What to look for:** Visual clearance between unrelated components appears less than 80px edge-to-edge.

**How to identify:**
- Check edge-to-edge distance between adjacent shapes
- Components within the same group/container: minimum 40px clearance
- Cross-group / cross-layer components: minimum 80px clearance
- Layer-to-layer gap must be ≥ 120px

**How to fix:**
1. Adjust `x` or `y` coordinates: `gap = next.x - (current.x + current.width)`
2. For layer gaps: `gap = next_layer.y - (current_layer.y + current_layer.height)`
3. Move shapes to multiples of 10px
4. If repositioning one shape causes overlapping elsewhere, reposition all shapes in the layer

**Example:**
```xml
<!-- Before: 60px gap (too small) -->
<mxCell id="2" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="200" height="60" as="geometry" />
</mxCell>
<mxCell id="3" vertex="1" parent="1">
  <mxGeometry x="300" y="40" width="200" height="60" as="geometry" />
</mxCell>
<!-- Gap: 300 - (40+200) = 60px -->

<!-- After: 100px gap -->
<mxCell id="2" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="200" height="60" as="geometry" />
</mxCell>
<mxCell id="3" vertex="1" parent="1">
  <mxGeometry x="340" y="40" width="200" height="60" as="geometry" />
</mxCell>
<!-- Gap: 340 - (40+200) = 100px -->
```

---

## R038 — Z-Order Violation

**What to look for:** Arrows render visually ON TOP of components when they should render behind them.

> **Authoritative Z-order spec**: See `references/rules.md` §Z-Order Convention for the complete
> rendering order definition. This section describes how to detect and fix violations only.

**How to identify:**
- In the exported PNG, check if any edge appears to pass OVER a shape (not through it — that's R031)
- draw.io renders cells in document (XML) order: lower `id` → lower in Z-order
- In practice: assign lower IDs to edges, higher IDs to vertices

**How to fix:**
1. Reorder `<mxCell>` elements in the XML: all edge cells first, then vertex cells
2. Renumber IDs so edges have lower IDs than the vertices they connect
3. Note: draw.io normally handles Z-order correctly — only fix if visually confirmed

**Example:**
```xml
<!-- Correct ordering: edges first (lower IDs), vertices after -->
<mxCell id="2" style="..." edge="1" parent="1" source="3" target="4">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
<mxCell id="3" value="Service A" vertex="1" parent="1">...</mxCell>
<mxCell id="4" value="Service B" vertex="1" parent="1">...</mxCell>
```

---

## R039 — Legend Overlap / Unreadable

**What to look for:** A legend that collides with diagram content or is too small to read.

**How to identify:**
- Legend box overlaps any diagram shape, edge, or label
- Legend font size < 10px (too small to read)
- Legend positioned outside the visible page area
- Legend has more than 8 entries (too dense)

**How to fix:**
1. Move legend to a corner with ≥ 40px margin from content and page edges
2. Typical placement: right side of the page (`x = pageWidth - legendWidth - 40`)
3. Ensure legend font size ≥ 11px
4. Legend box width ≥ 150px for typical 6–8 entries
5. Add legend as the last cell (highest ID) so it renders on top

**Example:**
```xml
<!-- Legend in top-right corner of a 1600px wide page -->
<mxCell id="20" value="Legend" style="swimlane;startSize=30;fillColor=#f5f5f5;strokeColor=#999999;fontSize=11;" vertex="1" parent="1">
  <mxGeometry x="1300" y="40" width="260" height="160" as="geometry" />
</mxCell>
<!-- Legend entries as child cells inside the legend swimlane -->
```

---

## Quick Reference: Fix Complexity

| Rule | Detection | Fix Complexity | Proactive Fix? |
|------|-----------|----------------|----------------|
| R030 | Visual | Easy (resize or reword) | Partially — estimate text width |
| R031 | Visual | Medium (add waypoints) | Partially — plan routing corridors |
| R032 | Visual | Easy (add label background) | **Yes** — always add `labelBackgroundColor` |
| R033 | Visual | Medium (offset paths) | Partially — distribute connection points |
| R034 | Visual | Easy (swap source/target) | Partially — verify flow direction |
| R035 | Visual + validate.py R021 | Easy (set to 0.5) | **Yes** — always center connections |
| R036 | Visual | Trivial (add style token) | **Yes** — always add `labelBackgroundColor` |
| R037 | Visual + validate.py spacing | Medium (reposition) | Partially — use spacing presets |
| R038 | Visual | Medium (reorder IDs) | **Yes** — edges first, vertices after |
| R039 | Visual | Easy (reposition legend) | Partially — place legend at end |

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| Arrow crosses component | Edge passes through unrelated shape interior | Add waypoints to route around (R031) |
| Label overlaps component | Edge label sits on top of a shape | Add `labelBackgroundColor` to edge (R032/R036) |
| Components too close | Visual gap < 80px between components | Increase spacing to ≥ 80px (R037) |
| Arrow connects to corner | Connection point too close to shape corner | Use `exitX=0.5` / center connections (R035) |
| No Z-order planning | Edges render on top of components | Place edges before vertices in XML (R038) |
