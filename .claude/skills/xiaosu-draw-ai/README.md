# xiaosu-draw-ai v1.0.0

> Universal AI diagramming skill — pure SKILL.md + draw.io CLI driven.

Generate production-quality architecture, sequence, ER, flowchart, deployment,
class, C4, state machine, network, and data flow diagrams from natural language
descriptions.

## Quick Start

Describe your system in natural language and the AI will generate a `.drawio`
file with proper layout, colors, and connections.

## Installation

Copy the entire `xiaosu-draw-ai/` directory to your agent's skills directory.
**Do not copy only `SKILL.md`** — the `references/`, `scripts/`, `styles/`,
and `templates/` directories must be colocated with `SKILL.md`.

### Claude Code
```bash
cp -r ./.claude/skills/xiaosu-draw-ai ~/.claude/skills/xiaosu-draw-ai
```

### Generic (any Agent platform)
```bash
cp -r ./.claude/skills/xiaosu-draw-ai <your-agent-skills-dir>/xiaosu-draw-ai
```

## Dependencies

- **draw.io desktop app** — CLI ≥ 24.0.0 on PATH
- **Python 3** — for `validate.py` (structural lint)
- **Node.js** — for `export.js` and `build.js`

## Diagram Types

| Type | Trigger Examples |
|------|-----------------|
| Architecture | "architecture diagram", "system design" |
| Sequence | "sequence diagram", "interaction flow" |
| ER Diagram | "ER diagram", "database design" |
| Flowchart | "flowchart", "business process" |
| Deployment | "deployment diagram", "infrastructure" |
| UML Class | "class diagram", "UML" |
| C4 Model | "C4 diagram", "container diagram" |
| State Machine | "state machine", "state diagram" |
| Network Topology | "network diagram", "topology" |
| Data Flow | "data flow diagram", "DFD" |

## Project Structure

```
SKILL.md              Agent workflow instructions
references/           Rulebook & authoring guides
scripts/              validate.py, audit.js, export.js, build.js, install.js, utils.js
styles/               Visual style presets (schema + 7 built-in)
templates/            Prompt templates (zh/ + en/)
data/                 Structured JSON data files
```

## License

MIT
