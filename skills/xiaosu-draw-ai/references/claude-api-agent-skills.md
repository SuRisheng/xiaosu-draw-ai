# Claude API Agent Skills Adaptation Guide

> **Status:** Phase 5 — planned, NOT yet implemented.
> **When to read:** When adapting xiaosu-draw-ai to run as a Claude API Agent Skill (container-based skill mechanism).
> **Source:** DESIGN.md §2 — Platform boundaries.

---

## Key Differences: Local vs API Agent Skills

| Concept | Local Skill | Claude API Agent Skill |
|---------|------------|----------------------|
| **Distribution** | Directory on disk | Container image or skill package |
| **Invocation** | Agent reads SKILL.md on-demand | API request references skill by name |
| **Runtime** | Local Node.js/Python | Container sandbox (server-side) |
| **Tools** | Local CLI tools (drawio, python3, node) | Must be bundled in container image |
| **Filesystem** | Project directory | Ephemeral — write to `/tmp` or mounted volume |
| **Configuration** | `.claude/settings.json` | API request parameters or skill manifest |

---

## Adaptation Steps

### Step 1: Create Skill Manifest

```yaml
# skill.yaml
name: xiaosu-draw-ai
version: 1.0.0
description: Universal AI diagramming skill powered by draw.io CLI
entrypoint: SKILL.md
resources:
  - references/
  - templates/
  - styles/
  - scripts/
  - data/
runtime:
  type: container
  image: xiaosu-draw-ai:latest
  tools:
    - drawio-cli
    - python3
    - node
```

### Step 2: Containerize Runtime

```dockerfile
# Dockerfile
FROM node:20-slim

# Install draw.io CLI
RUN apt-get update && apt-get install -y \
    python3 python3-pip xvfb \
    && pip3 install pytest \
    && wget -q https://github.com/jgraph/drawio-desktop/releases/download/v24.0.0/drawio-amd64-24.0.0.deb \
    && apt-get install -y ./drawio-amd64-24.0.0.deb \
    && rm drawio-amd64-24.0.0.deb

# Copy skill files
COPY skills/xiaosu-draw-ai/ /skill/
WORKDIR /workspace

# Verify installation
RUN drawio --version && python3 --version && node --version
```

### Step 3: Adapt File Paths

API Agent Skills run in a container sandbox. All paths must be relative or configurable:

```javascript
// scripts/export.js — path adaptation
const SKILL_ROOT = process.env.SKILL_ROOT || path.resolve(__dirname, '..');
const WORKSPACE = process.env.WORKSPACE || '/workspace';

// Write outputs to workspace, not project directory
const outputDir = path.join(WORKSPACE, '.drawio');
```

### Step 4: Tool Registration

Register each script as an API tool with explicit schemas:

```json
{
  "tools": [
    {
      "name": "validate_drawio",
      "description": "Run structural lint on a .drawio file (P0-P2 rules)",
      "input_schema": {
        "type": "object",
        "properties": {
          "filepath": { "type": "string", "description": "Path to .drawio file" },
          "strict": { "type": "boolean", "description": "Treat warnings as errors" }
        },
        "required": ["filepath"]
      }
    },
    {
      "name": "export_drawio",
      "description": "Export .drawio to PNG/SVG/PDF using draw.io CLI",
      "input_schema": {
        "type": "object",
        "properties": {
          "filepath": { "type": "string" },
          "format": { "type": "string", "enum": ["png", "svg", "pdf"] },
          "final": { "type": "boolean" }
        },
        "required": ["filepath"]
      }
    }
  ]
}
```

---

## Constraints (Same as Managed Agents)

1. **Never put secrets in SKILL.md.** Use environment variables or Vault.
2. **Skill must work locally first**, then containerize.
3. **Quality gates are mandatory** regardless of runtime.
4. **Golden regression must pass** after containerization.
5. **Keep local simplicity** — don't make the local SKILL.md harder to use.

---

## Cross-Reference

- **DESIGN.md §2**: Full platform boundary specification
- **managed-agents-adaptation.md**: Managed Agents (Agent-once-Session-many) adaptation
- **README.md §Installation**: Local install instructions
- **Dockerfile**: (to be created in Phase 5 implementation)
