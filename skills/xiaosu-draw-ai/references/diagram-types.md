# Diagram Type Presets

> Type-specific shape, color, layout, and edge recommendations.
> AI consults this reference during SKILL.md Step 1 (Plan) and Step 2 (Generate XML).
>
> **When to read:** AI identifies the diagram type from the user's request, then reads the
> matching section below for presets. Do NOT pre-load entire file — load only the
> relevant type's section.
>
> **⚠️ Color priority**: The color tables below map component types to semantic roles.
> Actual hex values (fillColor/strokeColor) come from the selected style JSON
> (`styles/built-in/<name>.json` → `roles` → `palette`). Do NOT use the old hardcoded
> hex values from any source — they are flat-icon defaults only and will conflict
> with style switching. Shape modifiers (`rounded=`, corner radius) also come from
> the style JSON's `shapes` and `extras` fields.
>
> **This file defines WHAT role each component gets. Style JSONs define WHAT COLOR
> each role becomes.** Template files (`templates/`) define the user-facing constraints.

---

## Unified Lookup Tables

> **Quick reference.** For each diagram type section below, the constraints derive from these base tables. Consult this first, then the type-specific section for overrides.

### Node Kind → Shape Style Tokens

> These are **base shape tokens** (geometry + behavior). Style-level modifiers
> (`rounded=`, `fillColor`, `strokeColor`, `fontColor`) come from the selected
> style JSON's `shapes`, `palette`, and `extras` fields.
>
> **`rounded` specifically**: `rounded=1` or `rounded=0` is defined by the style
> JSON's `extras.cornerRadius` field and individual `shapes` entries. Diagram-type
> sections below list shapes WITHOUT `rounded=` — append it from the style JSON.
> Similarly, `fontColor` comes from `palette.*.fontColor` or `extras.fontColor`.

| Node Kind | Shape Token | Used By |
|-----------|------------|---------|
| `service` | `whiteSpace=wrap;html=1;` | architecture, deployment, network, c4, data-flow |
| `database` | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` | architecture, deployment, network, c4, er |
| `queue` | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` | architecture, deployment, data-flow |
| `gateway` | `rounded=1;whiteSpace=wrap;html=1;fontStyle=1;` | architecture, deployment, sequence |
| `decision` | `rhombus;whiteSpace=wrap;html=1;` | flowchart, state-machine |
| `external` | `rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;` | architecture, c4 |
| `actor` | `shape=actor;whiteSpace=wrap;html=1;` | c4, sequence, deployment |
| `cloud` | `ellipse;shape=cloud;whiteSpace=wrap;html=1;` | deployment, network |
| `hexagon` | `shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;` | network, deployment |
| `document` | `shape=document;whiteSpace=wrap;html=1;boundedLbl=1;` | data-flow |
| `ellipse` | `ellipse;whiteSpace=wrap;html=1;` | flowchart, state-machine, data-flow |
| `swimlane` | `swimlane;startSize=30;` | class, er, c4 |
| `container` | `swimlane;startSize=30;` | architecture, deployment, c4 |
| `boundary` | `rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;strokeColor=#999999;` | deployment, network, c4 |
| `text` | `text;html=1;align=center;verticalAlign=middle;` | all (labels, cardinality, titles) |

### Edge Kind → Arrow Style Tokens

> Arrow and line type are structural (fixed). `rounded=` on edge style and
> `strokeColor` are style-dependent — they come from the selected style JSON's
> `edges.style` and `edges`/`palette` fields respectively.

| Edge Kind | Arrow Tokens | Line Style | Used By |
|-----------|-------------|------------|---------|
| `primary` | `endArrow=block;endFill=1;strokeWidth=2;` | solid | all (main flow) |
| `async` | `endArrow=block;endFill=1;` | `dashed=1;dashPattern=8 4;` | architecture, deployment |
| `return` | `endArrow=open;endFill=0;` | `dashed=1;dashPattern=8 4;` | sequence |
| `inheritance` | `endArrow=block;endFill=0;` | solid | class |
| `implementation` | `endArrow=block;endFill=0;` | `dashed=1;dashPattern=8 4;` | class |
| `composition` | `startArrow=diamond;startFill=1;` | solid | class |
| `aggregation` | `startArrow=diamondThin;startFill=0;` | solid | class |
| `control` | `endArrow=block;endFill=1;orthogonalLoop=1;` | solid | flowchart, state-machine |
| `network` | `endArrow=none;` | `strokeWidth=2;` | network |
| `vpn` | `endArrow=none;` | `dashed=1;dashPattern=8 4;strokeWidth=1;` | network, deployment |

### Layout Presets

> Spacing values are authoritative in `references/rules.md` §Spacing & Layout Constants.
> This table is a convenient summary; when values differ, rules.md wins.

| Diagram Type | Default Direction | Key Spacing |
|-------------|------------------|-------------|
| architecture | TB (top→bottom) | Layer: ≥120px, Component: ≥80px, Same-row: 100–120px |
| sequence | LR (left→right) time TB | Participant: 150–200px, Message: 50px increment |
| er | Spread (minimize crossings) | Entity gap: 200–240px |
| flowchart | TB (top→bottom) | Step: ≥80px, Branch: 100–120px |
| deployment | TB or LR through zones | Zone gap: ≥140px, Node gap: ≥60px |
| class | Inheritance TB, association LR | Horizontal: 250px, Vertical: 150px |
| c4 | TB (Person→System→External) | Layer: ≥120px, Same-row: 100–120px |
| state-machine | LR (left→right) | State gap H: 100px, V: 120px |
| network | LR or TB through zones | Zone gap: ≥120px, Device gap: ≥40px |
| data-flow | TB or LR through pipeline | Entity→Process: ≥120px, Process→Process: ≥100px |

### Semantic Role → Palette Slot Mapping

> **This table defines the role→palette slot lookup path, NOT the actual colors.**
> Actual hex values (fillColor/strokeColor/fontColor) are in the selected style
> JSON's `roles` and `palette` fields. Example lookup: service component → role
> `service` → style JSON `roles.service` → slot `primary` → `palette.primary`.

| Semantic Role | Slot Name (in style JSON) | Applied To |
|---------------|---------------------------|------------|
| `service` | `primary` | Services, app components, main entities |
| `database` | `success` | Databases, storage, completion states |
| `queue` | `warning` | Queues, async messaging, choice nodes, cache |
| `gateway` | `accent` | Gateways, load balancers, proxies |
| `error` | `danger` | Security, firewalls, error/exception states |
| `external` | `neutral` | External systems, third-party, network devices |
| `security` | `secondary` | Config, CI/CD, infrastructure, enum |

> **Override rule**: Individual diagram type sections may remap component types to
> different roles. The type-specific role mapping takes priority over this global table.
> Actual colors ALWAYS come from the style JSON — never from this file.

---

## 1. System Architecture Diagram

**Purpose:** Show overall system structure, service tiers, component dependencies, and data flow. Best for microservices, cloud-native, distributed systems.

### Shapes

| Element | Style String |
|---------|-------------|
| Service / Component | `whiteSpace=wrap;html=1;` |
| Database / Data Store | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| Message Queue | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| API Gateway / LB | `whiteSpace=wrap;html=1;` |
| External System | `whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;` |
| Service Group (Container) | `swimlane;startSize=30;` |
| Zone / Network Boundary | `whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;pointerEvents=0;` |

### Color Assignments

> Colors come from the selected style JSON. This table maps element types to
> semantic roles — use the global "Semantic Role → Palette Slot Mapping" table
> to resolve each role to its palette slot.

| Element Type | Semantic Role |
|-------------|--------------|
| Service / Component | `service` |
| Database / Data Store | `database` |
| Message Queue | `queue` |
| API Gateway / LB | `gateway` |
| External System | `external` |
| Security / Auth | `error` |
| Config / Infrastructure | `security` |

### Layout

- **Direction:** Top-to-bottom, layered tiers
- **Tier structure (typical 4-layer):**
  - L1 (y≈40): Frontend / Client layer
  - L2 (y≈170): Gateway / API layer
  - L3 (y≈300-400): Service / Business Logic layer
  - L4 (y≈550-650): Data / Infrastructure layer
- Gateway placed at horizontal center of its layer
- Services distributed horizontally within their swimlane
- **External actor placement (R024):** When a user/actor/external system has only **one** connection, place it directly adjacent to its target — vertically aligned above (for top-down edges) or to the side (for lateral edges). Do NOT place it at the far opposite edge of the canvas. This minimizes edge length and avoids unnecessary routing detours. If an actor connects to multiple components, center it horizontally above all of them.
- **Connected node axis alignment (R025):** Nodes connected by a horizontal edge MUST share the same y-center (same row). Nodes connected by a vertical edge MUST share the same x-center (same column). Reorder children within a swimlane so connected nodes are adjacent — an edge between node A and node B must not pass through unrelated node C.
- **Container width fit (R026):** Swimlane width should fit its content: `width ≈ content_width + 80px` (40px margin each side). Do not stretch containers to fill the page when content is sparse.
- **Proportional sizing (R027):** Actors: `w=50~60, h=60~70`. Service nodes: `w=140~160, h=50`. Sub-components: `w≥120, h=50`. Scale consistently — don't let one element dominate.
- **Spacing system (R028–R031):** Every element must be 10–20px from its parent container edge. Connected elements: edge-to-edge gap ≤ 50px along the connection axis. Unconnected adjacent elements: gap ≥ 10px. Swimlane height = header + top_margin + max(item) + bottom_margin (where margin=10~20).

### Edges

- **Style:** `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;`
- **Arrow:** `endArrow=classic;endFill=1;` (solid filled arrow)
- **Async edges:** Add `dashed=1;dashPattern=8 4;`
- **Routing:** Reserve 80px-wide corridors between component groups
- **Waypoint minimization (R023):** Use the fewest waypoints possible. Cross-layer edges (e.g., service → cloud API) should use a simple L-shaped route: exit source downward → one horizontal turn in the inter-layer gap → enter target. Aim for ≤ 2 waypoints. Avoid routing edges along page margins unless necessary to bypass unrelated shapes.

### Spacing

| Context | Value |
|---------|-------|
| Layer-to-layer vertical | ≥ 120px |
| Same-row horizontal | 100–120px |
| Component-to-component (edge-to-edge) | ≥ 80px |
| Page margin | ≥ 40px |

### Special Constraints
- At least one container is recommended for service groups (use swimlanes)
- Database shapes placed at the bottom layer
- Gateway placed at top-center, horizontally aligned
- Routing corridors between layers for edge paths
- Z-order: edges rendered below components (assign lower IDs to edges)
- Title at top with `fontSize=14;fontStyle=1;`

---

## 2. Sequence Diagram

> **Pipeline:** B (Mermaid) by default. Use `sequenceDiagram` in `.mmd` → CLI convert.
> Downgrade to C if user wants custom styling ("精美"/"beautiful").
> **Delivery:** Prefer Mermaid code block for platforms that render it (GitHub, Notion, Feishu Wiki). Use PNG for Feishu Docx/Whiteboard.
> **Source preservation:** Keep `.mmd` alongside `.drawio` — the `.mmd` is the editable source.

**Purpose:** Show message exchange between participants over time. Best for login flows, API call chains, distributed transactions.

### Shapes

| Element | Style String |
|---------|-------------|
| Participant (Actor) | `whiteSpace=wrap;html=1;` |
| Database Participant | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| Lifeline | Edge: `endArrow=classic;html=1;dashed=1;dashPattern=8 4;endSize=12;` |
| Request Message | Edge: `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;` |
| Response Message | Edge: `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=open;endFill=0;dashed=1;dashPattern=8 4;` |

### Color Assignments

> Colors from selected style JSON. Map via semantic role.

| Element Type | Semantic Role |
|-------------|--------------|
| Main Participant | `service` |
| Gateway | `gateway` |
| External Participant | `external` |
| Database Participant | `database` |

### Layout

- **Direction:** Left-to-right participants, top-to-bottom time
- Participant boxes at `y=40`, `height=40`
- Lifelines extend from participant bottom to `y=500` (or below lowest message)
- Participants spread horizontally 150–200px apart (center-to-center)

### Edges

- Messages use `sourcePoint` / `targetPoint` within `<mxGeometry>` (not `source`/`target` attributes on the edge element) to place endpoints precisely on lifelines
- Request arrows: solid filled (`endArrow=classic;endFill=1;`)
- Response arrows: dashed open (`endArrow=open;endFill=0;dashed=1;dashPattern=8 4;`)
- Message Y-positions increment by 50px per message
- Message labels: add `labelBackgroundColor=#FFFFFF;` to edge style

### Spacing

| Context | Value |
|---------|-------|
| Participant horizontal spacing | 150–200px (center-to-center) |
| Lifeline length | 420–500px (y=80 to y=500+) |
| Message vertical increment | 50px |
| Page margin | ≥ 40px |

### Special Constraints
- All participants must have lifelines (dashed vertical edges)
- Request messages point left-to-right; response messages point right-to-left
- The X-coordinate of each `sourcePoint` / `targetPoint` must match its participant lifeline X
- Maximum 6 participants on one page
- Add `labelBackgroundColor=#FFFFFF;` to all edge labels for readability

---

## 3. ER Diagram (Entity-Relationship)

> **Pipeline:** B (Mermaid) by default. Use `erDiagram` in `.mmd` → CLI convert.
> Downgrade to C if user wants custom styling ("精美"/"beautiful").

**Purpose:** Show data entities, their attributes, and relationships. Best for database design, data modeling, schema documentation.

### Shapes

| Element | Style String |
|---------|-------------|
| Entity (Table) | `swimlane;startSize=30;fontSize=12;fontStyle=1;` |
| Field Row (inside entity) | `rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=none;align=left;fontSize=11;` |
| Cardinality Label | `text;html=1;align=center;verticalAlign=middle;fontSize=10;fontStyle=1;` |

### Color Assignments

> Colors from selected style JSON. Cycle through palette slots for each entity
> (at least 3 distinct roles). Example cycle: entity 1→`service`, entity 2→`database`,
> entity 3→`security`, entity 4→`queue`, entity 5+→`external`.
> **Do NOT hardcode hex values — look up each role in the style JSON.**

### Layout

- **Direction:** Entities spread across canvas; relationships drawn between them
- Arrange entities to minimize edge crossings (triangle/star formation for 3–5 entities)
- Entity width: 200–240px
- Entity height: auto (header=30px + n_fields × 40px)

### Edges

- **Style:** `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;`
- **Arrow:** `endArrow=classic;endFill=1;endSize=8;`
- Add waypoints via `<Array as="points">` for clean routing

### Spacing

| Context | Value |
|---------|-------|
| Entity-to-entity gap | 200–240px |
| Field row height | 40px per field row cell |
| Field label inset | x=10 within entity |
| Page margin | ≥ 40px |

### Special Constraints
- Primary key fields: underline with `<u>id: INT (PK)</u>`
- Foreign key fields: clearly label `(FK → ReferencedEntity)`
- Cardinality labels ("1", "N", "M") as separate `text` vertices near edge midpoints
- Relationship edges connect entity swimlanes (not individual fields)
- Fields use `fillColor=none;strokeColor=none;` (transparent, no border)
- If composite PK, use `<u>` on the PK section header

---

## 4. Flowchart

**Purpose:** Show business processes, decision paths, and operational steps. Best for workflows, algorithms, approval processes.

### Shapes

| Element | Style String |
|---------|-------------|
| Process Step | `whiteSpace=wrap;html=1;` |
| Decision (Diamond) | `rhombus;whiteSpace=wrap;html=1;` |
| Start / End | `ellipse;whiteSpace=wrap;html=1;` |
| Input / Output | `shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;` |
| Sub-process | `whiteSpace=wrap;html=1;` |
| Document | `shape=document;whiteSpace=wrap;html=1;boundedLbl=1;` |

### Color Assignments

> Colors from selected style JSON. Map via semantic role.

| Element Type | Semantic Role |
|-------------|--------------|
| Process Step | `service` |
| Decision / Branch | `queue` |
| Start / End | `database` |
| Input / Output | `gateway` |
| Error / Exception | `error` |
| Sub-process | `security` |

### Layout

- **Direction:** Top-to-bottom for main flow; branches expand left/right at decisions
- Decision nodes branch left = "No", right = "Yes" (or vice versa, be consistent)
- Keep the main path centered vertically
- **Inter-row spacing:** Connected process→process: ≥**80px** edge-to-edge (center-to-center ≥ 130px for h=50 nodes). Decision→branch: ≥**100px**. Pipeline/branch group to next unified step: ≥**60px**.
- **Feedback loops:** Route on the outside of the main column per R066. Side-routed feedback edges need ≥**60px** horizontal clearance from main-column nodes. Use `dashed=1` for visual distinction.

### Edges

- **Style:** `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;`
- **Arrow:** `endArrow=classic;endFill=1;`
- Decision branch labels: add `value="Yes"` or `value="No"` to edge
- Edge labels: add `labelBackgroundColor=#FFFFFF;`

### Spacing

| Context | Value |
|---------|-------|
| Step vertical gap | ≥ 80px |
| Decision branch horizontal gap | 100–120px |
| Page margin | ≥ 40px |

### Special Constraints
- Exactly one Start node (top center)
- At least one End node (bottom)
- Decision nodes must have exactly 2 outgoing edges (Yes/No branches)
- Avoid edge crossings: reorder branches or add intermediate junction nodes
- Error/exception paths: use dashed edges (`dashed=1;dashPattern=8 4;`)
- Main path: solid edges; secondary/error paths: dashed edges

---

## 5. Deployment Diagram

**Purpose:** Show infrastructure topology, network zones, deployed components. Best for cloud architecture, on-premise deployments, hybrid infrastructure.

### Shapes

| Element | Style String |
|---------|-------------|
| Deployment Node / Server | `whiteSpace=wrap;html=1;` |
| Network Zone | `rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;pointerEvents=0;` |
| Database / Storage | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| Firewall | `shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;` |
| Cloud / External | `ellipse;shape=cloud;whiteSpace=wrap;html=1;` |
| Load Balancer | `whiteSpace=wrap;html=1;` |

### Color Assignments

> Colors from selected style JSON. Map via semantic role.

| Element Type | Semantic Role |
|-------------|--------------|
| Internal Service / Server | `service` |
| Database / Storage | `database` |
| Network Device | `external` |
| Firewall / Security | `error` |
| Load Balancer / Gateway | `gateway` |
| Zone Boundary | `external` (stroke only, `fillColor=none`) |

### Layout

- **Direction:** Top-to-bottom or left-to-right through security zones
- Typical flow: Internet → Firewall → DMZ → Internal → Database
- Each network zone is a container (dashed border) with label

### Edges

- **Style:** `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;`
- **Arrow:** `endArrow=classic;endFill=1;`
- Network links (cross-zone): Standard solid arrows
- VPN / tunnel: `dashed=1;dashPattern=8 4;`

### Spacing

| Context | Value |
|---------|-------|
| Zone-to-zone gap | ≥ 140px |
| Node-to-node within zone | ≥ 60px |
| Page margin | ≥ 40px |

### Special Constraints
- At least one firewall between external and internal zones
- Zone boundaries: use rounded rectangle with `dashed=1;fillColor=none;`
- Label zone boundaries ("DMZ", "Internal Network", "AWS us-east-1")
- Place external systems (cloud, internet) at edges of the diagram

---

## 6. UML Class Diagram

> **Pipeline:** B (Mermaid) by default. Use `classDiagram` in `.mmd` → CLI convert.
> Downgrade to C if user wants custom styling ("精美"/"beautiful").

**Purpose:** Show classes, attributes, methods, and relationships (inheritance, composition, aggregation). Best for OO design, code documentation, architecture modeling.

### Shapes

| Element | Style String |
|---------|-------------|
| Class Box | `swimlane;fontStyle=1;align=center;startSize=26;html=1;` |
| Field / Method Row | `rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=none;align=left;fontSize=11;` |
| Separator Line | `line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=10;rotatable=0;labelPosition=left;points=[];portConstraint=eastwest;` |

### Color Assignments

> Colors from selected style JSON. Map via semantic role.

| Element Type | Semantic Role |
|-------------|--------------|
| Concrete Class | `service` |
| Abstract Class | `database` |
| Interface | `queue` |
| Enum | `security` |

### Layout

- **Direction:** Top-to-bottom class hierarchy, left-to-right associations
- Class boxes: 3 compartments (name, attributes, methods) separated by lines
- Inheritance hierarchy arranged vertically

### Edges

| Relationship | Style |
|-------------|-------|
| Inheritance (extends) | `endArrow=block;endFill=0;` (hollow triangle) |
| Implementation (implements) | `endArrow=block;endFill=0;dashed=1;` (hollow triangle, dashed) |
| Composition (has-a, strong) | `endArrow=diamond;endFill=1;` (filled diamond) |
| Aggregation (has-a, weak) | `endArrow=diamondThin;endFill=0;` (hollow diamond) |
| Association | `endArrow=none;` (no arrow) |

### Spacing

| Context | Value |
|---------|-------|
| Class-to-class horizontal | 250px |
| Class-to-class vertical (inheritance) | 150px |
| Class width | 200–240px |
| Row height | 20px |

### Special Constraints
- Stereotypes in guillemets: `«interface»`, `«abstract»`, `«enum»`
- Class name bold (`fontStyle=1`), centered
- Attribute section: visibility markers (`+` public, `-` private, `#` protected)
- Method section: same visibility convention
- Italic for abstract class names (`fontStyle=2` for italic)

---

## 7. C4 Model

**Purpose:** Show software architecture at four zoom levels. Best for system documentation, architecture decision records, onboarding.

### Shapes

| Element | Style String |
|---------|-------------|
| Person / User | `shape=actor;whiteSpace=wrap;html=1;` |
| Software System | `rounded=1;arcSize=10;html=1;whiteSpace=wrap;` |
| External System | `rounded=1;arcSize=10;html=1;whiteSpace=wrap;dashed=1;` |
| Container | `rounded=1;arcSize=10;html=1;whiteSpace=wrap;` |
| Component | `whiteSpace=wrap;html=1;` |
| Database | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| System Boundary | `rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;` |

### Color Assignments (per level)

> Colors from selected style JSON. Map C4 levels to semantic roles.

| Level | Semantic Role | Rationale |
|-------|--------------|-----------|
| C1 (Context) | `service` | System as black-box |
| C2 (Container) | `database` | Apps, data stores |
| C3 (Component) | `gateway` | Internal components |
| C4 (Code) | `external` | Classes, modules |

### Layout

- **Direction:** Top-to-bottom: Person → System → Containers → Components
- C1: Person + System + External (1 page)
- C2: Up to 4 containers within system boundary
- C3: Up to 6 components within container boundary

### Edges

- **Style:** `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;`
- **Arrow:** `endArrow=blockThin;endFill=1;`
- External interactions: `dashed=1;dashPattern=8 4;`
- Label format: `"Description"` + `[Technology]`

### Special Constraints
- C4 level must be identified in the diagram title
- At most 4 containers per C2 level
- At most 6 components per C3 level
- Label each relationship with intent and technology
- Use `labelBackgroundColor=#FFFFFF;` for edge labels

---

## 8. State Machine Diagram

> **Pipeline:** B (Mermaid) by default. Use `stateDiagram-v2` in `.mmd` → CLI convert.
> Downgrade to C if user wants custom styling ("精美"/"beautiful").

**Purpose:** Show states, transitions, and events. Best for lifecycle modeling, protocol design, workflow states.

### Shapes

| Element | Style String |
|---------|-------------|
| State | `whiteSpace=wrap;html=1;` |
| Initial State | `ellipse;whiteSpace=wrap;html=1;` (solid fill from style JSON `palette.primary.strokeColor`) |
| Final State | `ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;` (fixed convention) |
| Choice Pseudo-state | `rhombus;whiteSpace=wrap;html=1;` |
| Composite State | `swimlane;startSize=30;` |

### Color Assignments

> Colors from selected style JSON. Map via semantic role.
> Initial/final states MAY use fixed colors (not style-dependent) for visual convention.

| State Type | Semantic Role |
|-----------|--------------|
| Normal State | `service` |
| Error State | `error` |
| Final State | `database` |
| Initial State | `service` (solid fill, fixed style) |

### Layout

- **Direction:** Left-to-right for simple state chains
- Complex diagrams: spread states in a balanced graph layout
- Initial state at far left, final state at far right

### Edges

- **Style:** `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;`
- **Arrow:** `endArrow=classic;endFill=1;`
- Self-transitions: `orthogonalLoop=1;jettySize=auto;`
- Transition labels: event name on the edge, guard condition in brackets

### Spacing

| Context | Value |
|---------|-------|
| State-to-state horizontal | 100px |
| State-to-state vertical | 120px |
| Page margin | ≥ 40px |

### Special Constraints
- Exactly 1 initial state
- Final state(s) must be unique (no duplicate final states)
- Transition labels: `Event [guard] / action` format
- Self-loops go above or right of the state box

---

## 9. Network Topology Diagram

**Purpose:** Show network devices, connections, and zones. Best for network architecture, infrastructure documentation, security reviews.

### Shapes

| Element | Style String |
|---------|-------------|
| Router / Switch | `shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;` |
| Server | `whiteSpace=wrap;html=1;` |
| Firewall | `shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;` |
| Cloud / Internet | `ellipse;shape=cloud;whiteSpace=wrap;html=1;` |
| Workstation | `whiteSpace=wrap;html=1;` |
| Storage / NAS | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| Network Segment | `rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;` |

### Color Assignments

> Colors from selected style JSON. Map via semantic role.

| Element Type | Semantic Role |
|-------------|--------------|
| Router / Switch / Network Device | `external` |
| Firewall | `error` |
| Server / Compute | `service` |
| Storage / NAS | `database` |
| Security Zone | `queue` |

### Layout

- **Direction:** Left-to-right or top-to-bottom through security zones
- Flow: Internet → Perimeter → DMZ → Internal → Management
- Group devices within network segment containers

### Edges

- **Style:** `edgeStyle=none;rounded=0;` (straight lines)
- Thicker stroke: add `strokeWidth=2;` to edge style
- VPN tunnels: `dashed=1;dashPattern=8 4;`
- Label IP addresses and hostnames on nodes

### Spacing

| Context | Value |
|---------|-------|
| Zone gap | ≥ 120px |
| Device gap within zone | ≥ 40px |
| Page margin | ≥ 40px |

### Special Constraints
- At least one firewall between Internet and internal zones
- Label subnet addresses on zone/segment boundaries
- Use hexagons for network infrastructure (routers, firewalls)
- Use cloud shape for Internet/WAN

---

## 10. Data Flow Diagram (DFD)

**Purpose:** Show data sources, transformations, and sinks. Best for data pipelines, ETL processes, system integration.

### Shapes

| Element | Style String |
|---------|-------------|
| Process | `whiteSpace=wrap;html=1;` |
| External Entity | `ellipse;whiteSpace=wrap;html=1;` |
| Data Store | `shape=document;whiteSpace=wrap;html=1;boundedLbl=1;` |
| Data Flow (Edge) | Label on edge: `fontSize=10;` |

### Color Assignments

> Colors from selected style JSON. Map via semantic role.

| Element Type | Semantic Role |
|-------------|--------------|
| Process (Transform) | `service` |
| External Entity (Source/Sink) | `queue` |
| Data Store | `database` |
| Error Flow | `error` |

### Layout

- **Direction:** Top-to-bottom or left-to-right
- External entities on the edges
- Processes in the center
- Data stores at the bottom (or side)

### Edges

- **Style:** `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;`
- **Arrow:** `endArrow=classic;endFill=1;`
- Every edge MUST have a `value` attribute (the data being transferred)

### Spacing

| Context | Value |
|---------|-------|
| Process-to-process | ≥ 100px |
| Entity-to-process | ≥ 120px |
| Page margin | ≥ 40px |

### Special Constraints
- Every edge MUST be labeled (data name)
- No dangling data stores (stores must have both read and write flows)
- Processes must have at least one input and one output edge
- External entities: ellipse shape, placed on diagram edges
- Use small text cells (`fontSize=9`) for detailed flow descriptions if needed
- Avoid crossing data flow lines; use waypoints for clean routing

---

## Quick Reference: Shape → Style Mapping

| Shape | Key Style Tokens |
|-------|-----------------|
| Rounded Rectangle | `whiteSpace=wrap;html=1;` |
| Sharp Rectangle | `rounded=0;whiteSpace=wrap;html=1;` |
| Ellipse | `ellipse;whiteSpace=wrap;html=1;` |
| Diamond (Rhombus) | `rhombus;whiteSpace=wrap;html=1;` |
| Cylinder | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| Swimlane | `swimlane;startSize=30;` |
| Cloud | `ellipse;shape=cloud;whiteSpace=wrap;html=1;` |
| Hexagon | `shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;` |
| Parallelogram | `shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;` |
| Document | `shape=document;whiteSpace=wrap;html=1;boundedLbl=1;` |
| Actor | `shape=actor;whiteSpace=wrap;html=1;` |
| Text | `text;html=1;align=center;verticalAlign=middle;` |

## Arrow Semantics (Semantic Edge Kinds)

> Edges are not just lines. Each semantic relationship should have a distinct visual style.
> Use these 7 kinds when generating edges. Source: DESIGN.md §10.5.

| Kind | Meaning | Style Tokens (arrow + line) | Color Source | Example Use |
|------|---------|---------------------------|-------------|-------------|
| **primary** | Main flow / synchronous call | `endArrow=block;endFill=1;strokeWidth=2;` solid | style JSON `edges` or `palette.primary` | API call, data flow |
| **async** | Asynchronous message | `endArrow=block;endFill=1;dashed=1;dashPattern=8 4;` | style JSON `palette.neutral` | Message queue, event bus |
| **memoryRead** | Cache read | `endArrow=block;endFill=1;` solid | style JSON `palette.success` | Redis GET, CDN fetch |
| **memoryWrite** | Cache write | `endArrow=block;endFill=1;dashed=1;dashPattern=8 4;` | style JSON `palette.success` | Redis SET, cache invalidation |
| **control** | Control flow / branch | `endArrow=block;endFill=1;orthogonalLoop=1;` solid | style JSON `palette.primary` | If-else, switch, state transition |
| **feedback** | Feedback / return flow | `endArrow=block;endFill=1;dashed=1;dashPattern=8 4;` | style JSON `palette.warning` | Error response, rollback, retry |
| **neutral** | Weak dependency / reference | `endArrow=open;endFill=0;strokeWidth=1;` | style JSON `palette.neutral` | Documentation link, optional dependency |

**Application rule**: When generating edges in Pipeline C, choose the kind that matches
the relationship described by the user. Apply the arrow/line tokens above + the color
from the selected style JSON's `edges` field (or `palette` for per-edge coloring). The
`strokeColor` is the ONLY color-dependent token — all others are structural and
style-independent.

**Legend requirement**: Every diagram MUST include a legend that explains the arrow semantics used. See the individual diagram type sections for legend placement constraints (R039 in `visual-audit.md`).

---

## Quick Reference: Edge Style Presets

| Edge Type | Style Tokens |
|-----------|-------------|
| Orthogonal (default) | `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;` |
| Straight | `edgeStyle=none;rounded=0;` |
| Curved | `edgeStyle=orthogonalEdgeStyle;curved=1;` |
| Dashed | Add `dashed=1;dashPattern=8 4;` |
| Solid Arrow (filled) | `endArrow=classic;endFill=1;` |
| Open Arrow | `endArrow=open;endFill=0;` |
| Block Arrow (inheritance) | `endArrow=block;endFill=0;` |
| Diamond (composition) | `endArrow=diamond;endFill=1;` |
| Diamond Thin (aggregation) | `endArrow=diamondThin;endFill=0;` |
| No Arrow | Omit `endArrow`, or `endArrow=none;` |
| Bidirectional | Add `startArrow=classic;startFill=1;` |

## Global Constraints (Apply to All Types)

From `references/rules.md`:
- **R001–R009**: P0 blocking — structural integrity (dangling edges, duplicate IDs, parent-child, XML syntax, missing geometry, environment)
- **R010–R017, R045–R051**: P1 must-fix — layout quality (overlaps, edge-through-vertex, crossings, spacing, off-canvas, routing corridors, edge distribution, clearance, waypoint alignment, swimlane positioning, edge parent assignment)
- **R020–R065**: P2 warning — grid alignment, connection points, arrow segments, waypoints, label ratio, content-first sizing, column unification, spacing constants, container matching
- **P3 visual audit**: See `references/visual-audit.md` for the complete P3 decision table (label truncation, edge-shape overlap, edge-label overlap, stacked edges, arrow direction, corner connections, label background, component spacing, Z-order, legend)

From `references/xml-authoring.md`:
- All coordinates must be multiples of 10px (grid alignment)
- Edge `<mxGeometry>` must always be expanded (never self-closing)
- IDs start from `"2"`, increment sequentially
- `id="0"` and `id="1"` are reserved for root cells
