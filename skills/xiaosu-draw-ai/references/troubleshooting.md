# Troubleshooting Guide

> Common issues and solutions across Windows, macOS, and Linux.
> Read when the draw.io CLI, validate.py, or export.js behaves unexpectedly.

---

## draw.io CLI Not Found

**Symptom:** `export.js` exits with "draw.io CLI not found."

**Platform-specific fixes:**

| Platform | Solution |
|----------|----------|
| **Windows** | Add `C:\Program Files\draw.io` to PATH. Or install from https://www.drawio.com/. Restart terminal after install. |
| **macOS** | `brew install --cask drawio`. If already installed, check `/Applications/draw.io.app/Contents/MacOS/draw.io`. |
| **Linux** | `snap install drawio` or download AppImage. Check `/usr/bin/drawio` or `/opt/draw.io/drawio`. |

**Binary name differences:**
- Some installs use `drawio`, others use `draw.io` (with dot).
- `export.js` auto-detects both names across all platforms.

---

## Export Produces Blank/White PNG

**Symptom:** `export.js` succeeds but the output PNG is entirely white or blank.

**Causes & fixes:**
1. **Self-closing edge geometry:** Edge `<mxGeometry/>` tags must be expanded (`<mxGeometry>...</mxGeometry>`). Self-closing edges don't render. Run `validate.py` to detect.
2. **Missing page selection:** If the `.drawio` has multiple pages, the first page may be blank. Add `-p 0` to export arguments.
3. **All shapes off-canvas:** Shapes with negative or very large coordinates. Run `validate.py --strict` to check R014.
4. **Empty diagram:** No user cells (only id=0 and id=1 exist). Check the XML.

---

## Export Produces 0-Byte or Truncated File

**Symptom:** Output PNG is 0 bytes or appears truncated (file size much smaller than expected).

**Causes & fixes:**
1. **Disk full:** Check available disk space.
2. **draw.io CLI crash:** The CLI process may have been killed. Retry with explicit `--output` path.
3. **IEND truncation (known draw.io bug):** Some CLI versions truncate the PNG IEND chunk. Known fix: re-export, or open in draw.io desktop and re-save.

---

## Chinese Text Renders as Boxes / Gibberish

**Symptom:** Chinese characters in `.drawio` labels appear as empty boxes (□□□) or random characters in the exported PNG.

**Causes & fixes:**
1. **Font not installed:** draw.io uses system fonts. Ensure a CJK font is installed (Microsoft YaHei on Windows, PingFang SC on macOS, Noto Sans CJK on Linux).
2. **XML encoding:** Verify the `.drawio` file declares `encoding="UTF-8"` in the XML declaration.
3. **Font in style string:** Explicitly set `fontFamily=Microsoft YaHei;` or `fontFamily=PingFang SC;` in style strings for Chinese labels.

---

## validate.py UnicodeEncodeError on Windows

**Symptom:** `UnicodeEncodeError: 'gbk' codec can't encode character '✓'`

**Cause:** Windows terminal uses GBK code page by default; the checkmark character (✓) can't be encoded.

**Fix:** Use `--json` output mode instead:
```bash
python3 scripts/validate.py <file>.drawio --json --score
```
This avoids terminal encoding issues entirely. The `--json` flag outputs clean UTF-8 JSON.

---

## CLI Version Too Old for Pipeline B (Mermaid)

**Symptom:** `drawio -x -f xml -o out.drawio in.mmd` fails with "Export failed."

**Cause:** draw.io CLI < v30 does not support `.mmd` input.

**Fix:**
1. Check version: `drawio --version`
2. If < v30: **always use Pipeline C** (hand-write XML). Do not attempt Mermaid conversion.
3. Upgrade draw.io desktop app to latest version for v30+ support.

---

## Memory Issues with Large Diagrams

**Symptom:** draw.io CLI hangs or crashes with large diagrams (>50 nodes, >100 edges).

**Fixes:**
1. Split the diagram into multiple pages (one `<diagram>` per page in the `.drawio` file).
2. Reduce export resolution: `--scale 1` instead of `--scale 4`.
3. Export as SVG first to check rendering, then PNG.

---

## Cross-Platform Path Issues

**Symptom:** Scripts fail with path-related errors when moving between Windows and macOS/Linux.

**Fixes:**
1. Always use `path.join()` in Node.js scripts (handles platform separators).
2. In Python, use `os.path.join()` or `pathlib.Path`.
3. Avoid hardcoding `/tmp/` — use `os.tmpdir()` (Node.js) or `tempfile.gettempdir()` (Python).
4. Forward slashes work in most Windows contexts (Git Bash, `scripts/export.js`).

---

## Python 3 Not Available

**Symptom:** `python3` command not found.

**Fixes:**
1. Try `python` instead of `python3` (Windows may only have `python`).
2. `export.js` and `build.js` work without Python — only `validate.py` requires it.
3. Install Python 3 from https://python.org (≥ 3.8).

---

## Node.js Not Available

**Symptom:** `node` command not found.

**Fixes:**
1. Install Node.js from https://nodejs.org (≥ 14.0, LTS recommended).
2. `validate.py` works without Node.js — only `export.js` and `build.js` require it.
