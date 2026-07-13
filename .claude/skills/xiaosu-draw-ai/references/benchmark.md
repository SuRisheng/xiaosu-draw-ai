# Benchmark & Metrics Guide

> Collect timing and token metrics for a single diagram generation invocation.
>
> **When to read:** User says "benchmark", "measure", "统计性能", or "耗时统计".

---

## Setup (Before Step 1)

Before entering the workflow, record the start time:

```bash
date +%s
```

Store the result as `T0`.

---

## Teardown (After Final Export, Step 6)

After the final export completes, record the end time:

```bash
date +%s
```

Store the result as `T1`. Calculate `ΔT = T1 - T0` seconds.

---

## Collect Diagram Metrics

From the generated `.drawio` file, count:

| Metric | How to get |
|--------|------------|
| Diagram type | From Step 1 plan |
| Style preset | From Step 2 (`styles/built-in/<name>.json`) |
| Pipeline | C (hand-write), B (Mermaid), or A (importer) |
| Nodes | Count `<mxCell>` with `vertex="1"` |
| Edges | Count `<mxCell>` with `edge="1"` |
| Validate rounds | How many times validate.py ran before passing (max 3) |
| Visual check rounds | 0 (vision skipped), 1, or 2 |
| Revisions | How many user-requested revision rounds (before final approval) |

Count nodes and edges from the generated XML:

```bash
grep -c 'vertex="1"' .drawio/<diagram-name>.drawio
grep -c 'edge="1"' .drawio/<diagram-name>.drawio
```

---

## Get Token Data

The model cannot directly read its API token counts. Use one of these:

### Method 1: Session usage (coarse)

Run `/usage` in Claude Code after the diagram is delivered. This gives session totals: input tokens, output tokens, and cache hits since the current conversation started.

### Method 2: System message (if available)

Occasionally the system prompt includes current session usage. If visible, report the numbers. If not, skip and use Method 1.

### Method 3: Rough estimate

If neither Method 1 nor 2 is available, give an order-of-magnitude estimate:

| Component | Typical tokens |
|-----------|---------------|
| SKILL.md | ~10,000 |
| CLAUDE.md | ~2,000 |
| `references/diagram-types.md` | ~3,000 |
| `references/xml-authoring.md` | ~4,000 |
| Style preset JSON | ~500–1,500 |
| `references/rules.md` (partial) | ~1,000–2,000 |
| `references/visual-audit.md` | ~3,000 |
| Conversation + XML generation | Varies widely |
| **Typical total input (cached + fresh)** | ~25,000–60,000 |
| **Typical total output** | ~2,000–8,000 |

> **Cache hit note:** SKILL.md, CLAUDE.md, and the first few reference files are usually cached. Fresh reads and conversation turns are not.

---

## Report Format

After the final export, report all metrics to the user:

```
📊 Generation Metrics
├── ⏱ Time: Xm Ys
├── 📐 Diagram: <type> | <N> nodes, <M> edges | <style>
├── 🔧 Pipeline: <A/B/C> | Validates: <n> rounds | Visual: <n> rounds
├── 🔄 Revisions: <n> rounds
└── 📈 Tokens (session)
    ├── Input: ~XXX K
    ├── Output: ~XX K
    ├── Cache hit: ~XX%
    └── Method: <session usage / system message / estimate>
```
