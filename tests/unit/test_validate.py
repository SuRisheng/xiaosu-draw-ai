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
# Integration Tests (Full Valid File)
# ═══════════════════════════════════════════════════════════════════

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
