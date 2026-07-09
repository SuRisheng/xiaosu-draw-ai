# Dense Diagram Simplification（稠密图简化 / 传递规约）

> **When to read:** The diagram has 15+ nodes or the user says "too cluttered" / "太乱了".
> Apply these simplification strategies before generating, or as a revision step after visual self-check.

---

## Detection Thresholds

| Metric | Threshold | Simplification Trigger |
|--------|-----------|----------------------|
| Node count | ≥ 15 | Consider grouping or splitting |
| Edge count | ≥ 20 | Consider bundling or hiding |
| Nodes per layer | ≥ 7 | Split layer or group siblings |
| Edge crossings (R012) | ≥ 5 | Reroute or simplify topology |
| Page fill ratio | ≥ 80% | Expand canvas or split pages |

---

## Strategy 1: Merge Equivalent Siblings

When 3+ nodes of the same type/role sit at the same layer, merge them:

**Before (7 nodes):**
```
Web App 1, Web App 2, Web App 3 → individual server nodes
```

**After (1 node):**
```
Web App Cluster (×3) + annotation: "3× Node.js, port 3000"
```

**How to apply:**
- Replace N identical nodes with 1 node labeled `<name> Cluster (×N)`
- Add a subtitle line listing the instances
- Keep edges — they all connect to the cluster node

---

## Strategy 2: Split into Sub-Diagrams

When a single diagram tries to show too many levels of detail:

| Split Criterion | Result |
|----------------|--------|
| 3+ swimlane containers | Extract each container to its own page |
| 2+ distinct subsystems | One diagram per subsystem + 1 overview |
| C4 multi-level | C1 (context) → C2 (container) → C3 (component) as separate pages |

**How to apply:**
- Create a multi-page `.drawio` with `<diagram name="Overview" id="page-1">`, `<diagram name="Details" id="page-2">`, etc.
- The overview page has high-level system boxes with notes "see page 2 for details"

---

## Strategy 3: Containerization

Flat nodes at the same layer should be grouped into a swimlane container:

**Before (flat):**
```
User Service, Order Service, Product Service, Payment Service — all root-level nodes
```

**After (contained):**
```
┌── Business Services ──────────────┐
│ User  │ Order │ Product │ Payment │
└───────────────────────────────────┘
```

**How to apply:**
- Add a swimlane container node at the layer above
- Set the child nodes' `parent` attribute to the container's `id`
- Adjust child coordinates: they become relative to the container's top-left

---

## Strategy 4: Edge Bundling

When multiple edges go between the same layers in the same direction:

**Before:**
```
A→C, B→C, A→D, B→D — 4 separate edges with waypoints
```

**After:**
```
A─┐
  ├→ C
B─┘

A─┐
  ├→ D
B─┘
```

**How to apply:**
- Route edges to a shared junction point before splitting to targets
- Use `distributeParallelEdges()` from `scripts/router.js` for the shared segment
- Merge edge labels: 2+ edges → combined label or legend reference

---

## Strategy 5: Expand Canvas

When content exceeds page boundaries:

| Page Size | Max Nodes (approx) | When to Upgrade |
|-----------|-------------------|-----------------|
| 1200×900 | 10–12 | Default |
| 1600×1200 | 15–20 | > 12 nodes or > 4 layers |
| 2000×1600 | 25–30 | Complex architecture, 5+ layers |
| Multi-page | 30+ | Split by subsystem |

**How to apply:**
- Change `pageWidth` and `pageHeight` attributes in `<mxGraphModel>`
- Increase spacing proportionally (not just cram more nodes in)

---

## Simplification Decision Flow

```
Diagram has ≥ 15 nodes?
  │
  ├─ Are 3+ nodes identical type/role at same layer?
  │   └─ → Strategy 1: Merge them
  │
  ├─ Are there 3+ swimlane containers or subsystems?
  │   └─ → Strategy 2: Split into sub-diagrams
  │
  ├─ Are > 50% of nodes at root level (parent=1)?
  │   └─ → Strategy 3: Containerize
  │
  ├─ Do 4+ edges share similar source-target paths?
  │   └─ → Strategy 4: Bundle edges
  │
  └─ Is page fill ratio > 80%?
      └─ → Strategy 5: Expand canvas
```

---

## Cross-Reference

- **Edge routing**: `scripts/router.js` — `route()` for obstacle avoidance, `distributeParallelEdges()` for bundling
- **Spacing rules**: `references/rules.md` — R013 (connected spacing), R037 (component spacing)
- **C4 levels**: `references/diagram-types.md` §7 — per-level constraints
- **Visual audit**: `references/visual-audit.md` — R033 (stacked edges), R039 (legend overlap)
