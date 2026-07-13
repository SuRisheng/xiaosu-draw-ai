"""
Unit tests for scripts/validate.py.

Tests each P0/P1/P2 rule independently using mock XML inputs.
Run: python3 -m pytest tests/unit/test_validate.py -v

References:
    - references/rules.md (P0-P3 rule definitions)
    - scripts/validate.py (implementation under test)
"""

import pytest
import sys
import os
import tempfile

# Add project root to path for import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'skills', 'xiaosu-draw-ai', 'scripts'))
from validate import (
    parse_geometry, rect_from_geom, overlap_px, segments_cross,
    route_hits_rect, segment_length, is_off_grid, validate_drawio,
    compute_score
)


# ── Helpers ────────────────────────────────────────────────────────

SKELETON_HEAD = '''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio" version="26.0.0" type="device">
  <diagram name="Test" id="test-1">
    <mxGraphModel dx="1434" dy="810" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
'''

SKELETON_TAIL = '''      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''


def make_drawio(*cells_xml):
    """Wrap cell XML fragments in a full .drawio skeleton."""
    cells = "\n".join(f"        {c}" for c in cells_xml)
    return SKELETON_HEAD + cells + "\n" + SKELETON_TAIL


def write_and_validate(*cells_xml):
    """Write a .drawio file from cell XML and run validate_drawio on it."""
    content = make_drawio(*cells_xml)
    tmp = tempfile.NamedTemporaryFile(suffix='.drawio', mode='w', delete=False, encoding='utf-8')
    try:
        tmp.write(content)
        tmp.close()
        return validate_drawio(tmp.name)
    finally:
        os.unlink(tmp.name)


# ── Minimal valid cells ─────────────────────────────────────────────

VALID_VERTEX_A = '<mxCell id="2" value="A" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="200" height="60" as="geometry" /></mxCell>'

VALID_VERTEX_B = '<mxCell id="3" value="B" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1"><mxGeometry x="340" y="40" width="200" height="60" as="geometry" /></mxCell>'

VALID_VERTEX_C = '<mxCell id="4" value="C" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1"><mxGeometry x="640" y="40" width="200" height="60" as="geometry" /></mxCell>'

VALID_EDGE_AB = '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry" /></mxCell>'


# ═══════════════════════════════════════════════════════════════════
# Geometry Helper Tests
# ═══════════════════════════════════════════════════════════════════

class TestParseGeometry:
    def test_valid_vertex(self):
        import xml.etree.ElementTree as ET
        xml = '<mxCell id="2" vertex="1"><mxGeometry x="40" y="50" width="200" height="60" as="geometry" /></mxCell>'
        cell = ET.fromstring(xml)
        result = parse_geometry(cell)
        assert result == (40.0, 50.0, 200.0, 60.0)

    def test_no_geometry(self):
        import xml.etree.ElementTree as ET
        xml = '<mxCell id="2" vertex="1" />'
        cell = ET.fromstring(xml)
        assert parse_geometry(cell) is None

    def test_missing_coords(self):
        import xml.etree.ElementTree as ET
        xml = '<mxCell id="2" vertex="1"><mxGeometry as="geometry" /></mxCell>'
        cell = ET.fromstring(xml)
        result = parse_geometry(cell)
        assert result == (0.0, 0.0, 0.0, 0.0)  # defaults


class TestRectFromGeom:
    def test_conversion(self):
        result = rect_from_geom((10, 20, 100, 50))
        assert result == (10, 20, 110, 70)


class TestOverlapPx:
    def test_overlapping(self):
        a = (0, 0, 100, 100)
        b = (50, 50, 150, 150)
        assert overlap_px(a, b, margin=8) is True

    def test_not_overlapping(self):
        a = (0, 0, 100, 100)
        b = (200, 200, 300, 300)
        assert overlap_px(a, b, margin=8) is False

    def test_barely_touching_with_margin(self):
        a = (0, 0, 100, 100)
        b = (105, 0, 205, 100)  # 5px gap < 8px margin
        assert overlap_px(a, b, margin=8) is True

    def test_sufficient_gap(self):
        a = (0, 0, 100, 100)
        b = (120, 0, 220, 100)  # 20px gap > 8px margin
        assert overlap_px(a, b, margin=8) is False


class TestSegmentsCross:
    def test_crossing(self):
        assert segments_cross((0, 0), (10, 10), (0, 10), (10, 0)) is not None

    def test_not_crossing(self):
        assert segments_cross((0, 0), (10, 0), (0, 10), (10, 10)) is None

    def test_parallel(self):
        assert segments_cross((0, 0), (10, 0), (0, 5), (10, 5)) is None


class TestRouteHitsRect:
    def test_hits(self):
        segments = [((50, 0), (50, 200))]
        rect = (0, 50, 100, 150)
        assert route_hits_rect(segments, rect) is True

    def test_misses(self):
        segments = [((200, 0), (200, 200))]
        rect = (0, 0, 100, 100)
        assert route_hits_rect(segments, rect) is False


class TestSegmentLength:
    def test_horizontal(self):
        assert abs(segment_length((0, 0), (100, 0)) - 100.0) < 0.01

    def test_vertical(self):
        assert abs(segment_length((0, 0), (0, 100)) - 100.0) < 0.01

    def test_diagonal(self):
        assert abs(segment_length((0, 0), (30, 40)) - 50.0) < 0.01


class TestIsOffGrid:
    def test_on_grid(self):
        assert is_off_grid(100) is False
        assert is_off_grid(0) is False
        assert is_off_grid(-10) is False

    def test_off_grid(self):
        assert is_off_grid(43) is True
        assert is_off_grid(-7) is True
        assert is_off_grid(100.5) is True


# ═══════════════════════════════════════════════════════════════════
# P0 Rule Tests (Blocking — Exit Code 2)
# ═══════════════════════════════════════════════════════════════════

class TestR001DanglingEdge:
    def test_missing_source(self):
        """Edge references a source that doesn't exist."""
        result = write_and_validate(
            VALID_VERTEX_A,  # id=2
            VALID_VERTEX_B,  # id=3
            # Edge source=99 doesn't exist
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;endFill=1;" edge="1" parent="1" source="99" target="3"><mxGeometry relative="1" as="geometry" /></mxCell>'
        )
        assert any(e['id'] == 'R001' for e in result['errors']), "Should detect R001: dangling edge source"

    def test_missing_target(self):
        """Edge references a target that doesn't exist."""
        result = write_and_validate(
            VALID_VERTEX_A,
            VALID_VERTEX_B,
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;endFill=1;" edge="1" parent="1" source="2" target="99"><mxGeometry relative="1" as="geometry" /></mxCell>'
        )
        assert any(e['id'] == 'R001' for e in result['errors']), "Should detect R001: dangling edge target"

    def test_valid_edge_no_error(self):
        """Valid edges should not trigger R001."""
        result = write_and_validate(
            VALID_VERTEX_A,
            VALID_VERTEX_B,
            VALID_EDGE_AB,
        )
        assert not any(e['id'] == 'R001' for e in result['errors']), "No R001 on valid edges"


class TestR002DuplicateId:
    def test_duplicate_id(self):
        """Two cells share the same id — should detect R002."""
        result = write_and_validate(
            '<mxCell id="2" value="First" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="2" value="Second" style="rounded=0;" vertex="1" parent="1"><mxGeometry x="200" y="40" width="100" height="40" as="geometry" /></mxCell>',
        )
        assert any(e['id'] == 'R002' for e in result['errors']), \
            "Should detect R002: duplicate cell IDs"

    def test_triplicate_id(self):
        """Three cells with the same id — each duplicate after the first is reported."""
        result = write_and_validate(
            '<mxCell id="2" value="First" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="2" value="Second" style="rounded=0;" vertex="1" parent="1"><mxGeometry x="200" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="2" value="Third" style="rounded=0;" vertex="1" parent="1"><mxGeometry x="400" y="40" width="100" height="40" as="geometry" /></mxCell>',
        )
        r002_errors = [e for e in result['errors'] if e['id'] == 'R002']
        assert len(r002_errors) == 2, \
            f"Should detect 2 R002 errors for triplicate ID, got {len(r002_errors)}"

    def test_unique_ids_no_error(self):
        result = write_and_validate(VALID_VERTEX_A, VALID_VERTEX_B)
        assert not any(e['id'] == 'R002' for e in result['errors']), "No R002 on unique IDs"


class TestR003ParentChildBreakage:
    def test_missing_parent(self):
        """A cell references a parent that doesn't exist."""
        result = write_and_validate(
            '<mxCell id="2" value="Orphan" style="rounded=1;" vertex="1" parent="99"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
        )
        assert any(e['id'] == 'R003' for e in result['errors']), "Should detect R003: broken parent"

    def test_valid_parent_no_error(self):
        result = write_and_validate(VALID_VERTEX_A)
        assert not any(e['id'] == 'R003' for e in result['errors']), "No R003 with valid parent"


class TestR004XmlSyntaxError:
    def test_malformed_xml(self):
        """Completely invalid XML should trigger R004."""
        result = write_and_validate()  # Pass nothing special, but write bad content directly
        # Actually write bad XML directly
        import tempfile, os
        tmp = tempfile.NamedTemporaryFile(suffix='.drawio', mode='w', delete=False, encoding='utf-8')
        try:
            tmp.write('this is not xml at all <<<')
            tmp.close()
            result = validate_drawio(tmp.name)
        finally:
            os.unlink(tmp.name)
        assert any(e['id'] == 'R004' for e in result['errors']), "Should detect R004: parse error"

    def test_file_not_found(self):
        result = validate_drawio('/nonexistent/path/file.drawio')
        assert any(e['id'] == 'R004' for e in result['errors']), "Should detect R004: file not found"


class TestR005MissingGeometryVertex:
    def test_vertex_without_geometry(self):
        """A vertex without mxGeometry child should trigger R005."""
        result = write_and_validate(
            '<mxCell id="2" value="NoGeom" style="rounded=1;" vertex="1" parent="1" />',
        )
        assert any(e['id'] == 'R005' for e in result['errors']), "Should detect R005: missing geometry"

    def test_vertex_with_geometry_no_error(self):
        result = write_and_validate(VALID_VERTEX_A)
        assert not any(e['id'] == 'R005' for e in result['errors']), "No R005 when geometry present"


# ═══════════════════════════════════════════════════════════════════
# P1 Rule Tests (Must Fix — Exit Code 1)
# ═══════════════════════════════════════════════════════════════════

class TestR010OverlappingSiblings:
    def test_overlapping_vertices(self):
        """Two vertices at the same position should overlap."""
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="200" height="60" as="geometry" /></mxCell>',
            '<mxCell id="3" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="80" y="50" width="200" height="60" as="geometry" /></mxCell>',
        )
        assert any(w['id'] == 'R010' for w in result['warnings']), "Should detect R010: overlapping"

    def test_well_spaced_no_warning(self):
        result = write_and_validate(VALID_VERTEX_A, VALID_VERTEX_B)
        assert not any(w['id'] == 'R010' for w in result['warnings']), "No R010 with proper spacing"


class TestR013InsufficientSpacing:
    def test_connected_nodes_too_close(self):
        """Two edge-connected vertices with center-to-center < 80px should trigger R013."""
        # Vertices at (40,40) w=60,h=40 and (40,100) w=60,h=40
        # Centers: (70,60) and (70,120) → distance = 60px < 80px
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="60" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="100" width="60" height="40" as="geometry" /></mxCell>',
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry" /></mxCell>',
        )
        assert any(w['id'] == 'R013' for w in result['warnings']), "Should detect R013: connected nodes too close"

    def test_connected_nodes_adequate_spacing(self):
        """Well-spaced connected nodes should not trigger R013."""
        # VALID_VERTEX_A at (40,40) w=200,h=60, VALID_VERTEX_B at (340,40) w=200,h=60
        # Centers: (140,70) and (440,70) → distance = 300px > 80px
        result = write_and_validate(VALID_VERTEX_A, VALID_VERTEX_B, VALID_EDGE_AB)
        assert not any(w['id'] == 'R013' for w in result['warnings']), "No R013 with adequate spacing"

    def test_unconnected_vertices_no_r013(self):
        """Unconnected vertices are not checked by R013 (only edge-connected pairs)."""
        # Two close vertices but no edge between them
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="60" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="100" width="60" height="40" as="geometry" /></mxCell>',
        )
        assert not any(w['id'] == 'R013' for w in result['warnings']), "R013 only checks edge-connected node pairs"

    def test_diagonal_connected_too_close(self):
        """Edge-connected nodes diagonally close should trigger R013."""
        # A at (40,40) w=60,h=40 → center (70,60)
        # B at (80,75) w=60,h=40 → center (110,95)
        # distance = sqrt((110-70)² + (95-60)²) = sqrt(1600+1225) = sqrt(2825) ≈ 53px < 80px
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="60" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="80" y="75" width="60" height="40" as="geometry" /></mxCell>',
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry" /></mxCell>',
        )
        assert any(w['id'] == 'R013' for w in result['warnings']), "Should detect R013: diagonal connected too close"


class TestR011EdgeThroughVertex:
    """R011 (P1): Edge with waypoints passing through an unrelated vertex's bounding box."""

    def test_edge_passes_through_vertex(self):
        """An edge from A to B whose waypointed path passes through C should trigger R011."""
        # A at (40,40,100,40) center=(90,60)
        # C at (160,40,80,40) bbox=(160,40)-(240,80) — blocker
        # B at (320,40,100,40) center=(370,60)
        # Edge A→B, exit bottom, 2 waypoints forcing path through C
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="C" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="160" y="40" width="80" height="40" as="geometry" /></mxCell>',
            '<mxCell id="4" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="320" y="40" width="100" height="40" as="geometry" /></mxCell>',
            # Edge A→B: exit bottom-center, waypoints that go through C's bbox
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0.5;exitY=1;entryX=0.5;entryY=0;" edge="1" parent="1" source="2" target="4"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="200" y="80" /><mxPoint x="200" y="20" /></Array></mxGeometry></mxCell>',
        )
        assert any(w['id'] == 'R011' for w in result['warnings']), \
            "Should detect R011: edge passing through vertex C"

    def test_edge_avoids_vertex_no_warning(self):
        """Edge with waypoints that route AROUND all non-source/target vertices — no R011."""
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="C" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="160" y="120" width="80" height="40" as="geometry" /></mxCell>',
            '<mxCell id="4" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="320" y="40" width="100" height="40" as="geometry" /></mxCell>',
            # Edge A→B waypoints go through area WITHOUT C (C is at y=120)
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0.5;exitY=1;entryX=0.5;entryY=0;" edge="1" parent="1" source="2" target="4"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="200" y="80" /><mxPoint x="200" y="20" /></Array></mxGeometry></mxCell>',
        )
        assert not any(w['id'] == 'R011' for w in result['warnings']), \
            "No R011 when edge avoids all non-source/target vertices"

    def test_edge_through_swimlane_container_excluded(self):
        """Edge passing through a swimlane (transparent container) should NOT trigger R011."""
        result = write_and_validate(
            # Swimlane container at y=80 spanning x=40..340
            '<mxCell id="2" value="Container" style="swimlane;startSize=30;" vertex="1" parent="1"><mxGeometry x="40" y="80" width="300" height="100" as="geometry" /></mxCell>',
            '<mxCell id="3" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="4" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="320" y="40" width="100" height="40" as="geometry" /></mxCell>',
            # Edge A→B waypoints go through the swimlane area (should be excluded from R011)
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0.5;exitY=1;entryX=0.5;entryY=0;" edge="1" parent="1" source="3" target="4"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="200" y="80" /><mxPoint x="200" y="120" /></Array></mxGeometry></mxCell>',
        )
        assert not any(w['id'] == 'R011' for w in result['warnings']), \
            "R011 should exclude swimlane containers (transparent boundaries)"


class TestR012EdgeCrossing:
    """R012 (P1): Two waypointed edges whose path segments cross."""

    def test_edges_cross(self):
        """Two edges with crossing waypoint paths should trigger R012."""
        # A(top-left), B(top-right), C(bottom-left), D(bottom-right)
        # Edge1 (A→D): diagonal ↘  Edge2 (C→B): diagonal ↗
        # Paths cross in the center of the diagram
        result = write_and_validate(
            # A at top-left: (40,40,100,40) center=(90,60)
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            # B at top-right: (320,40,100,40) center=(370,60)
            '<mxCell id="3" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="320" y="40" width="100" height="40" as="geometry" /></mxCell>',
            # C at bottom-left: (40,200,100,40) center=(90,220)
            '<mxCell id="4" value="C" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="200" width="100" height="40" as="geometry" /></mxCell>',
            # D at bottom-right: (320,200,100,40) center=(370,220)
            '<mxCell id="5" value="D" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="320" y="200" width="100" height="40" as="geometry" /></mxCell>',
            # Edge1 A→D: exit A bottom at (90,80), diagonal path to D top at (370,200)
            '<mxCell id="6" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0.5;exitY=1;entryX=0.5;entryY=0;" edge="1" parent="1" source="2" target="5"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="200" y="80" /><mxPoint x="250" y="140" /></Array></mxGeometry></mxCell>',
            # Edge2 C→B: exit C top at (90,200), diagonal path to B bottom at (370,80)
            '<mxCell id="7" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0.5;exitY=0;entryX=0.5;entryY=1;" edge="1" parent="1" source="4" target="3"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="200" y="200" /><mxPoint x="250" y="120" /></Array></mxGeometry></mxCell>',
        )
        assert any(w['id'] == 'R012' for w in result['warnings']), \
            "Should detect R012: edge paths crossing"

    def test_edges_not_crossing_no_warning(self):
        """Two edges with non-crossing paths should not trigger R012."""
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="B" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="320" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="4" value="C" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="200" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="5" value="D" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="320" y="200" width="100" height="40" as="geometry" /></mxCell>',
            # Edge1: A→B horizontal at y=80
            '<mxCell id="6" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=1;exitY=0.5;entryX=0;entryY=0.5;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="200" y="60" /><mxPoint x="200" y="60" /></Array></mxGeometry></mxCell>',
            # Edge2: C→D horizontal at y=240 — parallel, no crossing
            '<mxCell id="7" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=1;exitY=0.5;entryX=0;entryY=0.5;" edge="1" parent="1" source="4" target="5"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="200" y="220" /><mxPoint x="200" y="220" /></Array></mxGeometry></mxCell>',
        )
        assert not any(w['id'] == 'R012' for w in result['warnings']), \
            "No R012 when edge paths don't cross"


class TestR016WaypointEntryAlignment:
    """R016 (P1): Last waypoint must be axis-aligned with the target entry point."""

    def test_vertical_entry_last_wp_x_misaligned(self):
        """Vertical entry (entryY=0), wp_last.x != entry_x → R016."""
        result = write_and_validate(
            # Source at (40,40,100,40), Target at (320,40,100,40)
            '<mxCell id="2" value="Src" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="Tgt" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="320" y="40" width="100" height="40" as="geometry" /></mxCell>',
            # entryY=0 (top entry), entry_x = 320+100*0.5 = 370
            # wp_last at x=390 (≠370, delta=20px) → R016
            '<mxCell id="4" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0.5;exitY=1;entryX=0.5;entryY=0;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="90" y="80" /><mxPoint x="390" y="80" /></Array></mxGeometry></mxCell>',
        )
        assert any(w['id'] == 'R016' for w in result['warnings']), \
            "Should detect R016: wp_last.x misaligned with vertical entry_x"

    def test_vertical_entry_last_wp_x_aligned(self):
        """Vertical entry (entryY=0), wp_last.x == entry_x → no R016."""
        result = write_and_validate(
            '<mxCell id="2" value="Src" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="Tgt" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="320" y="40" width="100" height="40" as="geometry" /></mxCell>',
            # entryY=0, entry_x=370. wp_last at x=370 — aligned ✓
            '<mxCell id="4" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0.5;exitY=1;entryX=0.5;entryY=0;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="90" y="80" /><mxPoint x="370" y="80" /></Array></mxGeometry></mxCell>',
        )
        assert not any(w['id'] == 'R016' for w in result['warnings']), \
            "No R016 when wp_last.x aligns with vertical entry_x"

    def test_horizontal_entry_last_wp_y_misaligned(self):
        """Horizontal entry (entryX=0), wp_last.y != entry_y → R016."""
        result = write_and_validate(
            # Source above target: Src (200,40,100,40), Tgt (40,200,100,40)
            '<mxCell id="2" value="Src" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="200" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="Tgt" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="200" width="100" height="40" as="geometry" /></mxCell>',
            # entryX=0 (left entry), entry_y = 200+40*0.5 = 220
            # wp_last at y=200 (≠220, delta=20px) → R016
            '<mxCell id="4" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0.5;exitY=1;entryX=0;entryY=0.5;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="250" y="80" /><mxPoint x="250" y="200" /></Array></mxGeometry></mxCell>',
        )
        assert any(w['id'] == 'R016' for w in result['warnings']), \
            "Should detect R016: wp_last.y misaligned with horizontal entry_y"

    def test_no_explicit_entry_skipped(self):
        """Edge without explicit entryX in style → R016 not checked."""
        result = write_and_validate(
            '<mxCell id="2" value="Src" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="Tgt" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="320" y="40" width="100" height="40" as="geometry" /></mxCell>',
            # No entryX in style → auto-routing → skip R016 check
            '<mxCell id="4" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;exitX=0.5;exitY=1;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="90" y="80" /><mxPoint x="390" y="80" /></Array></mxGeometry></mxCell>',
        )
        assert not any(w['id'] == 'R016' for w in result['warnings']), \
            "No R016 when entryX not explicitly specified (auto-routing)"


class TestR014OffCanvas:
    def test_negative_x(self):
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="-20" y="40" width="200" height="60" as="geometry" /></mxCell>',
        )
        assert any(w['id'] == 'R014' for w in result['warnings']), "Should detect R014: negative x"

    def test_negative_y(self):
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="-30" width="200" height="60" as="geometry" /></mxCell>',
        )
        assert any(w['id'] == 'R014' for w in result['warnings']), "Should detect R014: negative y"

    def test_positive_coords_no_warning(self):
        result = write_and_validate(VALID_VERTEX_A)
        assert not any(w['id'] == 'R014' for w in result['warnings']), "No R014 with positive coordinates"


class TestR015SelfClosingEdge:
    def test_edge_without_geometry(self):
        """An edge missing its mxGeometry child triggers R015."""
        result = write_and_validate(
            VALID_VERTEX_A,
            VALID_VERTEX_B,
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;" edge="1" parent="1" source="2" target="3" />',
        )
        assert any(e['id'] == 'R015' for e in result['errors']), "Should detect R015: edge missing geometry"

    def test_edge_with_geometry_no_error(self):
        result = write_and_validate(VALID_VERTEX_A, VALID_VERTEX_B, VALID_EDGE_AB)
        assert not any(e['id'] == 'R015' for e in result['errors']), "No R015 with edge geometry present"


# ═══════════════════════════════════════════════════════════════════
# P2 Rule Tests (Warning — Exit Code 0)
# ═══════════════════════════════════════════════════════════════════

class TestR020OffGridGeometry:
    def test_off_grid_x(self):
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="43" y="40" width="200" height="60" as="geometry" /></mxCell>',
        )
        assert any(w['id'] == 'R020' for w in result['warnings']), "Should detect R020: off-grid x"

    def test_off_grid_width(self):
        result = write_and_validate(
            '<mxCell id="2" value="A" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="203" height="60" as="geometry" /></mxCell>',
        )
        assert any(w['id'] == 'R020' for w in result['warnings']), "Should detect R020: off-grid width"

    def test_on_grid_no_warning(self):
        result = write_and_validate(VALID_VERTEX_A)
        assert not any(w['id'] == 'R020' for w in result['warnings']), "No R020 on grid-aligned coords"


class TestR021NonCenteredConnectionPoint:
    def test_non_centered_exit_x(self):
        result = write_and_validate(
            VALID_VERTEX_A,
            VALID_VERTEX_B,
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;" edge="1" parent="1" source="2" target="3" exitX="0.25" exitY="1"><mxGeometry relative="1" as="geometry" /></mxCell>',
        )
        assert any(w['id'] == 'R021' for w in result['warnings']), "Should detect R021: non-centered exitX"

    def test_centered_no_warning(self):
        result = write_and_validate(
            VALID_VERTEX_A,
            VALID_VERTEX_B,
            # No exitX/exitY = draw.io default auto-routing (centered)
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry" /></mxCell>',
        )
        assert not any(w['id'] == 'R021' for w in result['warnings']), "No R021 without explicit exit/entry attributes"


class TestR022ShortArrowSegment:
    def test_short_final_segment(self):
        """Edge with a very short final waypoint-to-target segment.
        Requires at least 2 waypoints for R022 detection (waypointed_edges filter).
        The final segment from last waypoint to target center must be < 15px."""
        result = write_and_validate(
            '<mxCell id="2" value="Source" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="40" as="geometry" /></mxCell>',
            '<mxCell id="3" value="Target" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="200" y="40" width="100" height="40" as="geometry" /></mxCell>',
            # Two waypoints: second one is very close to target center
            '<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="150" y="60" /><mxPoint x="240" y="60" /></Array></mxGeometry></mxCell>',
        )
        # Final segment: waypoint2 (240,60) to target center (250,60) = 10px < 15px
        assert any(w['id'] == 'R022' for w in result['warnings']), "Should detect R022: short arrow segment"


# ═══════════════════════════════════════════════════════════════════
# Score Computation Tests
# ═══════════════════════════════════════════════════════════════════

class TestComputeScore:
    def test_perfect_score_zero(self):
        result = {'errors': [], 'warnings': []}
        assert compute_score(result) == 0

    def test_r011_weight(self):
        result = {'errors': [], 'warnings': [{'id': 'R011', 'message': 'test'}]}
        assert compute_score(result) == 20

    def test_r012_weight(self):
        result = {'errors': [], 'warnings': [{'id': 'R012', 'message': 'test'}]}
        assert compute_score(result) == 10

    def test_r010_weight(self):
        result = {'errors': [], 'warnings': [{'id': 'R010', 'message': 'test'}]}
        assert compute_score(result) == 5

    def test_r020_weight(self):
        result = {'errors': [], 'warnings': [{'id': 'R020', 'message': 'test'}]}
        assert compute_score(result) == 1

    def test_r021_weight(self):
        result = {'errors': [], 'warnings': [{'id': 'R021', 'message': 'test'}]}
        assert compute_score(result) == 2

    def test_r022_weight(self):
        result = {'errors': [], 'warnings': [{'id': 'R022', 'message': 'test'}]}
        assert compute_score(result) == 3

    def test_combined_weights(self):
        result = {'errors': [], 'warnings': [
            {'id': 'R010', 'message': 'test'},
            {'id': 'R020', 'message': 'test'},
            {'id': 'R020', 'message': 'test'},
        ]}
        assert compute_score(result) == 7  # 5 + 1 + 1

    def test_unknown_id_weight(self):
        result = {'errors': [{'id': 'R999', 'message': 'test'}], 'warnings': []}
        assert compute_score(result) == 10  # default weight for unknown error ids


# ═══════════════════════════════════════════════════════════════════
# UserObject Wrapper Tests (draw.io v30+ Mermaid Pipeline B format)
# ═══════════════════════════════════════════════════════════════════

USEROBJECT_SKELETON_HEAD = '''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="Electron">
  <diagram name="Test" id="test-1">
    <mxGraphModel dx="-339" dy="-199" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="0" page="0" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
'''

USEROBJECT_SKELETON_TAIL = '''      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''


def make_userobject_drawio(*cells_xml):
    """Wrap cell XML fragments in a draw.io v30+ skeleton with UserObject wrappers."""
    cells = "\n".join(f"        {c}" for c in cells_xml)
    return USEROBJECT_SKELETON_HEAD + cells + "\n" + USEROBJECT_SKELETON_TAIL


def write_and_validate_uo(*cells_xml):
    """Write a .drawio file from UserObject-wrapped cell XML and run validate_drawio on it."""
    content = make_userobject_drawio(*cells_xml)
    tmp = tempfile.NamedTemporaryFile(suffix='.drawio', mode='w', delete=False, encoding='utf-8')
    try:
        tmp.write(content)
        tmp.close()
        return validate_drawio(tmp.name)
    finally:
        os.unlink(tmp.name)


# Sample UserObject-wrapped cells (Mermaid conversion format)
UO_VERTEX_A = '<UserObject label="Service A" mermaidId="n:A" mermaidBaseStyle="rounded=1;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" mermaidBaseValue="Service A" id="2"><mxCell parent="1" style="rounded=1;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1"><mxGeometry height="50" width="140" x="100" y="100" as="geometry" /></mxCell></UserObject>'

UO_VERTEX_B = '<UserObject label="Service B" mermaidId="n:B" mermaidBaseStyle="rounded=1;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" mermaidBaseValue="Service B" id="3"><mxCell parent="1" style="rounded=1;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1"><mxGeometry height="50" width="140" x="400" y="100" as="geometry" /></mxCell></UserObject>'

UO_EDGE_AB = '<UserObject label="" mermaidId="e:A-&gt;B" mermaidBaseStyle="edgeStyle=orthogonalEdgeStyle;rounded=1;endArrow=classic;endFill=1;" mermaidBaseValue="" id="4"><mxCell edge="1" parent="1" source="2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;endArrow=classic;endFill=1;" target="3"><mxGeometry relative="1" as="geometry" /></mxCell></UserObject>'


class TestUserObjectParsing:
    def test_uo_vertex_has_id(self):
        """UserObject-wrapped vertex should have its id resolved from the wrapper."""
        result = write_and_validate_uo(UO_VERTEX_A)
        # Should NOT have R003 (parent breakage — id="2" parsed correctly)
        assert not any(e['id'] == 'R003' for e in result['errors']), \
            "UserObject vertex id='2' should be resolved from wrapper"

    def test_uo_vertex_has_geometry(self):
        """UserObject-wrapped vertex should have geometry parsed from inner mxCell."""
        result = write_and_validate_uo(UO_VERTEX_A)
        # Should NOT have R005 (missing geometry)
        assert not any(e['id'] == 'R005' for e in result['errors']), \
            "Inner mxCell geometry should be recognized"

    def test_uo_valid_diagram_no_errors(self):
        """Two UO vertices + UO edge = valid diagram, no P0 errors."""
        result = write_and_validate_uo(UO_VERTEX_A, UO_VERTEX_B, UO_EDGE_AB)
        errors = result['errors']
        assert len(errors) == 0, f"Unexpected errors: {errors}"

    def test_uo_edge_with_source_target_works(self):
        """UserObject edge connecting two UO vertices should resolve source/target."""
        result = write_and_validate_uo(UO_VERTEX_A, UO_VERTEX_B, UO_EDGE_AB)
        # Should NOT have R001 (dangling edge)
        assert not any(e['id'] == 'R001' for e in result['errors']), \
            "Edge source=2 target=3 should resolve to UO vertices"

    def test_uo_dangling_edge_detected(self):
        """Edge with source pointing to non-existent UO vertex should trigger R001."""
        result = write_and_validate_uo(
            UO_VERTEX_A,  # id=2
            # Edge source=99 doesn't exist
            '<UserObject id="5"><mxCell edge="1" parent="1" source="99" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;" target="2"><mxGeometry relative="1" as="geometry" /></mxCell></UserObject>',
        )
        assert any(e['id'] == 'R001' for e in result['errors']), \
            "Should detect R001: dangling edge in UserObject format"

    def test_uo_off_grid_detected(self):
        """UserObject vertex with off-grid coords should trigger R020."""
        result = write_and_validate_uo(
            '<UserObject id="2"><mxCell parent="1" style="rounded=1;" vertex="1"><mxGeometry height="50" width="143" x="43" y="40" as="geometry" /></mxCell></UserObject>',
        )
        assert any(w['id'] == 'R020' for w in result['warnings']), \
            "Should detect R020: off-grid coords in UserObject format"

    def test_uo_mixed_standard_and_userobject(self):
        """A diagram with both standard mxCell and UserObject-wrapped cells should work."""
        result = write_and_validate_uo(
            UO_VERTEX_A,   # UserObject id=2
            UO_VERTEX_B,   # UserObject id=3
            VALID_EDGE_AB, # Standard mxCell edge (no UserObject wrapper)
        )
        assert len(result['errors']) == 0, f"Mixed format should work: {result['errors']}"

    def test_uo_duplicate_id_detected(self):
        """Two UserObject cells with same id should trigger R002."""
        result = write_and_validate_uo(
            UO_VERTEX_A,
            UO_VERTEX_A,  # Same id=2
        )
        assert any(e['id'] == 'R002' for e in result['errors']), \
            "Should detect R002: duplicate UserObject IDs"


# ═══════════════════════════════════════════════════════════════════
# Integration Tests (Full Valid File)
# ═══════════════════════════════════════════════════════════════════

class TestR040ContainerChildColorContrast:
    """R040 (P2): Swimlane header fillColor must differ from children's fillColor."""

    def test_swimlane_child_same_color(self):
        """Swimlane and child with identical fillColor → R040."""
        result = write_and_validate(
            # Swimlane with fillColor=#dae8fc, child with same fillColor
            '<mxCell id="2" value="Layer" style="swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="300" height="100" as="geometry" /></mxCell>',
            '<mxCell id="3" value="Service" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="2"><mxGeometry x="40" y="40" width="140" height="50" as="geometry" /></mxCell>',
        )
        assert any(w['id'] == 'R040' for w in result['warnings']), \
            "Should detect R040: swimlane and child have identical fillColor"

    def test_swimlane_child_different_color(self):
        """Swimlane and child with different fillColors → no R040."""
        result = write_and_validate(
            # Swimlane fillColor=#B0C4DE (darker header), child fillColor=#dae8fc (lighter)
            '<mxCell id="2" value="Layer" style="swimlane;startSize=30;fillColor=#B0C4DE;strokeColor=#6c8ebf;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="300" height="100" as="geometry" /></mxCell>',
            '<mxCell id="3" value="Service" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="2"><mxGeometry x="40" y="40" width="140" height="50" as="geometry" /></mxCell>',
        )
        assert not any(w['id'] == 'R040' for w in result['warnings']), \
            "No R040 when swimlane header color differs from child"

    def test_transparent_child_no_warning(self):
        """Child with fillColor=none (transparent) should not trigger R040."""
        result = write_and_validate(
            '<mxCell id="2" value="Layer" style="swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="300" height="100" as="geometry" /></mxCell>',
            # Transparent child — explicitly fillColor=none
            '<mxCell id="3" value="Label" style="text;html=1;fillColor=none;strokeColor=none;" vertex="1" parent="2"><mxGeometry x="40" y="40" width="100" height="30" as="geometry" /></mxCell>',
        )
        assert not any(w['id'] == 'R040' for w in result['warnings']), \
            "No R040 for transparent children (fillColor=none)"

    def test_non_swimlane_ignored(self):
        """Non-swimlane containers should not trigger R040."""
        result = write_and_validate(
            # Rounded rect (not a swimlane) with child of same color
            '<mxCell id="2" value="Group" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="300" height="100" as="geometry" /></mxCell>',
            '<mxCell id="3" value="Item" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="2"><mxGeometry x="40" y="40" width="140" height="50" as="geometry" /></mxCell>',
        )
        assert not any(w['id'] == 'R040' for w in result['warnings']), \
            "No R040 for non-swimlane containers"


class TestValidFile:
    def test_minimal_valid_no_issues(self):
        """A minimal valid diagram should have zero errors and warnings."""
        result = write_and_validate(VALID_VERTEX_A, VALID_VERTEX_B, VALID_EDGE_AB)
        assert len(result['errors']) == 0, f"Unexpected errors: {result['errors']}"
        assert len(result['warnings']) == 0, f"Unexpected warnings: {result['warnings']}"
        assert compute_score(result) == 0

    def test_empty_diagram_no_crash(self):
        """Validate should handle a diagram with only root cells gracefully."""
        result = write_and_validate()  # only id=0 and id=1
        assert len(result['errors']) == 0
        assert len(result['warnings']) == 0
