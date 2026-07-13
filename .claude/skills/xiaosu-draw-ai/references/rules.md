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
| **R006** | **Invented edge (no user-described relationship)**: An edge connects two modules that the user did NOT describe as having a relationship. When the user lists components ("X contains A, B, C" or "the system has X, Y, Z") without specifying which modules connect to which, do NOT add edges between individual modules. Only draw edges for relationships the user explicitly stated or that are unambiguously structural (e.g., a 3-tier architecture where the user says "frontend → backend → database"). Container-level relationships (User → App system, App → Cloud) are acceptable when the user describes the parts as composing a system. | `[AI 检测]` | No |
| **R007** | **CLI not found — install first, fall back only if declined (R042)**: Detect via `drawio --version` or `draw.io --version` or known install paths (`C:\Program Files\draw.io\` on Windows, `/Applications/draw.io.app/` on macOS). Only report "not found" if all checks fail. Then offer: Windows: `winget install JGraph.Draw` or drawio.com; macOS: `brew install --cask drawio`; Linux: `snap install drawio`. If declined → XML-only mode. | `[AI 检测]` | No |
| **R008** | **Node.js missing — offer install, continue with degraded export (R043)**: When `node --version` fails, offer: Windows: `winget install OpenJS.NodeJS.LTS`; macOS/Linux: `brew install node` or nvm; all: nodejs.org. If declined: `export.js`, `mermaid-convert.js`, and `build.js` are unavailable. | `[AI 检测]` | No |
| **R009** | **Python 3 missing — offer install, continue without validation (R044)**: When both `python3 --version` and `python --version` fail, offer: Windows: `winget install Python.Python.3.13`; macOS: `brew install python3`; Linux: `sudo apt install python3`; all: python.org. If declined: `validate.py` is unavailable — no structural lint. | `[AI 检测]` | No |

---

## P1 — Must Fix (Exit Code 1)

Rules that indicate layout or quality defects. **Fix and re-run validation.**

| ID | Description | Detection | Auto-fix? |
|----|-------------|-----------|-----------|
| **R010** | **Overlapping siblings**: Two leaf-node vertices (same parent) have bounding boxes that overlap with less than **8px** safety margin. | `[validate.py]` | No |
| **R011** | **Edge through vertex**: A waypointed edge's line segment passes through the bounding box of a vertex that is neither its source nor target. Excludes swimlane containers (visual boundaries) and nodes nested inside containers (e.g., ER entity fields, service sub-components). Uses absolute (parent-resolved) coordinates. | `[validate.py]` | No |
| **R012** | **Edge crossing**: Two waypointed edges have line segments that cross each other. | `[validate.py]` | No |
| **R013** | **Insufficient spacing — connected**: Edge-connected node pair has center-to-center distance < minimum for their layout direction. | `[validate.py]` | No |
| **R014** | **Off-canvas**: Any vertex has `x < 0` or `y < 0` coordinates. | `[validate.py]` | No |
| **R015** | **Self-closing edge**: An edge `mxCell` lacks a child `<mxGeometry>` element (uses self-closing tag). Edges must have expanded `<mxGeometry relative="1" as="geometry"/>`. | `[validate.py]` | No |
| **R016** | **Waypoint-entry misalignment**: A waypoint used for an L-shaped orthogonal edge must share the same x-coordinate (vertical entry) or y-coordinate (horizontal entry) as the target's entry point, within ±0px tolerance. Use entryX/entryY values that produce integer entry coordinates (e.g., entryX=0.3 on w=110 → entry_x = x + 33, an integer). When the final waypoint and entry point are misaligned, the orthogonal router creates a short perpendicular stub segment, rotating the arrow head sideways. Fix: align the last waypoint to `target.x + target.w × entryX` (or y to `target.y + target.h × entryY`). | `[validate.py]` | No |
| **R017** | **Routing corridor uniqueness (ALL diagram types)**: When multiple edges share a routing corridor (a vertical or horizontal path segment used by ≥2 edges in the same region), assign each edge a UNIQUE offset lane spaced ≥ **15px** apart. The corridor can be: inter-layer gaps in architecture/deployment/C4, the space between flow branches in flowcharts, the pipe routing zone in DFDs, or cross-zone paths in network diagrams. No two edges may share the same x-coordinate (vertical corridor) or y-coordinate (horizontal corridor) when their ranges overlap. For inter-layer gaps (≥120px): accommodates up to 6 edges (120÷18≈6). For side corridors (≥80px): accommodates up to 4 edges (80÷18≈4). See also R033 (stacked edges), R045 (multi-edge distribution). | `[AI 检测]` | No |
| **R047** | **Waypoint-entry/exit axis alignment (ALL diagram types)**: The last waypoint and the entry point MUST share the same axis coordinate for a clean final segment. If entering from LEFT/RIGHT (horizontal entry), last waypoint y MUST equal entry y. If entering from TOP/BOTTOM (vertical entry), last waypoint x MUST equal entry x. Same rule for exits: first waypoint MUST share the exit axis. Failure causes diagonal stub segments that rotate the arrow head sideways or make the edge appear to exit/enter from inside the node border. Check: for entryX=0/1 → ensure `wp_last.y == target.y + target.h * entryY`. For entryY=0/1 → ensure `wp_last.x == target.x + target.w * entryX`. For exitX=0/1 → ensure `wp_first.y == source.y + source.h * exitY`. For exitY=0/1 → ensure `wp_first.x == source.x + source.w * exitX`. Example (deployment): LB→WS2 enters WS2 right edge — last wp y=395 matches entryY=0.5 at y=370+50*0.5=395. Edge 22: WS1→FW2 enters FW2 left — last wp y=110 matches entryY=0.5 at y=80+60*0.5=110. Without this alignment the orthogonal router creates a short perpendicular stub, rotating the arrow head and visually connecting to the wrong border side. | `[AI 检测]` | No |
| **R045** | **Multi-edge source/target distribution (ALL diagram types)**: When N≥2 edges exit from the SAME source node in the same direction, distribute exit points across the available edge face with ≥**15px** separation at the routing point. For bottom-exits: use `exitX=0.3` / `exitX=0.7` (2 edges) or `exitX=0.2;0.5;0.8` (3 edges). For side-exits: use `exitY=0.25;0.75` (2 edges) or `exitY=0.2;0.5;0.8` (3 edges). Same rule applies when N≥2 edges ENTER the same target: distribute `entryX`/`entryY` values. Each edge must then route through its OWN corridor lane (see R017). If waypoints are used, the first waypoint after the source must be ≥10px from the exit face. Example (data-flow): two error edges both exit right from Validate and Transform — each uses a distinct routing corridor (x=670 vs x=685). Example (deployment): LB→WS1 and LB→WS2 distribute with separate vertical corridors (x=530 vs x=545). Example (architecture): Gateway→3 services uses exitX=0.2/0.5/0.8. | `[AI 检测]` | No |
| **R046** | **Edge-to-node minimum clearance (ALL diagram types)**: Every edge segment MUST maintain ≥**15px** minimum clearance from the bounding box of any node that is NEITHER its source NOR its target. This prevents edges from skimming too close to or visually overlapping unrelated shapes. When the direct path from source to target would violate this (e.g., a center-column node sits between source and target), the edge MUST be routed around the blocking node using waypoints. Go through an available side corridor (left/right of the center column) rather than through node interiors. **Every waypoint that precedes an entry MUST be OUTSIDE the target's bounding box**: if entering from RIGHT (entryX=1), last waypoint x must be > target right edge. If entering from LEFT (entryX=0), last waypoint x must be < target left edge. If entering from TOP (entryY=0), last waypoint y must be < target top. If entering from BOTTOM (entryY=1), last waypoint y must be > target bottom. Same rule for exits: first waypoint must be outside the source in the exit direction. This ensures the final/initial visible segment approaches from outside the node, never from within its interior. Example (flowchart): error return edges (Show Error→End) route through the RIGHT corridor (x=780/795) instead of going directly left through main flow nodes. Example (data-flow): error edges (Validate→Error Log) exit RIGHT then route through corridor x=670, entering ErrorLog from RIGHT with last wp x=670 > right edge x=630. Example (data-flow): DW→Analytics exits DW RIGHT (exitX=1, first wp x=975 > right edge x=930) and enters Analytics LEFT (entryX=0, last wp x=975 < left edge x=1000). This rule complements R011 (edge-through-vertex, which detects edges actually crossing node interiors). | `[AI 检测]` | No |
| **R048** | **Swimlane child positioning — no header overlap**: Every child vertex inside a swimlane container MUST be positioned at `y ≥ startSize + 10` (≥ 10px below the header bottom edge). `startSize` is the swimlane's header height (typically 30px), so minimum child `y ≥ 40`. This prevents children from visually overlapping the swimlane title text. The swimlane's total height formula is: `h = startSize + max(child_y + child_h) + margin_bottom`, where margin_bottom ∈ [10, 15]. When a swimlane is too short for its children, increase `h` — do NOT reduce child_y below the threshold. Example: swimlane with startSize=30, child at y=40 (10px below header), child_h=50 → minimum swimlane h = 30 + 40 + 50 + 10 = 130. Violation = P1. | `[AI 检测]` | No |
| **R049** | **Direct path priority before waypoints**: For every edge, FIRST attempt a 0-waypoint direct path: same-column (source.bottom → target.top, vertical) or same-row (source.right → target.left, horizontal). Only introduce waypoints when the direct path is geometrically impossible OR would violate R046 (pass through unrelated nodes) OR would overlap another edge per R017. When waypoints ARE needed, choose the SHORTEST available routing corridor — not the most distant one. "Routing around" means: pick the nearest side corridor (left/right of a blocking center column) that has enough clearance. Example (network): Core Switch (y=410) → Workstations (y=550). Direct path = 140px vertical drop, no obstacles. Use 0-waypoint direct path (`exitY=1, entryY=0`). Do NOT route through distant corridors. | `[AI 检测]` | No |
| **R050** | **Path obstacle mandatory check before finalizing edge**: After determining the edge path (0, 1, or 2 waypoints), trace every segment of the path against the bounding boxes of ALL non-source/non-target nodes on the canvas (using absolute, parent-resolved coordinates). If any segment passes within ≤**15px** of a node's bounding box (horizontally or vertically), the path is INVALID and MUST be re-routed. The corrected path must go through a side corridor (left or right of the blocking node) with ≥15px clearance. This is a mechanical check, not a visual guess — calculate segment coordinates, compare against node bboxes. Example (flowchart): Notify Customer (x=550, right=700) → End (x=330, right=430). A direct downward path from x=625 passes through Create Backorder (x=560, right=700). Fix: route through RIGHT corridor (x=755, clearing Backorder right edge 700 by 55px). | `[AI 检测]` | No |
| **R051** | **Edge parent assignment**: Edge `parent` attribute MUST match the lowest common ancestor container of its source and target. If source and target are children of the same swimlane → `parent="<swimlane-id>"`. If source and target are in different swimlanes (or one is top-level) → `parent="1"`. Wrong parent assignment causes edges to use the wrong coordinate space, producing garbled routing. | `[AI 检测]` | No |

---

## P2 — Warning (Exit Code 0)

Rules that indicate suboptimal quality. **Recorded in validation output but do not block.**

| ID | Description | Detection |
|----|-------------|-----------|
| **R020** | **Off-grid geometry**: Vertex `x`, `y`, `width`, or `height` values are not multiples of **10px**. Suppressed when the off-grid vertex shares a center-x or center-y with a sibling (intentional centering, e.g., x=565 to align center with a node at x=560/w=130). | `[validate.py]` |
| **R021** | **Non-centered connection point**: `exitX`/`exitY`/`entryX`/`entryY` is not `0.5` (centered) and there is no visible multi-edge justification on that side. | `[validate.py]` |
| **R022** | **Arrow final segment too short**: The last line segment of a waypointed edge is less than **15px** long. | `[validate.py]` |
| **R023** | **Excessive edge waypoints**: An edge uses more than **2** waypoints when a simpler path (0–2 waypoints) would suffice. For cross-layer connections, the default should be: exit source → one horizontal routing point → enter target (max 2 bends). | `[AI 检测]` |
| **R041** | **Edge label-to-segment ratio**: When an edge label text pixel width exceeds **2/3** of the edge segment's pixel length, apply these mitigations in priority order: **(1) wrap** to multiple lines via `&amp;lt;br&amp;gt;`; **(2) reduce fontSize** by at most **2px** (e.g., Caption 10→8, but never below 8); **(3) shorten text**. Text width: CJK chars ≈ `fontSize` px each, Latin ≈ `fontSize × 0.6` px each. Segment length: straight-line pixel distance between source/target (or between waypoints for multi-segment edges). The 2/3 threshold gives visual breathing room. Also applies: when a label overlaps other elements, reposition along the edge using `<mxGeometry x="<offset>" relative="1">` — where `x` is the along-edge position (not diagram x-axis): `x ∈ [-1, 1]`, `0`=center, negative=toward source. For a vertical edge, `x` moves the label up/down. Perpendicular offset via `y` (pixels). See `references/xml-authoring.md` §Edge Label Positioning. | `[AI 检测]` |
| **R024** | **Single-connection node distance**: A node with exactly **one** edge should be placed adjacent to its peer (center-to-center ≤ **200px** along the dominant axis). If the user describes a standalone node connected to only one other component, position it close — not at the far edge of the canvas. | `[AI 检测]` |
| **R025** | **Connected node axis alignment**: Two nodes connected by a horizontal edge (exitX=1→entryX=0 or vice versa) must share the same y-center (≤ **10px** deviation). Two nodes connected by a vertical edge (exitY=1→entryY=0 or vice versa) must share the same x-center (≤ **10px** deviation). This ensures straight, clean edges without diagonal stair-stepping. | `[混合]` |
| **R026** | **Container width-to-content fit**: A swimlane or container's width should not exceed its widest row of children + margins by more than **200px**. Excessive whitespace (large empty areas on the right/bottom of containers) should be trimmed. | `[AI 检测]` |
| **R027** | **Proportional node sizing**: All nodes within the same diagram should be proportionally sized. Actor shapes should use `width=50~60, height=60~70` — comparable to service nodes at `w=140~160, h=50`. No single element should visually dominate others unless intentionally highlighted. | `[AI 检测]` |
| **R028** | **Container content centering**: Content inside a swimlane must be **horizontally and vertically centered**. Left and right margins must be equal (≤ **5px** deviation). Top and bottom margins (measured from header bottom to first item top, and last item bottom to swimlane bottom) should be equal (≤ **5px** deviation) and in the **10–20px** range where possible. | `[混合]` |
| **R029** | **Group horizontal axis symmetry**: All sibling elements in the same swimlane row must share the same **y-center** (≤ **5px** deviation). To achieve this, same-row elements MUST have the same height. If one element needs more space (e.g., two-line label), make ALL peers that height. Example: if App Store needs `h=70`, all 5 car-system nodes use `h=70`. | `[AI 检测]` |
| **R030** | **Element-to-container margin**: Every element must be **10–20px** from the nearest container edge (header bottom, container bottom, left, right). Swimlane height formula: `h = header + margin_top + max(item_height) + margin_bottom` where margin ∈ [10, 20]. | `[混合]` |
| **R031** | **Connected element gap = 80px**: Two elements connected by an edge must have an edge-to-edge gap of exactly **80px** along the connection axis. This gives edges enough visual length to be readable without being too long. | `[混合]` |
| **R032** | **Unconnected element gap 10–50px**: Adjacent elements in the same group that are NOT connected by an edge must have an edge-to-edge gap in **10–50px**. Elements should be visually grouped, not scattered. | `[混合]` |
| **R033** | **Internal padding 10–20px**: Every node must have internal text padding. Use `spacingLeft=15;spacingRight=15;spacingTop=15;spacingBottom=15;` in the style string. This ensures text doesn't touch node borders. | `[AI 检测]` |
| **R034** | **Text size hierarchy**: All text must use one of 4 predefined sizes: **H1**=18px bold (diagram title), **H2**=14px bold (swimlane/container headers), **Body**=13px (module labels), **Caption**=10px (descriptions, edge labels). Never use ad-hoc font sizes. | `[AI 检测]` |
| **R035** | **Content-first sizing**: Element dimensions MUST be derived from text content, not decided arbitrarily. Step 1: measure text pixel width (CJK ≈ fontSize, Latin ≈ fontSize×0.6). Step 2: add 15px spacing per side. Step 3: round to nearest 10 (min w=90, min h=50). Step 4: unify group heights per R029. Step 5: container size = children + gaps + margins. **Bold text**: multiply estimated width by 1.05. | `[AI 检测]` |
| **R036** | **Cross-swimlane column width unification**: All modules across vertically stacked swimlanes sharing the same column layout MUST use the same width — the global `max(w)` of ALL modules across ALL swimlanes. Steps: (1) compute text-derived width for every module per R035; (2) take `W = max(all_widths)`, round to nearest 10; (3) apply W to every module; (4) choose gap per R006: if modules are edge-connected → R031 (80px), otherwise → R032 (50px); (5) recalculate swimlane width: `swimlane_w = margin × 2 + N_cols × W + (N_cols-1) × gap`. This ensures columns align vertically, eliminates right-side whitespace, and uses correct spacing for the connection context. Exception: if `max(w)/min(w) > 1.5`, use per-swimlane `max(w)`. | `[AI 检测]` |
| **R037** | **Swimlane header text fit**: A swimlane's width MUST satisfy `w ≥ max(derived_from_children, header_text_px + 30)`. The +30 accounts for: 20px collapse icon + 10px safety margin against font metric variance across OS. Header overflow is a P0 defect. | `[混合]` |
| **R039** | **Stacked container dimension matching**: Vertically stacked containers (same column) MUST share the same **width** (`max(w)`). Side-by-side containers (same row) MUST share the same **height** (`max(h)`). Extra space is absorbed by the right/bottom margin. This gives architectural diagrams a clean, aligned silhouette. | `[AI 检测]` |
| **R038** | **Sub-item fill**: When a swimlane's width exceeds `Σ(children_max_w) + margins`, sub-items MUST fill proportionally: `item_w = max(text_derived_w, swimlane_w × 0.65)`. Then center: `x = (swimlane_w - item_w) / 2`. This prevents items from looking like lost islands in an oversized container. | `[AI 检测]` |
| **R040** | **Container-child color contrast**: A swimlane container's header `fillColor` must be perceptibly different from its children's `fillColor`. When both derive from the same palette role, the header MUST use a darker variant (e.g., `#B0C4DE` header vs `#DAE8FC` children). Use a very light `swimlaneFillColor` (near-white tint, e.g., `#EDF2FA`) to provide subtle visual grouping — the body fill should be light enough that edges passing through remain visible. If cross-layer edges pass through the swimlane body, use an even lighter tint or omit `swimlaneFillColor` to avoid Z-order occlusion. See `styles/built-in/<style>.json` `shapes.container`. | `[validate.py]` | No |

Rules that require visual judgment. Cannot be reliably automated; AI checks exported PNG.

> **Detailed audit guide:** See `references/visual-audit.md` for per-rule detection instructions,
> fix recipes, and XML before/after examples. The table below is a summary reference.

| ID | Description | Source |
|----|-------------|--------|
| **R030** | **Label truncation**: Text content visually overflows its shape boundary. | drawio-skill Step 5 |
| **R031** | **Edge-shape visual overlap**: An edge (especially without waypoints) visually crosses an unrelated shape's interior. | drawio-skill Step 5 |
| **R032** | **Edge-label overlap**: An edge label collides with other visual elements (nodes, other labels, connectors). | drawio-skill Step 5 |
| **R033** | **Stacked edges**: Multiple edges follow the same visual path (indistinguishable). **[Elevated to P2 — automated detection planned.]** Check if two edges share ≥ 20px of continuous overlapping segments (same coordinates within 5px tolerance). Fix: offset waypoints by 15–20px, or distribute connection points (`exitX=0.25/0.5/0.75`). See also R016 (waypoint alignment). | drawio-skill Step 5 + automated |
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
| Layer-to-layer gap (connected) | `max(80, 24 + N_edges × 18)` px, where N = cross-layer edge count | Architecture, deployment, flowchart — when edges cross between layers (R006) |
| Layer-to-layer gap (unconnected) | **10–50px** | Layers with no cross-layer edges (R006 → R032) |
| Same-row connected (R031) | **80px** edge-to-edge | Elements connected by an edge |
| Same-row unconnected (R032) | **50px** edge-to-edge | Elements without edges (default per R006) |
| Grid alignment | Snap to **10px** multiples | All coordinates (`x`, `y`, `width`, `height`) |
| Connection point corner clearance | ≥ **20px** from any corner | Edge connection points |
| Stagger parallel arrows | **15–20px** offset | Multiple edges between same layers |
| Canvas margin | ≥ **40px** from edges | viewBox / page boundaries |
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
| Routing corridor overlap (R017) | × 8 |
| No edge-node clearance (R046) | × 8 |
| Waypoint-entry misalignment (R047) | × 8 |
| Multi-edge overlap (R045) | × 5 |
| Overlapping siblings (R010) | × 5 |
| Off-grid geometry (R020) | × 1 |
| Non-centered connection point (R021) | × 2 |
| Short arrow segment (R022) | × 3 |

Lower score = better readability. Score of **0** = perfect.
