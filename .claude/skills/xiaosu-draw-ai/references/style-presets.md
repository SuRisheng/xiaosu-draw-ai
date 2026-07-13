# Style Presets System

> JSON schema and application rules for the 7 visual styles. Defines how styles are
> selected, applied, and validated — both programmatically (Pipeline A/B) and manually
> (Pipeline C AI hand-write).
>
> **When to read:** When implementing style application logic, building a style-aware
> generator, or understanding how style tokens map to draw.io XML attributes.

---

## Architecture

```
User Input                    Style Preset                 draw.io XML
     │                             │                            │
     ▼                             ▼                            ▼
┌──────────┐   select    ┌──────────────────┐   apply    ┌──────────────┐
│ Trigger  │ ──────────→ │  Style Preset    │ ─────────→ │  mxCell      │
│ keywords │             │  (JSON schema)   │            │  style attr  │
│ or --style│            │                  │            │              │
└──────────┘             └──────────────────┘            └──────────────┘
     │                          │
     │                   ┌──────┴──────┐
     │                   │  Validation │
     │                   │  - required │
     │                   │  - conflicts│
     │                   └─────────────┘
     │
     ▼
┌──────────┐
│ Default  │ ← style-1 (Flat Icon) when nothing specified
└──────────┘
```

---

## Style Registry

### JSON Schema (per style file)

Each style file SHOULD be representable as this JSON structure for programmatic access:

```json
{
  "$schema": "https://xiaosu-draw-ai/schemas/style-preset-v1.json",
  "id": "style-1-flat-icon",
  "name": "Flat Icon",
  "version": "1.0.0",
  "category": "light",
  "order": 1,
  "default": true,
  "meta": {
    "background": "#FFFFFF",
    "primary_hue": "blue (#dae8fc / #6c8ebf)",
    "design_principle": "Clean, approachable, enterprise-ready",
    "best_for": ["architecture", "er", "flowchart", "general-purpose"],
    "corner_radius": "rounded=1"
  },
  "canvas": {
    "background": "#FFFFFF",
    "grid": true,
    "gridSize": 10,
    "shadow": false
  },
  "tokens": [
    {
      "id": "primary",
      "fillColor": "#dae8fc",
      "strokeColor": "#6c8ebf",
      "fontColor": "#333333",
      "usage": "Services, application components, main entities"
    },
    {
      "id": "success",
      "fillColor": "#d5e8d4",
      "strokeColor": "#82b366",
      "fontColor": "#333333",
      "usage": "Databases, positive states, completion nodes"
    },
    {
      "id": "warning",
      "fillColor": "#fff2cc",
      "strokeColor": "#d6b656",
      "fontColor": "#333333",
      "usage": "Message queues, async components, caution states"
    },
    {
      "id": "accent",
      "fillColor": "#ffe6cc",
      "strokeColor": "#d79b00",
      "fontColor": "#333333",
      "usage": "API gateways, load balancers, proxies"
    },
    {
      "id": "danger",
      "fillColor": "#f8cecc",
      "strokeColor": "#b85450",
      "fontColor": "#333333",
      "usage": "Security, authentication, error paths, firewalls"
    },
    {
      "id": "neutral",
      "fillColor": "#f5f5f5",
      "strokeColor": "#666666",
      "fontColor": "#333333",
      "usage": "External systems, third-party services"
    },
    {
      "id": "secondary",
      "fillColor": "#e1d5e7",
      "strokeColor": "#9673a6",
      "fontColor": "#333333",
      "usage": "Config, CI/CD, infrastructure, monitoring"
    },
    {
      "id": "edge-default",
      "fillColor": null,
      "strokeColor": "#555555",
      "fontColor": "#555555",
      "usage": "Default edge stroke color"
    }
  ],
  "typography": {
    "default": { "fontFamily": "Helvetica", "fontSize": 12, "fontStyle": 0 },
    "title": { "fontFamily": "Helvetica", "fontSize": 14, "fontStyle": 1 },
    "sub_component": { "fontFamily": "Helvetica", "fontSize": 11, "fontStyle": 0 },
    "edge_label": { "fontFamily": "Helvetica", "fontSize": 10, "fontStyle": 0 },
    "caption": { "fontFamily": "Helvetica", "fontSize": 9, "fontStyle": 0 },
    "code": { "fontFamily": "Courier New", "fontSize": 11, "fontStyle": 0 }
  },
  "shapes": {
    "service": "rounded=1;whiteSpace=wrap;html=1;",
    "database": "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;",
    "decision": "rhombus;whiteSpace=wrap;html=1;",
    "start_end": "ellipse;whiteSpace=wrap;html=1;",
    "io": "shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;",
    "hexagon": "shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;",
    "cloud": "ellipse;shape=cloud;whiteSpace=wrap;html=1;",
    "document": "shape=document;whiteSpace=wrap;html=1;boundedLbl=1;",
    "actor": "shape=actor;whiteSpace=wrap;html=1;",
    "swimlane": "swimlane;startSize=30;",
    "group_boundary": "rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;strokeColor=#999999;"
  },
  "edges": {
    "orthogonal": "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;",
    "straight": "edgeStyle=none;rounded=0;html=1;",
    "curved": "edgeStyle=orthogonalEdgeStyle;curved=1;html=1;",
    "dashed": "dashed=1;dashPattern=8 4;",
    "solid_arrow": "endArrow=classic;endFill=1;",
    "open_arrow": "endArrow=open;endFill=0;",
    "label_bg": "labelBackgroundColor=#FFFFFF;"
  },
  "spacing": {
    "component_to_component": 80,
    "layer_to_layer": 120,
    "same_row_horizontal": 100,
    "page_margin": 40,
    "grid_snap": 10
  },
  "vertex_assembly": "<shape-prefix>;fillColor=<token-fill>;strokeColor=<token-stroke>;<typography>",
  "edge_assembly": "<edge-type>;<arrow-type>;strokeColor=#555555;fontFamily=Helvetica;fontSize=10;labelBackgroundColor=#FFFFFF;"
}
```

### Style Registry Index

| ID | Name | Category | File | Default |
|----|------|----------|------|---------|
| `flat-icon` | Flat Icon | light | `styles/built-in/flat-icon.json` | ✅ |
| `dark-terminal` | Dark Terminal | dark | `styles/built-in/dark-terminal.json` | — |
| `blueprint` | Blueprint | dark | `styles/built-in/blueprint.json` | — |
| `notion-clean` | Notion Clean | light | `styles/built-in/notion-clean.json` | — |
| `glassmorphism` | Glassmorphism | dark | `styles/built-in/glassmorphism.json` | — |
| `claude-official` | Claude Official | warm | `styles/built-in/claude-official.json` | — |
| `openai` | OpenAI | light | `styles/built-in/openai.json` | — |

---

## Style ↔ Diagram Type Compatibility Matrix

| Diagram Type | 1:Flat | 2:Dark | 3:Blueprint | 4:Notion | 5:Glass | 6:Claude | 7:OpenAI |
|-------------|--------|--------|-------------|----------|---------|----------|----------|
| Architecture | ✅ ★ | ✅ | ✅ | ✅ | ✅ | ✅ ★ | ✅ |
| Sequence | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ ★ |
| ER | ✅ ★ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Flowchart | ✅ ★ | ✅ | ✅ | ✅ ★ | ⚠️ | ✅ | ✅ |
| Deployment | ✅ | ✅ ★ | ✅ ★ | ✅ | ✅ | ✅ | ✅ |
| Class (UML) | ✅ | ✅ | ✅ ★ | ✅ | ⚠️ | ✅ | ✅ ★ |
| C4 | ✅ | ❌ | ✅ ★ | ✅ | ❌ | ✅ ★ | ✅ |
| State Machine | ✅ | ✅ | ✅ | ✅ ★ | ⚠️ | ✅ | ✅ |
| Network | ✅ | ✅ ★ | ✅ ★ | ✅ | ❌ | ✅ | ✅ |
| Data Flow | ✅ | ✅ ★ | ✅ | ✅ | ✅ | ✅ | ✅ ★ |

> ✅ = compatible | ★ = recommended | ⚠️ = usable with caution | ❌ = not recommended

---

## Style Selection Logic

### Priority Order

```
1. User explicit style request (keywords or --style=N)
     │
2. Diagram type preference (from compatibility matrix ★ recommendations)
     │
3. User environment / context cues
     │   "dark mode" preference → dark category styles
     │   "presentation" context → Glassmorphism or Claude Official
     │   "documentation" context → Notion Clean or OpenAI
     │
4. Default: style-1-flat-icon (always available)
```

### Trigger Keywords (minimum set)

| Category | Keywords | Default Style |
|----------|----------|---------------|
| Dark | "dark", "dark mode", "terminal", "night" | style-2 (Dark Terminal) |
| Blueprint | "blueprint", "engineering", "technical drawing" | style-3 (Blueprint) |
| Clean | "clean", "minimal", "notion", "simple", "minimalist" | style-4 (Notion Clean) |
| Glass | "glass", "frosted", "modern", "futuristic" | style-5 (Glassmorphism) |
| Claude | "claude style", "warm", "professional", "friendly" | style-6 (Claude Official) |
| OpenAI | "openai style", "spartan", "ultra-clean" | style-7 (OpenAI) |

---

## Application Rules

### Rule A1: Token Resolution

When generating XML, for each component:
1. Determine the component's **semantic role** (primary, success, warning, accent, danger, neutral, secondary)
2. Look up the role in the style's **tokens** table
3. If the style has function-based tokens (e.g., style-6: input-source, agent-process), map semantic roles to function tokens:
   - `primary` → `agent-process` (services, logic)
   - `accent` → `input-source` (gateways, entry points)
   - `success` → `storage-state` (databases, caches)
   - `neutral` → `external` (external systems)
   - `secondary` → `infrastructure` (CI/CD, config)
4. Use `fillColor`, `strokeColor`, `fontColor` from the resolved token

### Rule A2: Typography Resolution

Apply the style's typography table:
- Node labels → `default` or `title` size (depending on importance)
- Edge labels → `edge_label` size
- Technical details → `sub_component` or `code` size
- Captions → `caption` size

### Rule A3: Edge Assembly

1. Determine edge routing: orthogonal (default), straight, or curved
2. Determine arrow type: solid (data flow), open (association), or none (bidirectional hint)
3. Add dashed pattern if async/secondary flow
4. Add `labelBackgroundColor` matching canvas background if edge has label text

### Rule A4: Spacing Baseline

All styles inherit the global spacing constants from `references/rules.md`:
- Component-to-component: ≥ 80px
- Layer-to-layer: ≥ 120px
- Same-row horizontal: 100–120px
- Page margin: ≥ 40px
- Grid snap: 10px

Individual styles MAY tighten (but never loosen) these minimums.

---

## Lookup Tables (Quick Reference)

These tables are the primary reference during XML generation. Use them to resolve every style token without guessing.

### Role → Palette Resolution

For each semantic role, look up the matching palette slot in the selected style preset:

| Semantic Role | Palette Slot | Typical Use |
|---------------|-------------|-------------|
| Service / Application | `primary` | Microservices, app logic, web servers |
| Database / Storage | `success` | MySQL, PostgreSQL, caches, data stores |
| Message Queue / Async | `warning` | RabbitMQ, Kafka, background jobs |
| Gateway / LB / Proxy | `accent` | API Gateway, Load Balancer, reverse proxy |
| Security / Auth | `danger` | Firewall, WAF, auth service |
| External / Third-party | `neutral` | External APIs, SaaS, legacy systems |
| Config / Infra / CI/CD | `secondary` | Monitoring, config, build pipelines |

**Resolution**: `palette[slot].fillColor` + `palette[slot].strokeColor` → apply to vertex.

### Edge Kind → Edge Style

Map semantic edge kinds to the style preset's edge tokens and arrow type:

| Edge Kind | Arrow | Dashed? | From Style Preset |
|-----------|-------|---------|-------------------|
| `primary` — main flow / sync call | `edges.arrow` (default: `endArrow=block;endFill=1;strokeWidth=2`) | No | Use primary palette stroke color |
| `async` — async message / event | `edges.arrow` | Yes (`dashed=1;dashPattern=8 4`) | Use neutral palette stroke color |
| `memoryRead` — cache read | `edges.arrow` | No | Use success palette stroke color |
| `memoryWrite` — cache write | `edges.arrow` | Yes (`dashed=1;dashPattern=8 4`) | Use success palette stroke color |
| `control` — branch / transition | `edges.arrow` + `orthogonalLoop=1` | No | Use primary palette stroke color |
| `feedback` — response / rollback | `endArrow=open;endFill=0` | Yes (`dashed=1;dashPattern=8 4`) | Use warning palette stroke color |
| `neutral` — weak dependency | `endArrow=open;endFill=0;strokeWidth=1` | No | Use neutral palette stroke color |

**Resolution**: `edges.style` + arrow tokens + dashed flag + palette stroke color → apply to edge.

### Vertex Style Assembly Formula

```
<shapes[kind]>;fillColor=<palette[slot].fillColor>;strokeColor=<palette[slot].strokeColor>;fontFamily=<font.fontFamily>;fontSize=<font.fontSize>;fontColor=<palette[slot].fontColor or extras.fontColor>;
```

Example (Flat Icon, role=primary, shape=service):
```
rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontFamily=Helvetica;fontSize=12;
```

**Effects in shape definitions:** Some styles (e.g., Glassmorphism) include effect parameters directly in `shapes.<kind>` — `opacity`, `shadow`, `glass`, `strokeWidth`, `gradientColor`. These are NOT overridden by palette colors; they pass through the assembly formula unchanged because the formula prepends the shape string verbatim. The resulting style string is:

```
<shape-prefix-with-effects>;fillColor=...;strokeColor=...;fontFamily=...;fontSize=...;fontColor=...;
```

**Container assembly (swimlanes):** When `shapes.container` already contains `fillColor` and `strokeColor` (as in Glassmorphism where the container needs gradient + opacity), do NOT override with palette values. Use the container shape definition as-is, appending only font properties:
```
<shapes.container>;fontFamily=<font.fontFamily>;fontSize=<font.fontSize>;fontColor=<extras.fontColor>;
```

**Glassmorphism assembly example (service node):**
```
rounded=1;whiteSpace=wrap;html=1;opacity=40;shadow=1;glass=1;strokeWidth=1.5;fillColor=#1a2332;strokeColor=#58a6ff;fontFamily=Helvetica;fontSize=14;fontColor=#f0f6fc;
```
↑ The `opacity=40;shadow=1;glass=1;strokeWidth=1.5` comes from `shapes.service`, the colors from `palette.primary`, the font from `font`. The draw.io renderer reads `opacity` for translucency, `shadow` for depth, `glass` for the specular highlight overlay, and `strokeWidth=1.5` for the glowing border.

### Edge Style Assembly Formula

```
<edges.style>;<edges.arrow>;strokeColor=<edgeColor>;fontFamily=<font.fontFamily>;fontSize=10;labelBackgroundColor=<extras.background or #FFFFFF>;
```

Example (Flat Icon, primary edge):
```
edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#6c8ebf;fontFamily=Helvetica;fontSize=10;labelBackgroundColor=#FFFFFF;
```

### Style Completeness Checklist

When applying a style, verify the following are all defined:
- [ ] Canvas background color
- [ ] At least 5 semantic color tokens (or function-based equivalents)
- [ ] Edge stroke color
- [ ] Typography for: default, title, edge label
- [ ] Shape prefix for: service, database, decision
- [ ] Edge prefix for: orthogonal, dashed, solid arrow

If any field is missing, fall back to style-1 (Flat Icon) for that field only.

---

## Programmatic API (Planned)

### `styleResolver.js` (Pipeline A/B only)

```javascript
/**
 * styleResolver.js — Resolve and apply style presets to IR-based diagrams.
 *
 * Usage:
 *   const resolver = require('./styleResolver.js');
 *   const preset = resolver.resolve('style-3-blueprint');
 *   const nodeStyle = resolver.applyVertex(preset, { role: 'primary', shape: 'service' });
 *   // → "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;..."
 */

function resolve(styleId) {
  // Look up style in registry, load JSON schema, return preset object
}

function applyVertex(preset, options) {
  // options.role → token resolution → color values
  // options.shape → shape prefix
  // Assemble: <shape-prefix>;fillColor=<token.fill>;strokeColor=<token.stroke>;<typography>
}

function applyEdge(preset, options) {
  // options.type → edge prefix (orthogonal/straight/curved)
  // options.arrow → arrow style (solid/open/none)
  // options.dashed → bool
  // Assemble: <edge-type>;<arrow-type>;strokeColor=<edge.stroke>;<typography>;labelBackgroundColor=<canvas.bg>;
}

function validatePreset(preset) {
  // Check Rule A5 completeness
  // Return { valid: bool, missing: string[] }
}
```

---

## Style ↔ Diagram Type Merge Rules

When a user selects both a diagram type and a style preset, merge them systematically. These rules prevent conflicts and define precedence.

### Merge Priority

1. **User explicit overrides** (e.g., "make this node red") > everything
2. **Diagram type shape requirements** (e.g., hexagon for firewalls) > style defaults
3. **Style palette colors** > diagram type generic colors
4. **Style typography** (fontFamily, fontSize) > diagram type defaults
5. **Style edge routing** (orthogonal vs straight) > diagram type generic edges

### Conflict Resolution Table

| Conflict | Resolution | Example |
|----------|-----------|---------|
| Style says "blue services" but deployment diagram says "WAF = red" | Diagram type role mapping wins for security nodes | WAF uses `danger` slot from style palette, not `primary` |
| Style uses straight edges but class diagram requires orthogonal | Diagram type wins for edge routing | Class diagram keeps `edgeStyle=orthogonalEdgeStyle` |
| Style has `rounded=0` but architecture template says `rounded=1` | Style wins for corner radius | Architecture nodes get style's corner radius |
| Style typography conflicts with diagram type title format | Style wins for fontFamily/fontSize | Title uses style's `titleFontSize` and `fontFamily` |
| User says "dark mode" + "flowchart" | Style palette is applied to flowchart shape tokens | Decision diamonds get style warning slot color |

### Merge Process (per node)

```
1. Determine node kind from diagram-type template (service / database / gateway / ...)
2. Map node kind → semantic role using diagram-type's role assignment
3. Resolve role → palette slot using style's roles mapping
4. Get shape token from diagram-type template (shape=cylinder3, etc.)
5. Get fillColor/strokeColor from style palette[slot]
6. Get fontFamily/fontSize from style typography
7. Assemble: <shape-token>;<color-tokens>;<font-tokens>;
```

### Merge Process (per edge)

```
1. Determine edge kind from relationship (primary / async / inheritance / ...)
2. Get base edge style from diagram-type template
3. Get arrow tokens from diagram-type's arrow semantics
4. Get strokeColor from style's edge color or palette
5. Get labelBackgroundColor from style's background color
6. Assemble: <edge-style>;<arrow-tokens>;strokeColor=...;labelBackgroundColor=...;
```

### Diagram Type Role Mapping Reference

Each diagram type assigns semantic roles to node kinds. When merging with a style, use this mapping to resolve palette slots:

| Diagram Type | service | database | queue | gateway | security | external |
|-------------|---------|----------|-------|---------|----------|----------|
| architecture | primary | success | warning | accent | danger | neutral |
| deployment | primary | success | warning | accent | danger | neutral |
| flowchart | primary | — | — | — | danger | — |
| c4 | primary (C3:accent) | success | — | — | — | neutral |
| er | primary → success (cycle) | primary → success (cycle) | — | — | — | — |
| network | primary | success | — | accent | danger | neutral |
| sequence | primary | success | — | accent | — | neutral |
| class | primary → success → secondary (cycle) | — | — | — | — | — |
| state-machine | primary | success | — | — | danger | — |
| data-flow | primary | success | — | — | danger | neutral |

> **Cycle**: For diagrams with many nodes of the same kind (ER entities, UML classes), cycle through palette slots (primary → success → secondary → warning → accent) to visually distinguish them.

---

## Style Versioning

Each style file is versioned independently:

```
styles/built-in/flat-icon.json       v1
styles/built-in/dark-terminal.json   v1
...
```

When a style token changes:
1. Increment the style file's internal version note
2. Run golden regression tests to detect visual regressions
3. Update `scores.json` baseline if the change is intentional

---

## Cross-Reference

- **Style files:** `styles/built-in/`N-*.md` — detailed per-style documentation
- **Diagram types:** `references/diagram-types.md` — type-specific shape/color/layout presets
- **Rules:** `references/rules.md` — P0-P3 quality rules that all styles must satisfy
- **Visual audit:** `references/visual-audit.md` — how to visually verify style application
