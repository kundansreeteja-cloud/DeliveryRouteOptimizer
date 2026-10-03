import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import LocationTable from './components/LocationTable';
import AlgorithmSelector from './components/AlgorithmSelector';
import ResultCard from './components/ResultCard';
import RouteVisualization from './components/RouteVisualization';
import DistanceMatrix from './components/DistanceMatrix';
import HowItWorks from './components/HowItWorks';
import { solveTSP_DP } from './algorithms/dynamicProgramming';
import { solveTSP_BnB } from './algorithms/branchAndBound';
import './styles.css';

// ─── Default demo dataset ───────────────────────────────────────────────────
const DEFAULT_LOCATIONS = [
  { id: 1, name: 'Depot',      x: 0, y: 0 },
  { id: 2, name: 'Customer A', x: 2, y: 6 },
  { id: 3, name: 'Customer B', x: 5, y: 4 },
  { id: 4, name: 'Customer C', x: 8, y: 7 },
  { id: 5, name: 'Customer D', x: 7, y: 2 },
  { id: 6, name: 'Customer E', x: 4, y: 1 },
  { id: 7, name: 'Customer F', x: 1, y: 3 },
];

// ─── Comparison result display ───────────────────────────────────────────────
function ComparisonTable({ dpResult, bnbResult }) {
  if (!dpResult || !bnbResult) return null;

  const sameOptimal =
    Math.abs(dpResult.distance - bnbResult.distance) < 1e-6;

  return (
    <div className="card comparison-card">
      <h2 className="card-title">⚡ Algorithm Comparison</h2>

      {sameOptimal ? (
        <div className="alert alert-success">
          ✅ Both algorithms found the same optimal distance:{' '}
          <strong>{dpResult.distance.toFixed(4)}</strong> — confirming the globally optimal tour.
          <br />
          <small>
            Both algorithms are exact approaches for this TSP instance. Equal optimal distance
            confirms the same optimum was found.
          </small>
        </div>
      ) : (
        <div className="alert alert-warn">
          ⚠️ Results differ — this may indicate an implementation issue. DP:{' '}
          {dpResult.distance.toFixed(4)} | B&amp;B: {bnbResult.distance.toFixed(4)}
        </div>
      )}

      <div className="matrix-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th className="dp-col">🔷 Dynamic Programming</th>
              <th className="bnb-col">🔶 Branch &amp; Bound</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Optimal Distance</td>
              <td className="dp-col">{dpResult.distance.toFixed(4)}</td>
              <td className="bnb-col">{bnbResult.distance.toFixed(4)}</td>
            </tr>
            <tr>
              <td>Execution Time</td>
              <td className="dp-col">{dpResult.executionTime.toFixed(3)} ms</td>
              <td className="bnb-col">{bnbResult.executionTime.toFixed(3)} ms</td>
            </tr>
            <tr>
              <td>States / Nodes Explored</td>
              <td className="dp-col">{dpResult.statesExplored.toLocaleString()} states</td>
              <td className="bnb-col">{bnbResult.nodesExplored.toLocaleString()} nodes</td>
            </tr>
            <tr>
              <td>Branches Pruned</td>
              <td className="dp-col dp-na">N/A</td>
              <td className="bnb-col">{bnbResult.branchesPruned.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Route</td>
              <td className="dp-col route-cell">{dpResult.route.join(' → ')}</td>
              <td className="bnb-col route-cell">{bnbResult.route.join(' → ')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Side-by-side route steps for comparison view ─────────────────────────────
function CompareRoutes({ dpResult, bnbResult }) {
  if (!dpResult || !bnbResult) return null;
  const depot = dpResult.route[0];

  return (
    <div className="compare-routes-grid">
      <div className="card dp-card">
        <h3 className="card-title">🔷 DP Route</h3>
        <div className="route-steps">
          {dpResult.route.map((stop, idx) => (
            <React.Fragment key={idx}>
              <div className={`route-stop ${stop === depot ? 'depot-stop' : ''}`}>
                <span className="stop-dot" />
                <span className="stop-name">{stop}</span>
                {stop === depot && <span className="depot-tag">DEPOT</span>}
              </div>
              {idx < dpResult.route.length - 1 && <div className="route-arrow">↓</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="card bnb-card">
        <h3 className="card-title">🔶 B&amp;B Route</h3>
        <div className="route-steps">
          {bnbResult.route.map((stop, idx) => (
            <React.Fragment key={idx}>
              <div className={`route-stop ${stop === depot ? 'depot-stop' : ''}`}>
                <span className="stop-dot" />
                <span className="stop-name">{stop}</span>
                {stop === depot && <span className="depot-tag">DEPOT</span>}
              </div>
              {idx < bnbResult.route.length - 1 && <div className="route-arrow">↓</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [locations, setLocations]   = useState(DEFAULT_LOCATIONS);
  const [depotIndex, setDepotIndex] = useState(0);
  const [algorithm, setAlgorithm]   = useState('dp');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const [dpResult, setDpResult]     = useState(null);
  const [bnbResult, setBnbResult]   = useState(null);
  const [activeAlgo, setActiveAlgo] = useState(null);

  // ── FIX: Clamp depotIndex if locations array shrinks ─────────────────────
  // e.g. user deletes the location that was selected as depot
  useEffect(() => {
    if (locations.length > 0 && depotIndex >= locations.length) {
      setDepotIndex(0);
    }
  }, [locations, depotIndex]);

  // ── FIX: Clear stale results when locations change ────────────────────────
  // Prevents showing an old route that no longer matches the current location set
  useEffect(() => {
    setDpResult(null);
    setBnbResult(null);
    setActiveAlgo(null);
    setError('');
  }, [locations]);

  // The route to display in the visualizer:
  const visRoute =
    activeAlgo === 'dp'   ? dpResult?.route  :
    activeAlgo === 'bnb'  ? bnbResult?.route :
    activeAlgo === 'both' ? dpResult?.route  : null;

  // Safe depot name — guard against undefined when index is clamping
  const safeDepotIndex = Math.min(depotIndex, locations.length - 1);
  const depotName = locations[safeDepotIndex]?.name ?? '';

  const handleOptimize = useCallback(() => {
    if (locations.length < 2) {
      setError('At least 2 locations are required.');
      return;
    }
    if (locations.length > 9) {
      setError('Maximum 9 locations supported for exact algorithms.');
      return;
    }
    setError('');
    setLoading(true);

    // Use setTimeout so the "Optimizing…" spinner has time to render
    setTimeout(() => {
      try {
        let dp = null, bnb = null;

        if (algorithm === 'dp' || algorithm === 'both') {
          dp = solveTSP_DP(locations, safeDepotIndex);
          setDpResult(dp);
        } else {
          setDpResult(null);
        }

        if (algorithm === 'bnb' || algorithm === 'both') {
          bnb = solveTSP_BnB(locations, safeDepotIndex);
          setBnbResult(bnb);
        } else {
          setBnbResult(null);
        }

        setActiveAlgo(algorithm);
      } catch (e) {
        setError(`Algorithm error: ${e.message}`);
      } finally {
        setLoading(false);
      }
    }, 20);
  }, [locations, safeDepotIndex, algorithm]);

  const handleReset = useCallback(() => {
    setLocations(DEFAULT_LOCATIONS);
    setDepotIndex(0);
    setAlgorithm('dp');
    setDpResult(null);
    setBnbResult(null);
    setActiveAlgo(null);
    setError('');
  }, []);

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        {error && (
          <div className="alert alert-error global-error">
            ❌ {error}
          </div>
        )}

        <div className="layout-grid">
          {/* Left column */}
          <div className="left-col">
            <LocationTable locations={locations} setLocations={setLocations} />
            <AlgorithmSelector
              locations={locations}
              depotIndex={safeDepotIndex}
              setDepotIndex={setDepotIndex}
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              onOptimize={handleOptimize}
              onReset={handleReset}
              loading={loading}
            />
          </div>

          {/* Right column */}
          <div className="right-col">
            <RouteVisualization
              locations={locations}
              route={visRoute}
              depotName={depotName}
            />

            {/* Single algo results */}
            {activeAlgo === 'dp' && dpResult && (
              <ResultCard result={dpResult} algorithm="dp" />
            )}
            {activeAlgo === 'bnb' && bnbResult && (
              <ResultCard result={bnbResult} algorithm="bnb" />
            )}

            {/* Comparison results */}
            {activeAlgo === 'both' && (
              <>
                <ComparisonTable dpResult={dpResult} bnbResult={bnbResult} />
                <CompareRoutes dpResult={dpResult} bnbResult={bnbResult} />
              </>
            )}

            <DistanceMatrix locations={locations} />
          </div>
        </div>

        <HowItWorks />
      </main>

      <footer className="footer">
        <p>
          Delivery Route Optimizer · Hackathon Project · Built with React + Vite ·
          Algorithms: Held-Karp DP &amp; Branch &amp; Bound
        </p>
      </footer>
    </div>
  );
}
