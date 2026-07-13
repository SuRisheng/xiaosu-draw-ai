#!/usr/bin/env node
/**
 * router.js — Orthogonal edge routing engine for draw.io diagrams.
 *
 * Given source/target node positions and a set of obstacle nodes, calculates
 * waypoints that avoid obstacles using orthogonal (Manhattan) routing.
 *
 * Used by Pipeline C AI generation to automate edge routing instead of
 * manually placing waypoints.
 *
 * API:
 *   const router = require('./router.js');
 *   const waypoints = router.route({ source, target, obstacles, options });
 *
 * No external dependencies — pure Node.js.
 */

// ── Geometry Primitives ───────────────────────────────────────────

function rect(x, y, w, h) {
    return { x, y, w, h, right: x + w, bottom: y + h };
}

function center(r) {
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function expand(r, margin) {
    return rect(r.x - margin, r.y - margin, r.w + 2 * margin, r.h + 2 * margin);
}

function intersects(a, b) {
    return !(a.right <= b.x || a.x >= b.right || a.bottom <= b.y || a.y >= b.bottom);
}

function manhattan(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// ── Routing ────────────────────────────────────────────────────────

/**
 * Route an edge between source and target nodes, avoiding obstacles.
 *
 * @param {Object} opts
 * @param {Object} opts.source — { x, y, w, h }
 * @param {Object} opts.target — { x, y, w, h }
 * @param {Array<Object>} opts.obstacles — array of { x, y, w, h } to avoid
 * @param {Object} [opts.options]
 * @param {string} [opts.options.direction='auto'] — 'TB' | 'LR' | 'auto'
 * @param {number} [opts.options.margin=10] — clearance around obstacles (px)
 * @param {number} [opts.options.gridSnap=10] — grid alignment (px)
 * @returns {Array<{x:number, y:number}>} Waypoints (excluding source/target centers)
 */
function route(opts) {
    const { source, target, obstacles = [], options = {} } = opts;
    const margin = options.margin || 10;
    const gridSnap = options.gridSnap || 10;

    const src = rect(source.x, source.y, source.w, source.h);
    const tgt = rect(target.x, target.y, target.w, target.h);
    const srcCenter = center(src);
    const tgtCenter = center(tgt);

    // Expand obstacles
    const obs = obstacles
        .filter(o => o !== source && o !== target)
        .map(o => expand(rect(o.x, o.y, o.w, o.h), margin));

    // Check if direct path is clear
    if (isPathClear(srcCenter, tgtCenter, src, tgt, obs)) {
        return []; // No waypoints needed
    }

    // Try simple orthogonal detour
    const detour = findOrthogonalDetour(srcCenter, tgtCenter, src, tgt, obs, gridSnap);
    if (detour) return detour;

    // Fallback: route through corridor
    return findCorridorPath(srcCenter, tgtCenter, src, tgt, obs, gridSnap);
}

/**
 * Check if a Manhattan path (horizontal then vertical) is clear.
 */
function isPathClear(srcCenter, tgtCenter, srcRect, tgtRect, obstacles) {
    // Try H-then-V
    const corner1 = { x: tgtCenter.x, y: srcCenter.y };
    if (!anySegmentHits([[srcCenter, corner1], [corner1, tgtCenter]], srcRect, tgtRect, obstacles)) {
        return true;
    }

    // Try V-then-H
    const corner2 = { x: srcCenter.x, y: tgtCenter.y };
    if (!anySegmentHits([[srcCenter, corner2], [corner2, tgtCenter]], srcRect, tgtRect, obstacles)) {
        return true;
    }

    return false;
}

function segmentHitsRect(segStart, segEnd, rect) {
    // Check if a horizontal or vertical segment intersects a rectangle
    const isHorizontal = Math.abs(segStart.y - segEnd.y) < 1;
    const isVertical = Math.abs(segStart.x - segEnd.x) < 1;

    if (isHorizontal) {
        const y = segStart.y;
        const xMin = Math.min(segStart.x, segEnd.x);
        const xMax = Math.max(segStart.x, segEnd.x);
        return y >= rect.y && y <= rect.bottom &&
               xMax >= rect.x && xMin <= rect.right;
    }
    if (isVertical) {
        const x = segStart.x;
        const yMin = Math.min(segStart.y, segEnd.y);
        const yMax = Math.max(segStart.y, segEnd.y);
        return x >= rect.x && x <= rect.right &&
               yMax >= rect.y && yMin <= rect.bottom;
    }
    return false;
}

function anySegmentHits(segments, srcRect, tgtRect, obstacles) {
    for (const seg of segments) {
        for (const obs of obstacles) {
            if (segmentHitsRect(seg[0], seg[1], obs)) return true;
        }
    }
    return false;
}

/**
 * Find a simple one-bend orthogonal detour around obstacles.
 */
function findOrthogonalDetour(srcCenter, tgtCenter, srcRect, tgtRect, obstacles, gridSnap) {
    const directions = [
        { name: 'right', dx: 1, dy: 0 },
        { name: 'left', dx: -1, dy: 0 },
        { name: 'down', dx: 0, dy: 1 },
        { name: 'up', dx: 0, dy: -1 },
    ];

    // From source: try exiting in each direction
    for (const exitDir of directions) {
        for (const entryDir of directions) {
            if (exitDir.name === entryDir.name) continue;

            // Calculate detour points
            let exitX = srcCenter.x + exitDir.dx * (srcRect.w / 2 + 40);
            let exitY = srcCenter.y + exitDir.dy * (srcRect.h / 2 + 40);
            let entryX = tgtCenter.x + entryDir.dx * (tgtRect.w / 2 + 40);
            let entryY = tgtCenter.y + entryDir.dy * (tgtRect.h / 2 + 40);

            // Snap to grid
            exitX = Math.round(exitX / gridSnap) * gridSnap;
            exitY = Math.round(exitY / gridSnap) * gridSnap;
            entryX = Math.round(entryX / gridSnap) * gridSnap;
            entryY = Math.round(entryY / gridSnap) * gridSnap;

            // Build candidate path
            const candidate = [{ x: exitX, y: exitY }];

            // Middle bend point
            const midX = exitDir.dx !== 0 ? entryX : exitX;
            const midY = exitDir.dy !== 0 ? entryY : exitY;
            if (Math.abs(midX - exitX) > 1 || Math.abs(midY - exitY) > 1) {
                candidate.push({ x: midX, y: midY });
            }

            candidate.push({ x: entryX, y: entryY });

            // Check all segments
            const allPoints = [srcCenter, ...candidate, tgtCenter];
            let clear = true;
            for (let i = 0; i < allPoints.length - 1; i++) {
                if (anySegmentHits([[allPoints[i], allPoints[i + 1]]], srcRect, tgtRect, obstacles)) {
                    clear = false;
                    break;
                }
            }

            if (clear) {
                return candidate;
            }
        }
    }

    return null; // No simple detour found
}

/**
 * Find path through a corridor between source and target.
 * Creates intermediate waypoints that route around all obstacles.
 */
function findCorridorPath(srcCenter, tgtCenter, srcRect, tgtRect, obstacles, gridSnap) {
    // Strategy: route through the gap between source and target layers
    // Add a middle corridor point

    const waypoints = [];
    const midY = (srcCenter.y + tgtCenter.y) / 2;

    // Exit source downward/upward, enter target from opposite direction
    const goDown = tgtCenter.y > srcCenter.y;

    const exitY = goDown
        ? srcRect.bottom + 20
        : srcRect.y - 20;
    const entryY = goDown
        ? tgtRect.y - 20
        : tgtRect.bottom + 20;

    const wp1 = {
        x: Math.round(srcCenter.x / gridSnap) * gridSnap,
        y: Math.round(exitY / gridSnap) * gridSnap,
    };
    const wp2 = {
        x: Math.round(tgtCenter.x / gridSnap) * gridSnap,
        y: Math.round(exitY / gridSnap) * gridSnap,
    };
    const wp3 = {
        x: Math.round(tgtCenter.x / gridSnap) * gridSnap,
        y: Math.round(entryY / gridSnap) * gridSnap,
    };

    waypoints.push(wp1);
    if (Math.abs(wp2.x - wp1.x) > gridSnap || Math.abs(wp2.y - wp1.y) > gridSnap) {
        waypoints.push(wp2);
    }
    if (Math.abs(wp3.x - wp2.x) > gridSnap || Math.abs(wp3.y - wp2.y) > gridSnap) {
        waypoints.push(wp3);
    }

    return waypoints;
}

// ── Edge Bundling ──────────────────────────────────────────────────

/**
 * Calculate distributed exit/entry points for multiple edges between
 * the same pair of nodes to prevent visual stacking (R033).
 *
 * @param {number} edgeCount — number of parallel edges
 * @param {string} side — 'top' | 'bottom' | 'left' | 'right'
 * @returns {Array<{exitX:number, exitY:number, entryX:number, entryY:number}>}
 */
function distributeParallelEdges(edgeCount, side = 'bottom') {
    const positions = [];
    const fractions = edgeCount === 1
        ? [0.5]
        : edgeCount === 2
            ? [0.3, 0.7]
            : Array.from({ length: edgeCount }, (_, i) => (i + 1) / (edgeCount + 1));

    const sideMap = {
        bottom: { exitY: 1, entryY: 0, exitAttr: 'exitX', entryAttr: 'entryX' },
        top:    { exitY: 0, entryY: 1, exitAttr: 'exitX', entryAttr: 'entryX' },
        right:  { exitX: 1, entryX: 0, exitAttr: 'exitY', entryAttr: 'entryY' },
        left:   { exitX: 0, entryX: 1, exitAttr: 'exitY', entryAttr: 'entryY' },
    };

    const s = sideMap[side];
    for (const frac of fractions) {
        const pos = {};
        if ('exitY' in s) {
            pos.exitX = frac;
            pos.exitY = s.exitY;
            pos.entryX = frac;
            pos.entryY = s.entryY;
        } else {
            pos.exitX = s.exitX;
            pos.exitY = frac;
            pos.entryX = s.entryX;
            pos.entryY = frac;
        }
        positions.push(pos);
    }

    return positions;
}

// ── Label Collision Avoidance ─────────────────────────────────────

/**
 * Check if an edge label at the given position collides with any node
 * or other label, and suggest a position adjustment.
 *
 * @param {Object} label — { x, y, width, height, text }
 * @param {Array<Object>} nodes — [{ x, y, w, h }]
 * @param {Array<Object>} otherLabels — [{ x, y, w, h }]
 * @param {Object} options
 * @param {number} [options.minClearance=6] — minimum px between label and obstacles
 * @returns {Object} { collides: bool, suggestion: { dx, dy }|null }
 */
function checkLabelCollision(label, nodes, otherLabels = [], options = {}) {
    const minClearance = options.minClearance || 6;
    const labelRect = rect(label.x, label.y, label.width, label.height);

    // Estimate label dimensions if not provided
    const lw = label.width || label.text.length * 7 + 10;
    const lh = label.height || 14;
    const lr = rect(label.x, label.y, lw, lh);

    const allObstacles = [
        ...nodes.map(n => rect(n.x, n.y, n.w, n.h)),
        ...otherLabels.map(l => rect(l.x, l.y, l.w || l.text.length * 7 + 10, l.h || 14)),
    ];

    for (const obs of allObstacles) {
        const expanded = expand(obs, minClearance);
        if (intersects(lr, expanded)) {
            // Calculate best push direction
            const pushes = [
                { dx: 0, dy: -(obs.y - (lr.y + lh)), desc: 'up' },
                { dx: 0, dy: (obs.y + obs.h - lr.y), desc: 'down' },
                { dx: -(obs.x - (lr.x + lw)), desc: 'left' },
                { dx: (obs.x + obs.w - lr.x), desc: 'right' },
            ];

            // Find smallest push that clears
            let best = null;
            let bestDist = Infinity;
            for (const push of pushes) {
                const d = Math.abs(push.dx) + Math.abs(push.dy);
                if (d < bestDist && d > 0) {
                    bestDist = d;
                    best = { dx: push.dx + minClearance * Math.sign(push.dx || 0),
                             dy: push.dy + minClearance * Math.sign(push.dy || 0) };
                }
            }

            return {
                collides: true,
                suggestion: best || { dx: 8, dy: 0 },
                collidedWith: obs,
            };
        }
    }

    return { collides: false, suggestion: null };
}

/**
 * Check all labels in a diagram and return collision reports.
 *
 * @param {Array<Object>} edges — [{ sourceId, targetId, label, labelX, labelY }]
 * @param {Array<Object>} nodes — [{ id, x, y, w, h }]
 * @returns {Array<Object>} collision reports with fix suggestions
 */
function auditLabelCollisions(edges, nodes) {
    const reports = [];
    const placedLabels = [];

    for (const edge of edges) {
        if (!edge.label) continue;

        // Approximate label position (midpoint of edge)
        const srcNode = nodes.find(n => n.id === edge.sourceId);
        const tgtNode = nodes.find(n => n.id === edge.targetId);
        if (!srcNode || !tgtNode) continue;

        const labelX = edge.labelX || (srcNode.x + srcNode.w / 2 + tgtNode.x + tgtNode.w / 2) / 2;
        const labelY = edge.labelY || (srcNode.y + srcNode.h / 2 + tgtNode.y + tgtNode.h / 2) / 2 - 10;
        const labelW = edge.label.length * 7 + 10;
        const labelH = 14;

        const result = checkLabelCollision(
            { x: labelX, y: labelY, width: labelW, height: labelH, text: edge.label },
            nodes.filter(n => n.id !== edge.sourceId && n.id !== edge.targetId),
            placedLabels
        );

        if (result.collides) {
            reports.push({
                edgeId: edge.id || `${edge.sourceId}→${edge.targetId}`,
                label: edge.label,
                position: { x: labelX, y: labelY },
                suggestion: result.suggestion,
                fix: `Add labelBackgroundColor=#FFFFFF to edge style and offset label by (${result.suggestion.dx}, ${result.suggestion.dy})`,
            });
        }

        placedLabels.push({ x: labelX, y: labelY, width: labelW, height: labelH, text: edge.label });
    }

    return reports;
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
    route, distributeParallelEdges,
    checkLabelCollision, auditLabelCollisions,
    rect, center, intersects, manhattan,
};
