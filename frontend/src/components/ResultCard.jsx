import React from 'react';

/**
 * Metric explanations shown under each label — helps judges understand at a glance.
 */
const METRIC_HELP = {
  distance: 'Total Euclidean distance (units) of the optimal tour',
  time:     'Actual CPU time measured in this browser session',
  states:   'DP subproblems computed; grows as O(n²·2ⁿ)',
  nodes:    'B&B tree nodes expanded during search',
  pruned:   'Branches eliminated — never lead to a better solution',
  stops:    'Number of unique locations in the tour',
};

function MetricCard({ icon, label, value, help, accent, large }) {
  return (
    <div className={`metric-card ${accent ? `accent-${accent}` : ''} ${large ? 'metric-large' : ''}`}>
      <div className="metric-icon">{icon}</div>
      <div className={`metric-value ${large ? 'metric-value-lg' : ''}`}>{value}</div>
      <div className="metric-label">{label}</div>
      {help && <div className="metric-help">{help}</div>}
    </div>
  );
}

function RouteSteps({ route, depot }) {
  return (
    <div className="route-steps">
      {route.map((stop, idx) => {
        const isDepot = stop === depot;
        const isLast  = idx === route.length - 1;
        return (
          <React.Fragment key={idx}>
            <div className={`route-stop ${isDepot ? 'depot-stop' : ''}`}>
              <span className={`stop-index ${isDepot ? 'stop-index-depot' : ''}`}>
                {isDepot ? (isLast ? 'END' : 'START') : idx}
              </span>
              <span className="stop-name">{stop}</span>
              {isDepot && <span className="depot-tag">DEPOT</span>}
            </div>
            {!isLast && (
              <div className="route-connector">
                <span className="connector-line" />
                <span className="connector-arrow">↓</span>
                <span className="connector-line" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ResultCard({ result, algorithm }) {
  if (!result) return null;

  const isDp  = algorithm === 'dp';
  const isBnb = algorithm === 'bnb';
  const depotName = result.route[0];

  return (
    <div className={`card result-card result-card-${algorithm}`} id="result-section">
      {/* ── Banner ── */}
      <div className={`result-banner ${isBnb ? 'banner-bnb' : 'banner-dp'}`}>
        <span className="result-algo-name">
          {isDp ? '🔷 Dynamic Programming (Held-Karp)' : '🔶 Branch & Bound'}
        </span>
        <span className="result-status">✓ Optimal solution found</span>
      </div>

      {/* ── Hero distance ── */}
      <div className="distance-hero">
        <div className="distance-value">{result.distance.toFixed(4)}</div>
        <div className="distance-label">Optimal Tour Distance (Euclidean units)</div>
        <div className="distance-sub">
          Minimum possible distance visiting all {result.route.length - 1} stops and returning to depot
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className="metrics-grid">
        <MetricCard
          icon="⏱️"
          label="Execution Time"
          value={`${result.executionTime.toFixed(2)} ms`}
          help={METRIC_HELP.time}
          accent={isBnb ? 'orange' : 'blue'}
        />
        <MetricCard
          icon="📍"
          label="Locations"
          value={result.route.length - 1}
          help={METRIC_HELP.stops}
        />
        {isDp && (
          <MetricCard
            icon="🗂️"
            label="States Explored"
            value={result.statesExplored.toLocaleString()}
            help={METRIC_HELP.states}
            accent="blue"
          />
        )}
        {isBnb && (
          <>
            <MetricCard
              icon="🌿"
              label="Nodes Explored"
              value={result.nodesExplored.toLocaleString()}
              help={METRIC_HELP.nodes}
              accent="orange"
            />
            <MetricCard
              icon="✂️"
              label="Branches Pruned"
              value={result.branchesPruned.toLocaleString()}
              help={METRIC_HELP.pruned}
              accent="orange"
            />
          </>
        )}
      </div>

      {/* ── Route steps ── */}
      <div className="route-section">
        <div className="route-section-header">
          <h3 className="route-title">🗺️ Optimal Route</h3>
          <span className="route-summary">
            {result.route.slice(1, -1).join(' → ')}
          </span>
        </div>
        <RouteSteps route={result.route} depot={depotName} />
      </div>
    </div>
  );
}
