# Changelog

All notable changes to xiaosu-draw-ai will be documented in this file.

## Unreleased

### Changed

- **Directory restructuring**: All skill files moved from project root into `skills/xiaosu-draw-ai/` to match drawio-skill reference format
- **VERSION file removed**: `SKILL.md` frontmatter is now the sole version source (per DESIGN.md §1)
- **Styles converted to JSON**: 7 style presets migrated from Markdown prose to structured `styles/built-in/*.json` following `styles/schema.json`
- **DESIGN.md replaces xiaosu-draw-ai-design.md**: Authoritative design document renamed and restructured
- **CLAUDE.md**: All dev reference paths updated to `skills/xiaosu-draw-ai/` prefix; Phase description updated to Phase 4
- `scripts/lib/utils.js` → `scripts/utils.js`: Scripts directory flattened
- `scripts/build.js` output target: `output/` → `.claude/skills/xiaosu-draw-ai/`

### Added

- `tests/golden/`: 7 new golden fixtures (c4, class, data-flow, deployment, flowchart, network, state-machine) — total 10
- `tests/unit/`: test_audit.js + test_ir_schema.js + test_router.js + test_validate.py
- `tests/integration/`: test_cli_detect.js + test_export.js + test_golden_regression.js + test_pipeline_a.js
- `tests/e2e/`: test_full_workflow.js
- `.github/workflows/test.yml`: CI with 4 jobs (Python L0, Node L0, L1 Integration, Golden Regression)
- `.drawio/`: App store architecture + functional architecture + music app architecture diagrams
- `memory/`: Claude Code session memory with adversarial diagram review records
- `references/`: icons.md, troubleshooting.md, feishu-embed.md, pipeline-a-authoring.md, managed-agents-adaptation.md, dense-diagram-simplification.md
- `scripts/`: mermaid-convert.js, router.js, xml-parser.js, png-extract.js, install.js, importers/

## 1.0.0 (2026-07-08)

### Added

- Phase 4: Complete release — 7 visual styles, 3 pipelines, all reference docs
- `styles/style-5-glassmorphism.md` — Glassmorphism style: dark gradient background, frosted glass fills, ambient glow accents, Inter typography
- `styles/style-6-claude-official.md` — Claude Official style: warm cream background (#f8f6f3), semantic fills (blue/teal/beige/gray), 12px radius, soft shadows, arrow semantics table
- `styles/style-7-openai.md` — OpenAI style: white-on-white radical minimalism, #10a37f brand green accent, 1.5px thin strokes, 4px left-border accent strip, zero visual decoration
- `references/icons.md` — 60+ product brand colors across 5 categories: AI/ML (10), databases (8), cloud/infra (10), message queues (5), observability (6) with draw.io XML usage examples
- `references/troubleshooting.md` — Cross-platform troubleshooting: CLI detection, blank exports, Chinese text encoding, Unicode errors, version gates, memory issues, path differences
- `references/feishu-embed.md` — Feishu/Lark integration: Docx/Wiki embedding, bot message/image/file sharing, approval workflow integration, CI/CD auto-update patterns
- `references/pipeline-a-authoring.md` — Pipeline A architecture: IR JSON format, importer API interface, generator architecture, 8 planned importers, quality pipeline integration

### Changed

- `SKILL.md` — Version 1.0.0; style selection table expanded to all 7 styles; added bundled resources for icons, troubleshooting, feishu-embed, pipeline-a-authoring
- `VERSION` — 0.3.0 → 1.0.0 (first complete release)
- `scripts/build.js` — Manifest pipeline: "A/B/C (v1.0.0)"; added 6 new Phase 4 file validations

### Complete at 1.0.0

- **3 Pipelines:** A (data-driven, architected), B (Mermaid), C (hand-written XML)
- **7 Visual Styles:** Flat Icon, Dark Terminal, Blueprint, Notion Clean, Glassmorphism, Claude Official, OpenAI
- **10 Diagram Types:** Architecture, Sequence, ER, Flowchart, Deployment, Class, C4, State Machine, Network, Data Flow
- **20 Templates:** 10 zh/ + 10 en/ with guided questions + examples
- **7 Reference Docs:** rules, xml-authoring, diagram-types, mermaid-authoring, visual-audit, pipeline-a-authoring, icons, troubleshooting, feishu-embed
- **53 Unit Tests** + **Golden Regression** (3 fixtures at 0/0/0)

## 0.3.0 (2026-07-08)

### Added

- Phase 3: Multi-Pipeline
- `references/mermaid-authoring.md` — Mermaid-to-drawio conversion guide: 28 supported types, CLI v30+ gate, syntax rules, Pipeline B vs C decision criteria, troubleshooting
- `styles/style-2-dark-terminal.md` — Dark Terminal style: deep navy-black background (#0f0f1a), neon accent colors (purple/green/orange/blue/red/gold), monospace typography
- `styles/style-3-blueprint.md` — Blueprint style: dark navy background (#0a1628), cyan strokes (#00b4d8), sharp corners, engineering title block, monospace typography
- `styles/style-4-notion-clean.md` — Notion Clean style: white background, muted gray palette, single blue accent (#3b82f6) for edges, system sans-serif fonts, no icons/shadows
- `templates/zh/deployment.md` — Chinese deployment diagram template
- `templates/zh/class.md` — Chinese UML class diagram template
- `templates/zh/c4.md` — Chinese C4 model template
- `templates/zh/state-machine.md` — Chinese state machine template
- `templates/zh/network.md` — Chinese network topology template
- `templates/zh/data-flow.md` — Chinese data flow diagram template
- `templates/en/deployment.md` — English deployment diagram template
- `templates/en/class.md` — English UML class diagram template
- `templates/en/c4.md` — English C4 model template
- `templates/en/state-machine.md` — English state machine template
- `templates/en/network.md` — English network topology template
- `templates/en/data-flow.md` — English data flow diagram template

### Changed

- `SKILL.md` — Version bumped to 0.3.0; added Pipeline Selection routing tree; added Style Selection table (4 styles); expanded template table to all 10 types with pipeline assignments; added Pipeline B (Mermaid) 5-step workflow; added 3 new style files to bundled resources
- `VERSION` — Updated from 0.2.0 to 0.3.0
- `references/diagram-types.md` — Added Mermaid-suitable markers for structure-first diagram types
- `scripts/build.js` — Manifest pipeline: "C + B (Phase 3)"; added Phase 3 files to validation

## 0.2.0 (2026-07-08)

### Added

- Phase 2: Core diagramming capability
- `references/diagram-types.md` — Type-specific shape, color, layout, edge, and spacing presets for all 10 diagram types (architecture, sequence, ER, flowchart, deployment, class, C4, state machine, network, data flow)
- `references/visual-audit.md` — Comprehensive P3 visual audit guide with per-rule detection instructions, fix recipes, and XML before/after examples for R030-R039
- `templates/zh/architecture.md` — Chinese prompt template for architecture diagrams with guided questions and detailed examples
- `templates/zh/sequence.md` — Chinese prompt template for sequence diagrams
- `templates/zh/er.md` — Chinese prompt template for ER diagrams
- `templates/zh/flowchart.md` — Chinese prompt template for flowcharts
- `templates/en/architecture.md` — English prompt template for architecture diagrams
- `templates/en/sequence.md` — English prompt template for sequence diagrams
- `templates/en/er.md` — English prompt template for ER diagrams
- `templates/en/flowchart.md` — English prompt template for flowcharts
- `styles/style-1-flat-icon.md` — Default Flat Icon style with complete color tokens, typography, shape defaults, edge presets, and application rules
- `scripts/lib/utils.js` — Shared utility module (path resolution, file helpers, binary detection, YAML frontmatter validation) used by export.js and build.js
- `tests/unit/test_validate.py` — pytest unit tests for validate.py geometry helpers and P0/P1/P2 rule detection (40+ tests)
- `tests/integration/test_golden_regression.js` — Golden set regression test with baseline score tracking
- `tests/golden/scores.json` — Baseline validation scores for golden fixtures

### Changed

- `SKILL.md` — Version bumped to 0.2.0; added bundled resource entries for diagram-types.md, visual-audit.md, style-1-flat-icon.md, and templates; Step 1 now references diagram-types.md and templates for guided discovery; Step 2 references styles for color tokens; Step 5 references visual-audit.md for per-rule fix guidance; added template-guided conversation section with quick-reference table
- `VERSION` — Updated from 0.1.0 to 0.2.0
- `references/rules.md` — Added cross-reference to visual-audit.md for P3 rules

## 0.1.0 (2026-07-07)

### Added

- Phase 1: Project skeleton
- CLAUDE.md — modification routing table for developers
- VERSION file (0.1.0) — human-managed, AI read-only
- SKILL.md — Agent workflow instructions (Pipeline C only)
- `references/rules.md` — P0-P3 pixel-level rule system with spacing/layout constants
- `references/xml-authoring.md` — .drawio XML authoring guide (shape styles, palette, layout tips)
- `scripts/validate.py` — structural lint with P0/P1/P2 rule checks and readability scoring
- `scripts/export.js` — draw.io CLI export wrapper with cross-platform binary detection
- `scripts/build.js` — packaging workflow (validate → copy → generate README + manifest)
- `tests/golden/architecture.drawio` — golden fixture: microservices architecture diagram
- `tests/golden/sequence.drawio` — golden fixture: login sequence diagram
- `tests/golden/er.drawio` — golden fixture: User-Order-Product ER diagram
- Project README.md — English readme with quick start, installation, diagram types table
