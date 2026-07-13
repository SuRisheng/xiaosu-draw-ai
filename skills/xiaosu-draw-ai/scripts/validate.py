#!/usr/bin/env python3
"""
validate.py — Structural lint and P0-P2 audit for .drawio files.

Usage:
    python3 validate.py <file.drawio>              # Basic audit
    python3 validate.py <file.drawio> --strict     # Warnings become errors
    python3 validate.py <file.drawio> --score      # Print readability score
    python3 validate.py <file.drawio> --json       # JSON output

Exit codes:
    0 — Pass (P2 warnings only, unless --strict)
    1 — P1 errors found (or any warning with --strict)
    2 — P0 blocking errors found

References:
    - drawio-skill scripts/validate.py (structural detection engine)
    - references/rules.md (P0-P3 rule definitions and IDs)
"""

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict

# Ensure UTF-8 output on Windows GBK consoles (Python 3.7+)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')


# ── Geometry Helpers ──────────────────────────────────────────────

def parse_geometry(cell):
    """Extract (x, y, w, h) from a cell's mxGeometry child. Returns None if missing."""
    geom = cell.find('mxGeometry')
    if geom is None:
        return None
    try:
        x = float(geom.get('x', 0))
        y = float(geom.get('y', 0))
        w = float(geom.get('width', 0))
        h = float(geom.get('height', 0))
        return (x, y, w, h)
    except (ValueError, TypeError):
        return None


def rect_from_geom(g):
    """Convert (x, y, w, h) to (left, top, right, bottom)."""
    x, y, w, h = g
    return (x, y, x + w, y + h)


def overlap_px(a, b, margin=8):
    """Check if two rectangles overlap, with optional safety margin.
    Returns True if they overlap (considering margin)."""
    a_left, a_top, a_right, a_bottom = a
    b_left, b_top, b_right, b_bottom = b
    # Expand both rects by margin for early warning
    return not (
        a_right + margin <= b_left - margin or
        b_right + margin <= a_left - margin or
        a_bottom + margin <= b_top - margin or
        b_bottom + margin <= a_top - margin
    )


def segments_cross(p1, p2, p3, p4):
    """Check if line segment p1-p2 crosses segment p3-p4.
    Returns crossing point or None."""
    x1, y1 = p1
    x2, y2 = p2
    x3, y3 = p3
    x4, y4 = p4

    denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if abs(denom) < 1e-10:
        return None  # Parallel

    t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
    u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

    if 0 < t < 1 and 0 < u < 1:
        return (x1 + t * (x2 - x1), y1 + t * (y2 - y1))
    return None


def route_hits_rect(segments, rect):
    """Check if any segment in a list of (p1, p2) pairs crosses a rectangle.
    A segment crosses if any of its interior points fall inside the rect.
    Simplified: check if the segment line intersects the rect edges."""
    r_left, r_top, r_right, r_bottom = rect
    edges = [
        ((r_left, r_top), (r_right, r_top)),
        ((r_right, r_top), (r_right, r_bottom)),
        ((r_right, r_bottom), (r_left, r_bottom)),
        ((r_left, r_bottom), (r_left, r_top)),
    ]
    for seg_start, seg_end in segments:
        for e_start, e_end in edges:
            if segments_cross(seg_start, seg_end, e_start, e_end):
                return True
    return False


def segment_length(p1, p2):
    """Euclidean distance between two points."""
    return ((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2) ** 0.5


def is_off_grid(val, grid=10):
    """Check if a coordinate/dimension is a multiple of grid size."""
    return abs(val) % grid > 0.001


def resolve_absolute_geometry(cell, all_cells):
    """Get absolute position of a cell by walking up the parent chain.

    Child cells inside swimlanes/groups have coordinates relative to their
    container. This function accumulates parent offsets to return the
    absolute position on the canvas. For top-level cells (parent is '1'
    or '0'), returns the geometry unchanged."""
    geom = parse_geometry(cell)
    if geom is None:
        return None
    x, y, w, h = geom
    parent_id = cell.get('parent', '')
    depth = 0
    while parent_id and parent_id not in RESERVED_IDS and depth < 10:
        parent = all_cells.get(parent_id)
        if parent is None:
            break
        parent_geom = parse_geometry(parent)
        if parent_geom:
            x += parent_geom[0]
            y += parent_geom[1]
        parent_id = parent.get('parent', '')
        depth += 1
    return (x, y, w, h)


# ── Validation Logic ───────────────────────────────────────────────

RESERVED_IDS = {"0", "1"}


def validate_drawio(filepath):
    """Run all P0/P1/P2 checks on a .drawio file.
    Returns a dict with 'errors' and 'warnings' lists.
    Each entry is a dict with 'id' (rule ID) and 'message'."""

    errors = []
    warnings = []

    # ── Parse XML ──
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
    except ET.ParseError as e:
        errors.append({
            "id": "R004",
            "message": f"XML parse error: {e}"
        })
        return {"errors": errors, "warnings": warnings}
    except FileNotFoundError:
        errors.append({
            "id": "R004",
            "message": f"File not found: {filepath}"
        })
        return {"errors": errors, "warnings": warnings}

    # Find all diagram pages
    # Handle potential UserObject wrappers: resolve wrapper -> real cell
    ns = {'': ''}  # No namespace
    diagrams = root.findall('.//diagram')

    all_cells = {}
    all_edges = []
    all_vertices = []
    cell_to_page = {}
    duplicate_ids = set()  # Track which IDs were duplicates (first occurrence kept)

    for diag in diagrams:
        model = diag.find('.//mxGraphModel')
        if model is None:
            continue
        # Collect all cells, including those wrapped in UserObject (draw.io v30+ Mermaid format)
        raw_cells = model.findall('root/mxCell')
        # UserObject-wrapped cells (Mermaid conversion): extract id/label from wrapper
        for uo in model.findall('root/UserObject'):
            inner = uo.find('mxCell')
            if inner is not None:
                # Transfer id and value from UserObject wrapper to inner mxCell
                uo_id = uo.get('id', '')
                if uo_id and not inner.get('id'):
                    inner.set('id', uo_id)
                uo_label = uo.get('label', '')
                if uo_label and not inner.get('value'):
                    inner.set('value', uo_label)
                raw_cells.append(inner)
        for cell in raw_cells:
            cell_id = cell.get('id', '')
            if not cell_id:
                continue

            # R002: Detect duplicate IDs at parse time (before dict overwrite)
            if cell_id in all_cells:
                duplicate_ids.add(cell_id)
                errors.append({
                    "id": "R002",
                    "message": f"Duplicate cell id='{cell_id}' (keeping first occurrence for lookups)"
                })
            else:
                all_cells[cell_id] = cell

            cell_to_page[cell_id] = diag.get('name', 'Page-1')

            parent = cell.get('parent', '')
            is_edge = cell.get('edge') == '1'
            is_vertex = cell.get('vertex') == '1'

            if is_edge:
                all_edges.append(cell)
            elif is_vertex:
                all_vertices.append(cell)

    # ── P0: R001 — Dangling Edges ──
    for edge in all_edges:
        edge_id = edge.get('id', '?')
        source = edge.get('source', '')
        target = edge.get('target', '')
        if source and source not in all_cells:
            errors.append({
                "id": "R001",
                "message": f"Dangling edge id='{edge_id}': source='{source}' does not exist"
            })
        if target and target not in all_cells:
            errors.append({
                "id": "R001",
                "message": f"Dangling edge id='{edge_id}': target='{target}' does not exist"
            })

    # ── P0: R003 — Parent-Child Breakage ──
    for cell in all_cells.values():
        cell_id = cell.get('id', '?')
        parent = cell.get('parent', '')
        if parent and parent not in RESERVED_IDS and parent not in all_cells:
            errors.append({
                "id": "R003",
                "message": f"Cell id='{cell_id}': parent='{parent}' does not exist"
            })

    # ── P0: R005 — Missing Geometry (vertex) / Self-Closing Edge (edge) ──
    for vertex in all_vertices:
        vid = vertex.get('id', '?')
        geom = vertex.find('mxGeometry')
        if geom is None:
            errors.append({
                "id": "R005",
                "message": f"Vertex id='{vid}': missing <mxGeometry> child element"
            })

    for edge in all_edges:
        eid = edge.get('id', '?')
        geom = edge.find('mxGeometry')
        if geom is None:
            errors.append({
                "id": "R015",
                "message": f"Edge id='{eid}': missing <mxGeometry> child (self-closing edge)"
            })

    # ── P1: R010 — Overlapping Siblings ──
    # Group vertices by parent
    siblings_by_parent = defaultdict(list)
    for vertex in all_vertices:
        parent = vertex.get('parent', '1')
        geom = parse_geometry(vertex)
        if geom:
            siblings_by_parent[parent].append((vertex, geom))

    for parent_id, siblings in siblings_by_parent.items():
        for i in range(len(siblings)):
            for j in range(i + 1, len(siblings)):
                v1, g1 = siblings[i]
                v2, g2 = siblings[j]
                # Skip boundary/zone containers — visual boundaries that
                # intentionally overlap with the nodes they contain
                s1 = v1.get('style', '')
                s2 = v2.get('style', '')
                if 'swimlane' in s1 or 'fillColor=none' in s1:
                    continue
                if 'swimlane' in s2 or 'fillColor=none' in s2:
                    continue
                r1 = rect_from_geom(g1)
                r2 = rect_from_geom(g2)
                if g1[2] > 0 and g1[3] > 0 and g2[2] > 0 and g2[3] > 0:
                    if overlap_px(r1, r2, margin=8):
                        warnings.append({
                            "id": "R010",
                            "message": f"Overlapping siblings: id='{v1.get('id')}' and id='{v2.get('id')}' (parent='{parent_id}')"
                        })

    # ── P1: R011 — Edge Through Vertex / R012 — Edge Crossings ──
    # Build geometry for waypointed edges
    waypointed_edges = []
    for edge in all_edges:
        geom = edge.find('mxGeometry')
        if geom is None:
            continue
        points_arr = geom.find('Array')
        if points_arr is None:
            continue
        # Get source and target positions
        source_id = edge.get('source', '')
        target_id = edge.get('target', '')

        src_geom = None
        tgt_geom = None
        if source_id in all_cells:
            src_geom = resolve_absolute_geometry(all_cells[source_id], all_cells)
        if target_id in all_cells:
            tgt_geom = resolve_absolute_geometry(all_cells[target_id], all_cells)

        # Build segment list
        points = []
        for pt in points_arr.findall('mxPoint'):
            points.append((float(pt.get('x', 0)), float(pt.get('y', 0))))

        if len(points) < 2 and (not src_geom or not tgt_geom):
            continue

        # Parse exit/entry connection points from edge style
        # Default to center (0.5, 0.5) if not specified
        edge_style = edge.get('style', '')
        def _parse_conn_point(style, prefix):
            """Parse exitX/exitY or entryX/entryY from style string. Returns (x_frac, y_frac)."""
            x_match = re.search(rf'(?<!\w){prefix}X=([0-9.]+)', style)
            y_match = re.search(rf'(?<!\w){prefix}Y=([0-9.]+)', style)
            x_val = float(x_match.group(1)) if x_match else 0.5
            y_val = float(y_match.group(1)) if y_match else 0.5
            return x_val, y_val

        exit_x, exit_y = _parse_conn_point(edge_style, 'exit')
        entry_x, entry_y = _parse_conn_point(edge_style, 'entry')

        # Reconstruct full path using actual exit/entry points (matching draw.io router)
        path = []
        if src_geom:
            sx, sy, sw, sh = src_geom
            path.append((sx + sw * exit_x, sy + sh * exit_y))
        else:
            if points:
                path.append(points[0])

        path.extend(points)

        if tgt_geom:
            tx, ty, tw, th = tgt_geom
            path.append((tx + tw * entry_x, ty + th * entry_y))
        else:
            if points:
                path.append(points[-1])

        # Build segments
        segments = []
        for k in range(len(path) - 1):
            segments.append((path[k], path[k + 1]))

        waypointed_edges.append((edge, segments))

    # R011: Edge through vertex
    # Skip swimlane containers — they are transparent visual boundaries,
    # not opaque obstacles. Edges routing through the gap between
    # adjacent swimlanes at the page level is correct behavior.
    def _is_container_or_boundary(vertex):
        style = vertex.get('style', '')
        return 'swimlane' in style or 'fillColor=none' in style

    for edge, segments in waypointed_edges:
        edge_id = edge.get('id', '?')
        source_id = edge.get('source', '')
        target_id = edge.get('target', '')
        for vertex in all_vertices:
            vid = vertex.get('id', '')
            if vid == source_id or vid == target_id:
                continue
            # Skip containers (swimlanes) — visual boundaries, not obstacles
            if _is_container_or_boundary(vertex):
                continue
            # Skip nodes nested inside containers — their parent container
            # being crossed by an edge is a property of the container, not
            # the child (e.g., ER diagram fields inside an entity)
            parent_id = vertex.get('parent', '1')
            if parent_id not in RESERVED_IDS and parent_id in all_cells:
                if _is_container_or_boundary(all_cells[parent_id]):
                    continue
            vgeom = resolve_absolute_geometry(vertex, all_cells)
            if vgeom and vgeom[2] > 0 and vgeom[3] > 0:
                vrect = rect_from_geom(vgeom)
                if route_hits_rect(segments, vrect):
                    warnings.append({
                        "id": "R011",
                        "message": f"Edge id='{edge_id}' passes through vertex id='{vid}'"
                    })

    # R012: Edge crossings
    for i in range(len(waypointed_edges)):
        for j in range(i + 1, len(waypointed_edges)):
            e1, segs1 = waypointed_edges[i]
            e2, segs2 = waypointed_edges[j]
            crossing = False
            for s1_start, s1_end in segs1:
                for s2_start, s2_end in segs2:
                    if segments_cross(s1_start, s1_end, s2_start, s2_end):
                        crossing = True
                        break
                if crossing:
                    break
            if crossing:
                warnings.append({
                    "id": "R012",
                    "message": f"Edges cross: id='{e1.get('id')}' and id='{e2.get('id')}'"
                })

    # ── P1: R016 — Waypoint-Entry Misalignment ──
    # For edges with explicit entryX/entryY, the last waypoint must be axis-aligned
    # with the target entry point. Violation causes diagonal stub segments and
    # rotated arrow heads.
    for edge in all_edges:
        edge_id = edge.get('id', '?')
        edge_style = edge.get('style', '')
        source_id = edge.get('source', '')
        target_id = edge.get('target', '')

        # Only check edges with explicit entry points
        entry_match = re.search(r'(?<!\w)entryX=([0-9.]+)', edge_style)
        if not entry_match:
            continue

        # Check if this is a vertical entry (TOP or BOTTOM)
        entry_y_match = re.search(r'(?<!\w)entryY=([0-9.]+)', edge_style)
        entry_x_val = float(entry_match.group(1))
        entry_y_val = float(entry_y_match.group(1)) if entry_y_match else 0.5

        # Get target geometry
        if target_id not in all_cells:
            continue
        tgt_geom = resolve_absolute_geometry(all_cells[target_id], all_cells)
        if not tgt_geom:
            continue
        tx, ty, tw, th = tgt_geom
        entry_x = tx + tw * entry_x_val
        entry_y = ty + th * entry_y_val

        # Get waypoints
        geom = edge.find('mxGeometry')
        if geom is None:
            continue
        points_arr = geom.find('Array')
        if points_arr is None:
            continue
        points = []
        for pt in points_arr.findall('mxPoint'):
            points.append((float(pt.get('x', 0)), float(pt.get('y', 0))))
        if not points:
            continue

        wp_last = points[-1]

        # R016 check: vertical entry (entryY=0 or 1) → wp_last.x must == entry_x
        #             horizontal entry (entryX=0 or 1) → wp_last.y must == entry_y
        is_vertical_entry = abs(entry_y_val - 0.0) < 0.01 or abs(entry_y_val - 1.0) < 0.01
        is_horizontal_entry = abs(entry_x_val - 0.0) < 0.01 or abs(entry_x_val - 1.0) < 0.01

        if is_vertical_entry:
            if abs(wp_last[0] - entry_x) > 1.0:  # >1px tolerance
                warnings.append({
                    "id": "R016",
                    "message": (
                        f"Edge id='{edge_id}': last waypoint x={wp_last[0]:.0f} "
                        f"misaligned with vertical entry x={entry_x:.0f} "
                        f"(delta={abs(wp_last[0] - entry_x):.0f}px). Align wp_last.x to entry_x."
                    )
                })
        elif is_horizontal_entry:
            if abs(wp_last[1] - entry_y) > 1.0:
                warnings.append({
                    "id": "R016",
                    "message": (
                        f"Edge id='{edge_id}': last waypoint y={wp_last[1]:.0f} "
                        f"misaligned with horizontal entry y={entry_y:.0f} "
                        f"(delta={abs(wp_last[1] - entry_y):.0f}px). Align wp_last.y to entry_y."
                    )
                })

    # ── P1: R013 — Insufficient Spacing (Connected Nodes) ──
    # Edge-connected node pairs must have sufficient center-to-center distance.
    # Minimums: 80px general, 120px vertical (TB layout), 100px horizontal (LR layout).
    # Since layout direction isn't always encoded in XML, we use a general minimum
    # of 80px and flag tighter connected pairs.
    MIN_CONNECTED_SPACING = 80  # general center-to-center minimum

    for edge in all_edges:
        source_id = edge.get('source', '')
        target_id = edge.get('target', '')
        if not source_id or not target_id:
            continue
        src_cell = all_cells.get(source_id)
        tgt_cell = all_cells.get(target_id)
        if src_cell is None or tgt_cell is None:
            continue

        src_geom = resolve_absolute_geometry(src_cell, all_cells)
        tgt_geom = resolve_absolute_geometry(tgt_cell, all_cells)
        if not src_geom or not tgt_geom or src_geom[2] <= 0 or src_geom[3] <= 0 or tgt_geom[2] <= 0 or tgt_geom[3] <= 0:
            continue

        sx, sy, sw, sh = src_geom
        tx, ty, tw, th = tgt_geom
        src_cx = sx + sw / 2
        src_cy = sy + sh / 2
        tgt_cx = tx + tw / 2
        tgt_cy = ty + th / 2

        center_dist = ((tgt_cx - src_cx) ** 2 + (tgt_cy - src_cy) ** 2) ** 0.5

        if center_dist < MIN_CONNECTED_SPACING:
            # Determine likely layout direction for a more specific message
            dx = abs(tgt_cx - src_cx)
            dy = abs(tgt_cy - src_cy)
            direction = "vertical" if dy > dx else "horizontal"

            warnings.append({
                "id": "R013",
                "message": (
                    f"Edge id='{edge.get('id', '?')}': connected nodes id='{source_id}' and id='{target_id}' "
                    f"center-to-center distance={center_dist:.0f}px < {MIN_CONNECTED_SPACING}px "
                    f"(likely {direction} layout)"
                )
            })

    # ── P1: R014 — Off-Canvas ──
    for vertex in all_vertices:
        vid = vertex.get('id', '?')
        geom = parse_geometry(vertex)
        if geom:
            x, y, w, h = geom
            if x < 0 or y < 0:
                warnings.append({
                    "id": "R014",
                    "message": f"Vertex id='{vid}' has negative coordinates (x={x}, y={y})"
                })

    # ── P2: R020 — Off-Grid Geometry ──
    # Build lookup for centering detection: group vertices by parent
    vertices_by_parent = defaultdict(list)
    for vertex in all_vertices:
        parent = vertex.get('parent', '1')
        vgeom = parse_geometry(vertex)
        if vgeom:
            vertices_by_parent[parent].append((vertex.get('id'), vgeom))

    def _is_centered_with_sibling(cell_id, vx, vy, vw, vh, parent):
        """Check if off-grid x or y is due to intentional centering with a sibling.
        Returns True when this vertex shares a center-x or center-y with a sibling
        and the off-grid offset is small (≤5px from nearest grid line)."""
        siblings = vertices_by_parent.get(parent, [])
        center_x = vx + vw / 2
        center_y = vy + vh / 2
        # Only worth checking if the off-grid delta is small (≤5px)
        def nearest_grid(val):
            return round(val / 10) * 10
        if abs(vx - nearest_grid(vx)) > 5 and abs(vy - nearest_grid(vy)) > 5:
            return False
        for sid, (sx, sy, sw, sh) in siblings:
            if sid == cell_id or sw == 0 or sh == 0:
                continue
            s_center_x = sx + sw / 2
            s_center_y = sy + sh / 2
            # Any sibling whose center-x or center-y matches → intentional alignment
            if abs(center_x - s_center_x) <= 1 or abs(center_y - s_center_y) <= 1:
                return True
        return False

    for cell in list(all_vertices) + list(all_edges):
        cid = cell.get('id', '?')
        parent = cell.get('parent', '1')
        geom = parse_geometry(cell)
        if geom:
            x, y, w, h = geom
            off_fields = []
            off_grid_x = x != 0 and is_off_grid(x)
            off_grid_y = y != 0 and is_off_grid(y)
            # Check centering only when the off-grid delta is small (≤5px)
            centered = False
            if off_grid_x or off_grid_y:
                centered = _is_centered_with_sibling(cid, x, y, w, h, parent)
            if off_grid_x and not centered:
                off_fields.append(f"x={x}")
            if off_grid_y and not centered:
                off_fields.append(f"y={y}")
            if w > 0 and is_off_grid(w):
                off_fields.append(f"width={w}")
            if h > 0 and is_off_grid(h):
                off_fields.append(f"height={h}")
            if off_fields:
                warnings.append({
                    "id": "R020",
                    "message": f"Cell id='{cid}': off-grid ({', '.join(off_fields)})"
                })

    # ── P2: R021 — Non-Centered Connection Points ──
    for edge in all_edges:
        eid = edge.get('id', '?')
        exit_x = edge.get('exitX')
        exit_y = edge.get('exitY')
        entry_x = edge.get('entryX')
        entry_y = edge.get('entryY')

        checks = []
        if exit_x is not None:
            try:
                if abs(float(exit_x) - 0.5) > 0.01:
                    checks.append(f"exitX={exit_x}")
            except ValueError:
                pass
        if exit_y is not None:
            try:
                if abs(float(exit_y) - 0.5) > 0.01:
                    checks.append(f"exitY={exit_y}")
            except ValueError:
                pass
        if entry_x is not None:
            try:
                if abs(float(entry_x) - 0.5) > 0.01:
                    checks.append(f"entryX={entry_x}")
            except ValueError:
                pass
        if entry_y is not None:
            try:
                if abs(float(entry_y) - 0.5) > 0.01:
                    checks.append(f"entryY={entry_y}")
            except ValueError:
                pass

        if checks:
            warnings.append({
                "id": "R021",
                "message": f"Edge id='{eid}': non-centered connection points ({', '.join(checks)})"
            })

    # ── P2: R022 — Arrow Final Segment Too Short ──
    for edge, segments in waypointed_edges:
        if segments:
            last_seg = segments[-1]
            length = segment_length(last_seg[0], last_seg[1])
            if length < 15:
                warnings.append({
                    "id": "R022",
                    "message": f"Edge id='{edge.get('id')}': final segment length={length:.1f}px (< 15px)"
                })

    return {"errors": errors, "warnings": warnings}


def compute_score(results):
    """Compute weighted readability score from results.
    Lower is better. 0 = perfect."""
    weights = {
        "R011": 20,  # Edge through vertex
        "R012": 10,  # Edge crossing
        "R010": 5,   # Overlapping
        "R020": 1,   # Off-grid
        "R021": 2,   # Non-centered connection
        "R022": 3,   # Short arrow segment
    }
    score = 0
    for e in results["errors"]:
        score += weights.get(e["id"], 10)
    for w in results["warnings"]:
        score += weights.get(w["id"], 1)
    return score


def main():
    parser = argparse.ArgumentParser(
        description="Structural lint and P0-P2 audit for .drawio files"
    )
    parser.add_argument("file", help="Path to .drawio file")
    parser.add_argument("--strict", action="store_true",
                        help="Treat warnings as errors (non-zero exit)")
    parser.add_argument("--score", action="store_true",
                        help="Print readability score")
    parser.add_argument("--json", action="store_true",
                        help="Output results as JSON")

    args = parser.parse_args()
    results = validate_drawio(args.file)

    # Compute score if requested
    score = compute_score(results) if args.score else None

    # Determine if there are blocking errors
    has_p0 = any(e["id"].startswith("R00") for e in results["errors"])
    has_errors = len(results["errors"]) > 0
    has_warnings = len(results["warnings"]) > 0

    if args.json:
        output = {
            "file": args.file,
            "errors": results["errors"],
            "warnings": results["warnings"],
            "error_count": len(results["errors"]),
            "warning_count": len(results["warnings"]),
        }
        if score is not None:
            output["score"] = score
        print(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        # Human-readable output
        if results["errors"]:
            print(f"\n=== ERRORS ({len(results['errors'])}) ===")
            for e in results["errors"]:
                print(f"  [{e['id']}] {e['message']}")

        if results["warnings"]:
            print(f"\n=== WARNINGS ({len(results['warnings'])}) ===")
            for w in results["warnings"]:
                print(f"  [{w['id']}] {w['message']}")

        if not results["errors"] and not results["warnings"]:
            print("✓ No issues found.")

        if score is not None:
            print(f"\nReadability score: {score} (lower is better, 0 = perfect)")

        print(f"\nSummary: {len(results['errors'])} error(s), {len(results['warnings'])} warning(s)")

    # Exit code
    # P0 errors → exit 2
    # P1 errors → exit 1
    # Warnings only with --strict → exit 1
    # Warnings only without --strict → exit 0
    # No issues → exit 0
    if has_p0:
        sys.exit(2)
    elif has_errors:
        sys.exit(1)
    elif has_warnings and args.strict:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
