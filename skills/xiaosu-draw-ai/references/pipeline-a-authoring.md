# Pipeline A: Data-Driven Importers

> Architecture and API for data-driven diagram generation. Pipeline A extracts structure
> from code, IaC, SQL, and API specs — then generates `.drawio` XML via an Intermediate
> Representation (IR).
>
> **Status:** Architecture defined. Individual importers are planned for future releases.
>
> **When to read:** When implementing a new importer, or understanding how Pipeline A
> integrates with the quality pipeline.

---

## Pipeline A Overview

```
Source Input                  IR (JSON)                  .drawio XML
     │                           │                           │
     ▼                           ▼                           ▼
┌──────────┐   parse   ┌──────────────┐   generate   ┌──────────────┐
│  Code    │ ────────→ │              │ ───────────→ │              │
│  IaC     │           │  IR Format   │              │  .drawio     │
│  SQL     │           │  (JSON)      │              │  XML         │
│  API     │           │              │              │              │
└──────────┘           └──────────────┘              └──────────────┘
                             │
                     ┌───────┴───────┐
                     │  autolayout   │ (optional: Graphviz / ELK)
                     └───────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Quality Pipeline │
                    │  validate → export│
                    │  → self-check     │
                    └──────────────────┘
```

---

## Intermediate Representation (IR) Format

Importers produce a standard JSON structure. The IR is diagram-type-agnostic — the generator
maps IR elements to draw.io shapes based on the diagram type.

```json
{
  "meta": {
    "type": "architecture",
    "title": "System Architecture",
    "source": "terraform/main.tf",
    "generated_at": "2026-07-08T00:00:00Z"
  },
  "nodes": [
    {
      "id": "web-app",
      "label": "Web Application",
      "type": "service",
      "role": "primary",
      "metadata": {
        "technology": "React",
        "description": "Frontend SPA"
      }
    },
    {
      "id": "user-db",
      "label": "User Database",
      "type": "database",
      "role": "success",
      "metadata": {
        "technology": "PostgreSQL",
        "description": "User data store"
      }
    }
  ],
  "edges": [
    {
      "source": "web-app",
      "target": "user-db",
      "label": "SQL Queries",
      "type": "primary"
    }
  ],
  "layout": {
    "direction": "TB",
    "layers": [
      ["web-app"],
      ["user-db"]
    ]
  }
}
```

### Node Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | ✅ | Unique node identifier (string) |
| `label` | ✅ | Display text |
| `type` | ✅ | Shape type: `service`, `database`, `queue`, `gateway`, `external`, `container` |
| `role` | — | Color role: `primary`, `success`, `warning`, `accent`, `danger`, `neutral`, `secondary` |
| `metadata` | — | Arbitrary key-value pairs (technology, description, etc.) |

### Edge Fields

| Field | Required | Description |
|-------|----------|-------------|
| `source` | ✅ | Source node ID |
| `target` | ✅ | Target node ID |
| `label` | — | Edge label text |
| `type` | — | Edge style: `primary`, `dashed`, `async`, `return` |

### Layout Hints

| Field | Description |
|-------|-------------|
| `direction` | `TB` (top-bottom), `LR` (left-right) |
| `layers` | Array of arrays — nodes grouped into rows (top-to-bottom) |

---

## Importer API

Each importer is a self-contained script that:

1. **Reads** a source file (code, IaC, SQL, API spec)
2. **Parses** the source into structured data
3. **Produces** IR JSON to stdout or a file
4. **The generator** consumes IR → produces `.drawio` XML

### Standard Interface

```python
#!/usr/bin/env python3
"""
<importer-name>.py — Extract diagram structure from <source-type>.

Usage:
    python3 scripts/importers/<importer-name>.py <source-file> [--json] [--output <ir.json>]

Output:
    IR JSON to stdout (--json) or to file (--output).
"""

def parse_source(filepath: str) -> dict:
    """Parse source file, return IR dict."""
    ...

def main():
    ir = parse_source(args.input)
    # Output IR JSON
    ...
```

### Naming Convention

`scripts/importers/<source>2<diagram-type>.py`

| Importer | Source → Diagram Type |
|----------|----------------------|
| `sql2er.py` | SQL DDL → ER Diagram |
| `openapi2arch.py` | OpenAPI Spec → API Architecture |
| `tf2deployment.py` | Terraform → Deployment Diagram |
| `py2class.py` | Python → UML Class Diagram |
| `js2class.py` | JavaScript/TypeScript → UML Class Diagram |
| `go2class.py` | Go → UML Class Diagram |
| `k82deployment.py` | Kubernetes YAML → Deployment Diagram |
| `docker2deployment.py` | Docker Compose → Deployment Diagram |

---

## IR → draw.io XML Generator

The generator (`scripts/generate.js`, planned) consumes IR JSON and produces `.drawio` XML.

```javascript
/**
 * generate.js — IR → .drawio XML generator.
 *
 * Usage:
 *   node scripts/generate.js <ir.json> --type architecture --output out.drawio
 *
 * Reads IR JSON, maps to draw.io shapes via diagram-types.md presets,
 * applies default style (or user-specified style), and writes .drawio XML.
 */
```

### Generation Steps

1. **Load IR JSON** — parse the input file
2. **Load diagram type presets** — from `references/diagram-types.md` for shape/color/layout rules
3. **Load style** — from `styles/style-N-*.md` for color tokens and typography
4. **Map IR → mxCells** — each IR node becomes a vertex; each IR edge becomes an edge
5. **Apply layout** — position nodes based on layout hints, or run autolayout
6. **Write XML** — output the `.drawio` file with proper skeleton and sequential IDs

---

## Planned Importers (Future Releases)

| Priority | Importer | Source | Use Case |
|----------|----------|--------|----------|
| P0 | `sql2er.py` | SQL DDL (CREATE TABLE) | Database schema → ER diagram |
| P0 | `openapi2arch.py` | OpenAPI 3.0 spec | API definition → API architecture |
| P1 | `tf2deployment.py` | Terraform `.tf` files | Infrastructure-as-code → Deployment |
| P1 | `py2class.py` | Python source | Class hierarchy → UML class diagram |
| P2 | `k82deployment.py` | Kubernetes manifests | K8s resources → Deployment |
| P2 | `docker2deployment.py` | Docker Compose | Container topology → Deployment |

---

## Integration with Quality Pipeline

After generation, Pipeline A output follows the same quality gates as Pipelines B and C:

```
IR → generate.js → .drawio XML
                        │
                        ▼
              python3 scripts/validate.py
                        │
                        ▼
              node scripts/export.js (preview)
                        │
                        ▼
              Visual self-check (references/visual-audit.md)
                        │
                        ▼
              node scripts/export.js --final
```

The IR + generator approach ensures:
- **Reproducible** — same input always produces the same diagram
- **Version-controllable** — IR JSON is diff-friendly
- **Auditable** — validate.py catches structural issues before export
- **Styleable** — apply any of the 7 visual styles to generated diagrams
