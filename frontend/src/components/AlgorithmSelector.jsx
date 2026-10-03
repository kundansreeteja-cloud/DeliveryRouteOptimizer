import React from 'react';

const ALGORITHMS = [
  { value: 'dp', label: '🔷 Dynamic Programming', description: 'Held-Karp exact algorithm' },
  { value: 'bnb', label: '🔶 Branch & Bound', description: 'Reduced cost matrix pruning' },
  { value: 'both', label: '⚡ Compare Both', description: 'Run both & compare results' },
];

export default function AlgorithmSelector({
  locations,
  depotIndex,
  setDepotIndex,
  algorithm,
  setAlgorithm,
  onOptimize,
  onReset,
  loading,
}) {
  const tooMany = locations.length > 9;

  return (
    <div className="card control-card">
      <div className="control-grid">
        {/* Depot selector */}
        <div className="control-group">
          <label className="control-label">🏠 Starting Depot</label>
          <select
            className="form-select"
            value={depotIndex}
            onChange={(e) => setDepotIndex(Number(e.target.value))}
          >
            {locations.map((loc, i) => (
              <option key={loc.id} value={i}>
                {loc.name} ({loc.x}, {loc.y})
              </option>
            ))}
          </select>
        </div>

        {/* Algorithm selector */}
        <div className="control-group">
          <label className="control-label">🧮 Algorithm</label>
          <div className="algo-options">
            {ALGORITHMS.map((a) => (
              <label
                key={a.value}
                className={`algo-option ${algorithm === a.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="algorithm"
                  value={a.value}
                  checked={algorithm === a.value}
                  onChange={() => setAlgorithm(a.value)}
                />
                <span className="algo-label">{a.label}</span>
                <span className="algo-desc">{a.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Stats & buttons */}
        <div className="control-group control-actions">
          <div className="location-badge">
            <span className="badge-num">{locations.length}</span>
            <span className="badge-label">Locations</span>
          </div>

          {tooMany && (
            <div className="alert alert-warn">
              ⚠️ Too many locations! Max 9 supported for exact algorithms.
              <br />
              <small>
                TSP has O(n!) possible tours — exponential algorithms become infeasible beyond ~9
                cities.
              </small>
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            onClick={onOptimize}
            disabled={loading || tooMany || locations.length < 2}
          >
            {loading ? '⏳ Optimizing…' : '🚀 Optimize Route'}
          </button>

          <button className="btn btn-ghost" onClick={onReset}>
            🔄 Reset Demo
          </button>
        </div>
      </div>
    </div>
  );
}
