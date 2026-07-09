# Tests

> Test suite for xiaosu-draw-ai. All tests use temporary directories — no pollution
> of the development environment.

## Test Layers

| Layer | Location | Dependencies | Trigger |
|-------|----------|-------------|---------|
| **L0** (unit) | `tests/unit/` | Python 3 (pytest) / Node.js | `npm test` or `python3 -m pytest tests/unit/` |
| **L1** (integration) | `tests/integration/` | Python 3 + draw.io CLI (optional) | `node tests/integration/*.js` |
| **L2** (e2e) | `tests/e2e/` | Everything + draw.io CLI | Manual only (`node tests/e2e/test_full_workflow.js`) |

## Quick Start

```bash
# L0: Unit tests (no external dependencies)
python3 -m pytest tests/unit/test_validate.py -v
node tests/unit/test_ir_schema.js

# L1: Integration tests (need draw.io CLI for some)
node tests/integration/test_cli_detect.js
node tests/integration/test_export.js          # Requires draw.io CLI
node tests/integration/test_golden_regression.js  # Requires Python 3

# L2: E2E tests (manual only — need full environment)
node tests/e2e/test_full_workflow.js
```

## Test Isolation

All tests that produce files use `os.tmpdir()` or `tempfile.mkdtemp()` — never write to
the project directory or `~/.claude/`. Temporary directories are cleaned up after each
test run.

## Golden Set

`tests/golden/` contains reference `.drawio` files that are **read-only**:
- `architecture.drawio` — multi-tier system architecture
- `c4.drawio` — C4 container diagram
- `class.drawio` — UML class diagram
- `data-flow.drawio` — data flow diagram
- `deployment.drawio` — deployment infrastructure diagram
- `er.drawio` — entity-relationship diagram
- `flowchart.drawio` — business process flowchart
- `network.drawio` — network topology diagram
- `sequence.drawio` — message sequence diagram
- `state-machine.drawio` — state machine diagram

Each file has been manually verified as structurally correct (P0/P1/P2 clean).
`test_golden_regression.js` ensures scores never regress.

### Updating Baselines

```bash
node tests/integration/test_golden_regression.js --update
```

Only do this when you've intentionally improved the golden files and verified
the visual output.

## Adding New Tests

### L0 Unit Test

1. Add test file to `tests/unit/`
2. Use mock XML or programmatic input — no filesystem or CLI dependency
3. Import from `scripts/` directly

### L1 Integration Test

1. Add test file to `tests/integration/`
2. Use `os.tmpdir()` for any temporary files
3. Gracefully skip (exit 0) if draw.io CLI is not available
4. Clean up temp files when done

### L2 E2E Test

1. Add test file to `tests/e2e/`
2. Must be manually triggered — never run automatically
3. Tests the full workflow: template → generate → validate → export → visual check

## CI

GitHub Actions workflow at `.github/workflows/test.yml` runs:
- L0 unit tests (Python + Node.js)
- L1 integration tests (with draw.io CLI via `xvfb-run`)
- Golden regression check

See `.github/workflows/test.yml` for the CI matrix.
