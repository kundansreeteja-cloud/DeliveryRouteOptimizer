import React, { useState, useMemo } from 'react';

function euclidean(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export default function DistanceMatrix({ locations }) {
  const [open, setOpen] = useState(false);

  const matrix = useMemo(() => {
    return locations.map((a) =>
      locations.map((b) => (a === b ? 0 : euclidean(a, b)))
    );
  }, [locations]);

  return (
    <div className="card">
      <button className="collapsible-header" onClick={() => setOpen((o) => !o)}>
        <span>📊 Distance Matrix</span>
        <span className="chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="matrix-wrapper">
          <p className="matrix-hint">
            Euclidean distances between all location pairs (2 decimal places).
          </p>
          <div className="matrix-scroll">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="matrix-corner">From \ To</th>
                  {locations.map((l) => (
                    <th key={l.id}>{l.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locations.map((rowLoc, i) => (
                  <tr key={rowLoc.id}>
                    <th className="matrix-row-header">{rowLoc.name}</th>
                    {matrix[i].map((dist, j) => (
                      <td
                        key={j}
                        className={`matrix-cell ${i === j ? 'matrix-diag' : ''}`}
                      >
                        {i === j ? '—' : dist.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
