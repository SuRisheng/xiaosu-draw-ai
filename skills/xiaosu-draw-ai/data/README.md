# Data Directory

> Structured JSON data files consumed by xiaosu-draw-ai scripts and AI agents.

## Purpose

The `data/` directory holds machine-readable JSON data files used by automated
scripts and AI agents. This is separate from `styles/` (which holds style
presets) and `references/` (which holds prose documentation for AI agents).

## Current Contents

*Reserved for future use.* Planned data files include:
- Shape index for draw.io shape search
- Technology icon color mappings
- Diagram type defaults

## Format Convention

All JSON files in `data/` should:
- Be valid JSON (UTF-8 encoding)
- Include a `"$schema"` field referencing their schema if applicable
- Be formatted with 2-space indentation for readability

## Related

- `styles/schema.json` — JSON Schema for style presets
- `styles/built-in/` — Style preset JSON files
- `scripts/` — Scripts that may consume data files
