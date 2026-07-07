# Changelog

All notable changes to xiaosu-draw-ai will be documented in this file.

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
