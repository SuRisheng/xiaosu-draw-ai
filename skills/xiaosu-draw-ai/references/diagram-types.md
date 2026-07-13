# Diagram Type Presets

> Type-specific shape, color, layout, and edge recommendations.
> AI consults this reference during SKILL.md Step 1 (Plan) and Step 2 (Generate XML).
>
> **When to read:** AI identifies the diagram type from the user's request, then reads the
> matching section below for presets. Do NOT pre-load entire file — load only the
> relevant type's section.
>
> Color palette values are defined in `references/xml-authoring.md` (7-color palette).
> For the default visual style tokens, see `styles/built-in/flat-icon.json`.

---

## Unified Lookup Tables

> **Quick reference.** For each diagram type section below, the constraints derive from these base tables. Consult this first, then the type-specific section for overrides.

### Node Kind → Shape Style Tokens

| Node Kind | Shape Token | Used By |
|-----------|------------|---------|
| `service` | `rounded=1;whiteSpace=wrap;html=1;` | architecture, deployment, network, c4, data-flow |
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

### Role → Palette Color

| Role | fillColor | strokeColor | Applied To |
|------|-----------|-------------|-----------|
| primary | `#dae8fc` | `#6c8ebf` | Services, app components, main entities |
| success | `#d5e8d4` | `#82b366` | Databases, storage, completion states |
| warning | `#fff2cc` | `#d6b656` | Queues, async, choice nodes, cache |
| accent | `#ffe6cc` | `#d79b00` | Gateways, load balancers, proxies |
| danger | `#f8cecc` | `#b85450` | Security, firewalls, error states |
| neutral | `#f5f5f5` | `#666666` | External systems, network devices |
| secondary | `#e1d5e7` | `#9673a6` | Config, CI/CD, infrastructure, enum |

> **Override rule**: Individual diagram type sections may override these defaults. When a type-specific constraint conflicts with a table above, the type-specific constraint wins.

---

## 1. System Architecture Diagram

**Purpose:** Show overall system structure, service tiers, component dependencies, and data flow. Best for microservices, cloud-native, distributed systems.

### Shapes

| Element | Style String |
|---------|-------------|
| Service / Component | `rounded=1;whiteSpace=wrap;html=1;` |
| Database / Data Store | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| Message Queue | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| API Gateway / LB | `rounded=1;whiteSpace=wrap;html=1;` |
| External System | `rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;` |
| Service Group (Container) | `swimlane;startSize=30;` |
| Zone / Network Boundary | `rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;pointerEvents=0;` |

### Color Assignments

| Role | fillColor | strokeColor | Examples |
|------|-----------|-------------|---------|
| Primary / Service | `#dae8fc` | `#6c8ebf` | Microservices, app logic |
| Success / Database | `#d5e8d4` | `#82b366` | MySQL, PostgreSQL, caches |
| Warning / Queue | `#fff2cc` | `#d6b656` | RabbitMQ, Kafka, async |
| Accent / Gateway | `#ffe6cc` | `#d79b00` | API Gateway, Load Balancer, Proxy |
| Danger / Security | `#f8cecc` | `#b85450` | Auth, Firewall, WAF |
| Neutral / External | `#f5f5f5` | `#666666` | Third-party APIs, External systems |
| Secondary / Infra | `#e1d5e7` | `#9673a6` | Config, CI/CD, Monitoring |

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
| Participant (Actor) | `rounded=1;whiteSpace=wrap;html=1;` |
| Database Participant | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| Lifeline | Edge: `endArrow=classic;html=1;dashed=1;dashPattern=8 4;endSize=12;` |
| Request Message | Edge: `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;` |
| Response Message | Edge: `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=open;endFill=0;dashed=1;dashPattern=8 4;` |

### Color Assignments

| Role | fillColor | strokeColor |
|------|-----------|-------------|
| Main Participant | `#dae8fc` | `#6c8ebf` |
| Gateway | `#ffe6cc` | `#d79b00` |
| External Participant | `#f5f5f5` | `#666666` |
| Database | `#d5e8d4` | `#82b366` |

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

| Entity # | fillColor | strokeColor |
|----------|-----------|-------------|
| Entity 1 | `#dae8fc` | `#6c8ebf` |
| Entity 2 | `#d5e8d4` | `#82b366` |
| Entity 3 | `#e1d5e7` | `#9673a6` |
| Entity 4 | `#fff2cc` | `#d6b656` |
| Entity 5+ | `#f5f5f5` | `#666666` |

> Cycle through colors for each entity. Use at least 3 distinct colors.

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
| Process Step | `rounded=1;whiteSpace=wrap;html=1;` |
| Decision (Diamond) | `rhombus;whiteSpace=wrap;html=1;` |
| Start / End | `ellipse;whiteSpace=wrap;html=1;` |
| Input / Output | `shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;` |
| Sub-process | `rounded=1;whiteSpace=wrap;html=1;` |
| Document | `shape=document;whiteSpace=wrap;html=1;boundedLbl=1;` |

### Color Assignments

| Role | fillColor | strokeColor |
|------|-----------|-------------|
| Process Step | `#dae8fc` | `#6c8ebf` |
| Decision | `#fff2cc` | `#d6b656` |
| Start / End | `#d5e8d4` | `#82b366` |
| Input / Output | `#ffe6cc` | `#d79b00` |
| Error / Exception | `#f8cecc` | `#b85450` |
| Sub-process | `#e1d5e7` | `#9673a6` |

### Layout

- **Direction:** Top-to-bottom for main flow; branches expand left/right at decisions
- Decision nodes branch left = "No", right = "Yes" (or vice versa, be consistent)
- Keep the main path centered vertically

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
| Deployment Node / Server | `rounded=1;whiteSpace=wrap;html=1;` |
| Network Zone | `rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;pointerEvents=0;` |
| Database / Storage | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| Firewall | `shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;` |
| Cloud / External | `ellipse;shape=cloud;whiteSpace=wrap;html=1;` |
| Load Balancer | `rounded=1;whiteSpace=wrap;html=1;` |

### Color Assignments

| Role | fillColor | strokeColor |
|------|-----------|-------------|
| Internal Service | `#dae8fc` | `#6c8ebf` |
| Database | `#d5e8d4` | `#82b366` |
| Network Device | `#f5f5f5` | `#666666` |
| Firewall / Security | `#f8cecc` | `#b85450` |
| Load Balancer | `#ffe6cc` | `#d79b00` |
| Zone Boundary | `none` | `#999999` |

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

| Role | fillColor | strokeColor |
|------|-----------|-------------|
| Concrete Class | `#dae8fc` | `#6c8ebf` |
| Abstract Class | `#d5e8d4` | `#82b366` |
| Interface | `#fff2cc` | `#d6b656` |
| Enum | `#e1d5e7` | `#9673a6` |

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
| Component | `rounded=1;whiteSpace=wrap;html=1;` |
| Database | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| System Boundary | `rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;` |

### Color Assignments (per level)

| Level | Element Color | Description |
|-------|--------------|-------------|
| C1 (Context) | Blue `#dae8fc` / `#6c8ebf` | System as black-box |
| C2 (Container) | Green `#d5e8d4` / `#82b366` | Apps, data stores |
| C3 (Component) | Orange `#ffe6cc` / `#d79b00` | Internal components |
| C4 (Code) | Gray `#f5f5f5` / `#666666` | Classes, modules |

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
| State | `rounded=1;whiteSpace=wrap;html=1;` |
| Initial State | `ellipse;whiteSpace=wrap;html=1;fillColor=#6c8ebf;strokeColor=#6c8ebf;` |
| Final State | `ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;` |
| Choice Pseudo-state | `rhombus;whiteSpace=wrap;html=1;` |
| Composite State | `swimlane;startSize=30;` |

### Color Assignments

| Role | fillColor | strokeColor |
|------|-----------|-------------|
| Normal State | `#dae8fc` | `#6c8ebf` |
| Error State | `#f8cecc` | `#b85450` |
| Final State | `#d5e8d4` | `#82b366` |
| Initial State | `#6c8ebf` (solid fill) | `#6c8ebf` |

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
| Server | `rounded=1;whiteSpace=wrap;html=1;` |
| Firewall | `shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;` |
| Cloud / Internet | `ellipse;shape=cloud;whiteSpace=wrap;html=1;` |
| Workstation | `rounded=1;whiteSpace=wrap;html=1;` |
| Storage / NAS | `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;` |
| Network Segment | `rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;` |

### Color Assignments

| Role | fillColor | strokeColor |
|------|-----------|-------------|
| Network Device | `#f5f5f5` | `#666666` |
| Firewall | `#f8cecc` | `#b85450` |
| Server | `#dae8fc` | `#6c8ebf` |
| Storage | `#d5e8d4` | `#82b366` |
| Security Zone | `#fff2cc` | `#d6b656` |

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
| Process | `rounded=1;whiteSpace=wrap;html=1;` |
| External Entity | `ellipse;whiteSpace=wrap;html=1;` |
| Data Store | `shape=document;whiteSpace=wrap;html=1;boundedLbl=1;` |
| Data Flow (Edge) | Label on edge: `fontSize=10;` |

### Color Assignments

| Role | fillColor | strokeColor |
|------|-----------|-------------|
| Process | `#dae8fc` | `#6c8ebf` |
| External Entity | `#fff2cc` | `#d6b656` |
| Data Store | `#d5e8d4` | `#82b366` |
| Error Flow | `#f8cecc` | `#b85450` |

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
| Rounded Rectangle | `rounded=1;whiteSpace=wrap;html=1;` |
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

| Kind | Meaning | Style Tokens | Example Use |
|------|---------|-------------|-------------|
| **primary** | Main flow / synchronous call | Primary color (`#6c8ebf`), solid, `endArrow=block;endFill=1;strokeWidth=2;` | API call, data flow between services |
| **async** | Asynchronous message | Neutral color (`#64748b`), dashed, `endArrow=block;endFill=1;dashed=1;dashPattern=8 4;` | Message queue, event bus, background job |
| **memoryRead** | Cache read | Success color (`#16a34a`), solid, `endArrow=block;endFill=1;` | Redis GET, CDN fetch |
| **memoryWrite** | Cache write | Success color (`#16a34a`), dashed, `endArrow=block;endFill=1;dashed=1;dashPattern=8 4;` | Redis SET, cache invalidation |
| **control** | Control flow / branch | Primary color (`#6c8ebf`), solid, `endArrow=block;endFill=1;orthogonalLoop=1;` | If-else, switch, state transition |
| **feedback** | Feedback / return flow | Warning color (`#d97706`), dashed, `endArrow=block;endFill=1;dashed=1;dashPattern=8 4;` | Error response, rollback, retry |
| **neutral** | Weak dependency / reference | Neutral color (`#9ca3af`), thin, `endArrow=open;endFill=0;strokeWidth=1;` | Documentation link, optional dependency |

**Application rule**: When generating edges in Pipeline C, choose the kind that matches the relationship described by the user. Apply the corresponding style tokens from the table above. The color values are defaults from `flat-icon` style; use matching tokens from the selected style preset.

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
- **R001–R005**: P0 blocking — structural integrity (dangling edges, duplicate IDs, parent-child, XML syntax, missing geometry)
- **R010–R015**: P1 must-fix — layout quality (overlaps, edge-through-vertex, crossings, spacing, off-canvas, self-closing edges)
- **R020–R022**: P2 warning — grid alignment, connection points, arrow segments
- **R030–R039**: P3 visual audit — see `references/visual-audit.md`

From `references/xml-authoring.md`:
- All coordinates must be multiples of 10px (grid alignment)
- Edge `<mxGeometry>` must always be expanded (never self-closing)
- IDs start from `"2"`, increment sequentially
- `id="0"` and `id="1"` are reserved for root cells
