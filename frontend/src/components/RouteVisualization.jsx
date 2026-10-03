import React, { useMemo } from 'react';

const PADDING = 60;   // extra room for labels
const SVG_W   = 560;
const SVG_H   = 400;
const NODE_R  = 18;   // node circle radius

/**
 * Map real coordinates to SVG pixels.
 * Falls back gracefully when all x or all y values are identical.
 */
function scaleCoords(locations) {
  if (!locations.length) return [];

  const xs = locations.map((l) => l.x);
  const ys = locations.map((l) => l.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const drawW = SVG_W - PADDING * 2;
  const drawH = SVG_H - PADDING * 2;

  return locations.map((l) => ({
    ...l,
    svgX: PADDING + ((l.x - minX) / rangeX) * drawW,
    // SVG y-axis is inverted compared to Cartesian
    svgY: SVG_H - PADDING - ((l.y - minY) / rangeY) * drawH,
  }));
}

/** Draw a directed arrow between two node centers (shortened by NODE_R). */
function Arrow({ x1, y1, x2, y2, color }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  const ux = dx / len;
  const uy = dy / len;

  // Shorten both ends by the node radius so lines don't overlap circles
  const sx = x1 + ux * (NODE_R + 2);
  const sy = y1 + uy * (NODE_R + 2);
  const ex = x2 - ux * (NODE_R + 6);
  const ey = y2 - uy * (NODE_R + 6);

  // Arrowhead
  const angle = Math.atan2(ey - sy, ex - sx);
  const as    = 9;
  const a1x   = ex - as * Math.cos(angle - Math.PI / 6);
  const a1y   = ey - as * Math.sin(angle - Math.PI / 6);
  const a2x   = ex - as * Math.cos(angle + Math.PI / 6);
  const a2y   = ey - as * Math.sin(angle + Math.PI / 6);

  return (
    <g>
      <line
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={color} strokeWidth={2.2} strokeOpacity={0.75}
      />
      <polygon
        points={`${ex},${ey} ${a1x},${a1y} ${a2x},${a2y}`}
        fill={color} fillOpacity={0.9}
      />
    </g>
  );
}

/** Render just the location dots when no route has been calculated yet. */
function EmptyMap({ scaled, depotName }) {
  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="route-svg">
      {scaled.map((loc) => {
        const isDepot = loc.name === depotName;
        return (
          <g key={loc.name}>
            <circle
              cx={loc.svgX} cy={loc.svgY} r={NODE_R}
              fill={isDepot ? '#1d4ed8' : '#64748b'}
              stroke="#fff" strokeWidth={2.5}
            />
            <text
              x={loc.svgX} y={loc.svgY + 5}
              textAnchor="middle" fontSize="10" fill="white" fontWeight="700"
            >
              {loc.name.slice(0, 2).toUpperCase()}
            </text>
            <text
              x={loc.svgX} y={loc.svgY - 24}
              textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="600"
            >
              {loc.name}
            </text>
            <text
              x={loc.svgX} y={loc.svgY + 34}
              textAnchor="middle" fontSize="9" fill="#64748b"
            >
              ({loc.x},{loc.y})
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function RouteVisualization({ locations, route, depotName }) {
  const scaled = useMemo(() => scaleCoords(locations), [locations]);

  // Build name → scaled-location lookup
  const byName = useMemo(() => {
    const m = {};
    scaled.forEach((l) => { m[l.name] = l; });
    return m;
  }, [scaled]);

  if (!route || route.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">🗺️ Route Visualization</h2>
        <p className="vis-hint">Run optimization to see the route.</p>
        <EmptyMap scaled={scaled} depotName={depotName} />
      </div>
    );
  }

  // Build edges from consecutive stops in the route
  const edges = [];
  for (let i = 0; i < route.length - 1; i++) {
    const from = byName[route[i]];
    const to   = byName[route[i + 1]];
    if (from && to) edges.push({ from, to, order: i + 1 });
  }

  // Midpoint label position (slightly offset perpendicular to edge)
  function edgeMidLabel(e) {
    const mx = (e.from.svgX + e.to.svgX) / 2;
    const my = (e.from.svgY + e.to.svgY) / 2;
    const dx = e.to.svgX - e.from.svgX;
    const dy = e.to.svgY - e.from.svgY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // offset label 10px perpendicular
    return { x: mx - (dy / len) * 10, y: my + (dx / len) * 10 };
  }

  const routeColor  = '#3b82f6';
  const depotColor  = '#1d4ed8';
  const nodeColor   = '#10b981';
  const badgeColor  = '#f59e0b';

  return (
    <div className="card">
      <h2 className="card-title">🗺️ Optimized Delivery Route</h2>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="route-svg">
        {/* ── Edges ── */}
        {edges.map((e, i) => (
          <Arrow
            key={`edge-${i}`}
            x1={e.from.svgX} y1={e.from.svgY}
            x2={e.to.svgX}   y2={e.to.svgY}
            color={routeColor}
          />
        ))}

        {/* ── Edge order labels ── */}
        {edges.map((e, i) => {
          const { x, y } = edgeMidLabel(e);
          return (
            <text
              key={`elabel-${i}`}
              x={x} y={y}
              textAnchor="middle" fontSize="10" fill={routeColor} fontWeight="800"
            >
              {e.order}
            </text>
          );
        })}

        {/* ── Nodes ── */}
        {scaled.map((loc) => {
          const isDepot  = loc.name === depotName;
          // Find visit order (index in route, skip the last duplicate depot entry)
          const visitIdx = route.indexOf(loc.name);

          return (
            <g key={loc.name}>
              {/* Shadow ring for depot */}
              {isDepot && (
                <circle
                  cx={loc.svgX} cy={loc.svgY} r={NODE_R + 5}
                  fill="none" stroke={depotColor} strokeWidth={2} strokeOpacity={0.3}
                />
              )}
              <circle
                cx={loc.svgX} cy={loc.svgY} r={NODE_R}
                fill={isDepot ? depotColor : nodeColor}
                stroke={isDepot ? '#bfdbfe' : '#6ee7b7'}
                strokeWidth={3}
              />
              {/* Abbreviated name inside circle */}
              <text
                x={loc.svgX} y={loc.svgY + 5}
                textAnchor="middle" fontSize="10" fill="white" fontWeight="700"
              >
                {loc.name.slice(0, 2).toUpperCase()}
              </text>

              {/* Visit-order badge (amber dot top-right) */}
              {visitIdx >= 0 && (
                <>
                  <circle
                    cx={loc.svgX + 14} cy={loc.svgY - 14} r={10}
                    fill={badgeColor} stroke="#fff" strokeWidth={1.5}
                  />
                  <text
                    x={loc.svgX + 14} y={loc.svgY - 10}
                    textAnchor="middle" fontSize="9" fill="white" fontWeight="800"
                  >
                    {visitIdx === 0 ? 'S' : visitIdx}
                  </text>
                </>
              )}

              {/* Location name label above node */}
              <text
                x={loc.svgX} y={loc.svgY - 26}
                textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="700"
              >
                {loc.name}
              </text>

              {/* Coordinate label below node */}
              <text
                x={loc.svgX} y={loc.svgY + 36}
                textAnchor="middle" fontSize="9" fill="#64748b"
              >
                ({loc.x},{loc.y})
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Legend ── */}
      <div className="vis-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#1d4ed8' }} /> Depot
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#10b981' }} /> Customer
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#f59e0b' }} /> Visit Order
        </span>
        <span className="legend-item">
          <span className="legend-line" /> Route direction
        </span>
      </div>
    </div>
  );
}
