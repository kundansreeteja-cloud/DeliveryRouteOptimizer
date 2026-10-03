/**
 * Standalone Node.js verification script for TSP algorithms.
 * Tests correctness of DP and BnB with the default 7-location demo data.
 * Run: node verify.mjs
 */

// ─── Copy of algorithm code (inline for Node.js, no imports) ─────────────────

function euclidean(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function buildDistMatrix(locs) {
  const n = locs.length;
  const dist = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      dist[i][j] = euclidean(locs[i], locs[j]);
  return dist;
}

// ── Held-Karp DP ──────────────────────────────────────────────────────────────
function solveTSP_DP(locations, depotIndex = 0) {
  const n = locations.length;
  const reordered = [locations[depotIndex], ...locations.filter((_, i) => i !== depotIndex)];
  const dist = buildDistMatrix(reordered);
  const FULL_MASK = (1 << n) - 1;
  const INF = Infinity;

  const dp = Array.from({ length: 1 << n }, () => Array(n).fill(INF));
  const parent = Array.from({ length: 1 << n }, () => Array(n).fill(-1));
  dp[1][0] = 0;
  let statesExplored = 0;

  for (let mask = 1; mask < (1 << n); mask++) {
    if (!(mask & 1)) continue;
    for (let u = 0; u < n; u++) {
      if (!(mask & (1 << u))) continue;
      if (dp[mask][u] === INF) continue;
      statesExplored++;
      for (let v = 0; v < n; v++) {
        if (mask & (1 << v)) continue;
        const newMask = mask | (1 << v);
        const newCost = dp[mask][u] + dist[u][v];
        if (newCost < dp[newMask][v]) {
          dp[newMask][v] = newCost;
          parent[newMask][v] = u;
        }
      }
    }
  }

  let bestCost = INF, lastCity = -1;
  for (let u = 1; u < n; u++) {
    if (dp[FULL_MASK][u] === INF) continue;
    const cost = dp[FULL_MASK][u] + dist[u][0];
    if (cost < bestCost) { bestCost = cost; lastCity = u; }
  }

  const routeIndices = [];
  let mask = FULL_MASK, cur = lastCity;
  while (cur !== -1) {
    routeIndices.push(cur);
    const prev = parent[mask][cur];
    mask ^= (1 << cur);
    cur = prev;
  }
  routeIndices.reverse();
  routeIndices.push(0);
  const route = routeIndices.map(i => reordered[i].name);

  return { route, distance: bestCost, statesExplored };
}

// ── Branch and Bound ──────────────────────────────────────────────────────────
function buildDistMatrixBnB(locs) {
  const n = locs.length;
  const dist = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      dist[i][j] = i === j ? Infinity : euclidean(locs[i], locs[j]);
  return dist;
}

function reduceMatrix(matrix) {
  const n = matrix.length;
  const m = matrix.map(row => [...row]);
  let cost = 0;
  for (let i = 0; i < n; i++) {
    const rowMin = Math.min(...m[i]);
    if (rowMin !== Infinity && rowMin > 0) {
      cost += rowMin;
      for (let j = 0; j < n; j++) if (m[i][j] !== Infinity) m[i][j] -= rowMin;
    }
  }
  for (let j = 0; j < n; j++) {
    const colMin = Math.min(...m.map(row => row[j]));
    if (colMin !== Infinity && colMin > 0) {
      cost += colMin;
      for (let i = 0; i < n; i++) if (m[i][j] !== Infinity) m[i][j] -= colMin;
    }
  }
  return { reducedMatrix: m, reductionCost: cost };
}

function getChildMatrix(matrix, from, to, depot) {
  const n = matrix.length;
  const m = matrix.map(row => [...row]);
  for (let j = 0; j < n; j++) m[from][j] = Infinity;
  for (let i = 0; i < n; i++) m[i][to] = Infinity;
  m[to][depot] = Infinity;
  return m;
}

class MinHeap {
  constructor() { this.heap = []; }
  push(node) { this.heap.push(node); this._bubbleUp(this.heap.length - 1); }
  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) { this.heap[0] = last; this._sinkDown(0); }
    return top;
  }
  get size() { return this.heap.length; }
  _bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.heap[p].bound <= this.heap[i].bound) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]]; i = p;
    }
  }
  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let s = i; const l = 2*i+1, r = 2*i+2;
      if (l < n && this.heap[l].bound < this.heap[s].bound) s = l;
      if (r < n && this.heap[r].bound < this.heap[s].bound) s = r;
      if (s === i) break;
      [this.heap[s], this.heap[i]] = [this.heap[i], this.heap[s]]; i = s;
    }
  }
}

function solveTSP_BnB(locations, depotIndex = 0) {
  const n = locations.length;
  const reordered = [locations[depotIndex], ...locations.filter((_, i) => i !== depotIndex)];
  const rawDist = buildDistMatrixBnB(reordered);
  const { reducedMatrix: initMatrix, reductionCost: initCost } = reduceMatrix(rawDist);

  const root = { matrix: initMatrix, bound: initCost, path: [0], level: 0, city: 0 };
  const pq = new MinHeap();
  pq.push(root);

  let bestCost = Infinity, bestPath = [], nodesExplored = 0, branchesPruned = 0;

  while (pq.size > 0) {
    const node = pq.pop();
    if (node.bound >= bestCost) { branchesPruned++; continue; }
    nodesExplored++;
    const { matrix, bound, path, city } = node;

    if (path.length === n) {
      const returnCost = rawDist[city][0];
      if (returnCost === Infinity) continue;
      let actualCost = 0;
      for (let i = 0; i < path.length - 1; i++) actualCost += rawDist[path[i]][path[i + 1]];
      actualCost += rawDist[path[path.length - 1]][0];
      if (actualCost < bestCost) { bestCost = actualCost; bestPath = [...path, 0]; }
      continue;
    }

    for (let next = 0; next < n; next++) {
      if (path.includes(next)) continue;
      const childMatrix = getChildMatrix(matrix, city, next, 0);
      const { reducedMatrix, reductionCost } = reduceMatrix(childMatrix);
      const edgeCost = matrix[city][next] === Infinity ? Infinity : matrix[city][next];
      if (edgeCost === Infinity) { branchesPruned++; continue; }
      const childBound = bound + edgeCost + reductionCost;
      if (childBound < bestCost) {
        pq.push({ matrix: reducedMatrix, bound: childBound, path: [...path, next], level: node.level + 1, city: next });
      } else { branchesPruned++; }
    }
  }

  const route = bestPath.map(i => reordered[i].name);
  return { route, distance: bestCost, nodesExplored, branchesPruned };
}

// ─── Test helpers ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

function approxEqual(a, b, tol = 1e-6) {
  return Math.abs(a - b) < tol;
}

function computeActualDistance(route, allLocations) {
  // route is array of names; compute distance summing each consecutive pair
  const locMap = {};
  allLocations.forEach(l => locMap[l.name] = l);
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = locMap[route[i]];
    const b = locMap[route[i + 1]];
    total += euclidean(a, b);
  }
  return total;
}

function validateRoute(route, locations, depotName) {
  // 1. Starts at depot
  const startsAtDepot = route[0] === depotName;
  // 2. Ends at depot
  const endsAtDepot = route[route.length - 1] === depotName;
  // 3. Visits every location exactly once (excluding the return depot)
  const inner = route.slice(1, route.length - 1);
  const allNames = locations.map(l => l.name);
  const nonDepotNames = allNames.filter(n => n !== depotName);
  const coversAll = nonDepotNames.every(n => inner.includes(n));
  const noRepeats = new Set(inner).size === inner.length;
  return { startsAtDepot, endsAtDepot, coversAll, noRepeats };
}

// ─── Default dataset ──────────────────────────────────────────────────────────
const LOCATIONS = [
  { id: 1, name: 'Depot',      x: 0, y: 0 },
  { id: 2, name: 'Customer A', x: 2, y: 6 },
  { id: 3, name: 'Customer B', x: 5, y: 4 },
  { id: 4, name: 'Customer C', x: 8, y: 7 },
  { id: 5, name: 'Customer D', x: 7, y: 2 },
  { id: 6, name: 'Customer E', x: 4, y: 1 },
  { id: 7, name: 'Customer F', x: 1, y: 3 },
];

// ─── Run tests ────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
console.log('   DELIVERY ROUTE OPTIMIZER — ALGORITHM VERIFICATION');
console.log('══════════════════════════════════════════════════════\n');

// ── Test 1: DP on default data ────────────────────────────────────────────────
console.log('── TEST 1: Dynamic Programming (7 locations, Depot as start) ──');
const dpResult = solveTSP_DP(LOCATIONS, 0);
console.log(`  Route:    ${dpResult.route.join(' → ')}`);
console.log(`  Distance: ${dpResult.distance.toFixed(6)}`);
console.log(`  States:   ${dpResult.statesExplored}`);

const dpV = validateRoute(dpResult.route, LOCATIONS, 'Depot');
assert(dpV.startsAtDepot, 'DP route starts at Depot');
assert(dpV.endsAtDepot,   'DP route ends at Depot');
assert(dpV.coversAll,     'DP route visits all locations');
assert(dpV.noRepeats,     'DP route has no repeated stops');
assert(dpResult.statesExplored > 0, 'DP reports > 0 states explored');
assert(isFinite(dpResult.distance) && dpResult.distance > 0, 'DP distance is finite and positive');

// Verify distance calculation matches route
const dpActual = computeActualDistance(dpResult.route, LOCATIONS);
assert(approxEqual(dpResult.distance, dpActual, 1e-9), 
  `DP reported distance (${dpResult.distance.toFixed(6)}) matches recomputed (${dpActual.toFixed(6)})`);

console.log();

// ── Test 2: BnB on default data ────────────────────────────────────────────────
console.log('── TEST 2: Branch & Bound (7 locations, Depot as start) ──');
const bnbResult = solveTSP_BnB(LOCATIONS, 0);
console.log(`  Route:    ${bnbResult.route.join(' → ')}`);
console.log(`  Distance: ${bnbResult.distance.toFixed(6)}`);
console.log(`  Nodes:    ${bnbResult.nodesExplored}`);
console.log(`  Pruned:   ${bnbResult.branchesPruned}`);

const bnbV = validateRoute(bnbResult.route, LOCATIONS, 'Depot');
assert(bnbV.startsAtDepot, 'BnB route starts at Depot');
assert(bnbV.endsAtDepot,   'BnB route ends at Depot');
assert(bnbV.coversAll,     'BnB route visits all locations');
assert(bnbV.noRepeats,     'BnB route has no repeated stops');
assert(bnbResult.nodesExplored > 0, 'BnB reports > 0 nodes explored');
assert(bnbResult.branchesPruned > 0, 'BnB reports > 0 branches pruned');
assert(isFinite(bnbResult.distance) && bnbResult.distance > 0, 'BnB distance is finite and positive');

// Verify BnB distance calculation
const bnbActual = computeActualDistance(bnbResult.route, LOCATIONS);
assert(approxEqual(bnbResult.distance, bnbActual, 1e-9),
  `BnB reported distance (${bnbResult.distance.toFixed(6)}) matches recomputed (${bnbActual.toFixed(6)})`);

console.log();

// ── Test 3: Both agree ───────────────────────────────────────────────────────
console.log('── TEST 3: Both algorithms agree on optimal distance ──');
assert(approxEqual(dpResult.distance, bnbResult.distance, 1e-6),
  `DP (${dpResult.distance.toFixed(6)}) === BnB (${bnbResult.distance.toFixed(6)}) within 1e-6`);

console.log();

// ── Test 4: Different depot ───────────────────────────────────────────────────
console.log('── TEST 4: Different starting depot (Customer B = index 2) ──');
const dp4 = solveTSP_DP(LOCATIONS, 2);   // Customer B
const bnb4 = solveTSP_BnB(LOCATIONS, 2);
console.log(`  DP:  ${dp4.route.join(' → ')} | dist=${dp4.distance.toFixed(6)}`);
console.log(`  BnB: ${bnb4.route.join(' → ')} | dist=${bnb4.distance.toFixed(6)}`);

const dp4V = validateRoute(dp4.route, LOCATIONS, 'Customer B');
assert(dp4V.startsAtDepot, 'DP starts at Customer B when depot=2');
assert(dp4V.endsAtDepot,   'DP ends at Customer B when depot=2');
assert(dp4V.coversAll,     'DP covers all locations with depot=Customer B');
const bnb4V = validateRoute(bnb4.route, LOCATIONS, 'Customer B');
assert(bnb4V.startsAtDepot, 'BnB starts at Customer B when depot=2');
assert(bnb4V.endsAtDepot,   'BnB ends at Customer B when depot=2');
assert(approxEqual(dp4.distance, bnb4.distance, 1e-6),
  `Both agree on optimal distance for depot=Customer B`);

// TSP optimal length is independent of starting node
assert(approxEqual(dp4.distance, dpResult.distance, 1e-6),
  `Optimal TSP distance is same regardless of starting depot (TSP property)`);

console.log();

// ── Test 5: Minimum dataset (2 locations) ─────────────────────────────────────
console.log('── TEST 5: Minimum dataset (2 locations) ──');
const two = [{ name: 'A', x: 0, y: 0 }, { name: 'B', x: 3, y: 4 }];
const dp5 = solveTSP_DP(two, 0);
const bnb5 = solveTSP_BnB(two, 0);
console.log(`  DP:  ${dp5.route.join(' → ')} | dist=${dp5.distance.toFixed(6)}`);
console.log(`  BnB: ${bnb5.route.join(' → ')} | dist=${bnb5.distance.toFixed(6)}`);
const expected2 = 2 * 5; // A→B = 5, B→A = 5
assert(approxEqual(dp5.distance, expected2, 1e-6), `DP: 2-city distance = 10 (A→B→A, dist=5 each)`);
assert(approxEqual(bnb5.distance, expected2, 1e-6), `BnB: 2-city distance = 10`);
assert(approxEqual(dp5.distance, bnb5.distance, 1e-6), 'Both agree for 2 cities');

console.log();

// ── Test 6: Small known-optimal (3 cities) ────────────────────────────────────
console.log('── TEST 6: 3-city triangle (equilateral: side=1, only one tour) ──');
const tri = [
  { name: 'X', x: 0, y: 0 },
  { name: 'Y', x: 1, y: 0 },
  { name: 'Z', x: 0.5, y: Math.sqrt(3)/2 },
];
const dp6 = solveTSP_DP(tri, 0);
const bnb6 = solveTSP_BnB(tri, 0);
console.log(`  DP:  ${dp6.route.join(' → ')} | dist=${dp6.distance.toFixed(6)}`);
console.log(`  BnB: ${bnb6.route.join(' → ')} | dist=${bnb6.distance.toFixed(6)}`);
assert(approxEqual(dp6.distance, 3.0, 1e-6), `DP equilateral triangle = 3.0`);
assert(approxEqual(bnb6.distance, 3.0, 1e-6), `BnB equilateral triangle = 3.0`);
assert(approxEqual(dp6.distance, bnb6.distance, 1e-6), 'Both agree for triangle');

console.log();

// ── Test 7: 9-city (max supported) ───────────────────────────────────────────
console.log('── TEST 7: 9-city dataset (maximum supported) ──');
const nine = Array.from({ length: 9 }, (_, i) => ({
  name: `C${i}`, x: Math.round(Math.cos(2*Math.PI*i/9)*10), y: Math.round(Math.sin(2*Math.PI*i/9)*10)
}));
const dp7 = solveTSP_DP(nine, 0);
const bnb7 = solveTSP_BnB(nine, 0);
console.log(`  DP:  dist=${dp7.distance.toFixed(6)}, states=${dp7.statesExplored}`);
console.log(`  BnB: dist=${bnb7.distance.toFixed(6)}, nodes=${bnb7.nodesExplored}, pruned=${bnb7.branchesPruned}`);
const dp7V = validateRoute(dp7.route, nine, 'C0');
const bnb7V = validateRoute(bnb7.route, nine, 'C0');
assert(dp7V.startsAtDepot && dp7V.endsAtDepot && dp7V.coversAll && dp7V.noRepeats, 'DP valid route for 9 cities');
assert(bnb7V.startsAtDepot && bnb7V.endsAtDepot && bnb7V.coversAll && bnb7V.noRepeats, 'BnB valid route for 9 cities');
assert(approxEqual(dp7.distance, bnb7.distance, 1e-5), 
  `Both agree for 9 cities: DP=${dp7.distance.toFixed(4)}, BnB=${bnb7.distance.toFixed(4)}`);

console.log();

// ── Test 8: Distance calculation cross-check ────────────────────────────────
console.log('── TEST 8: Manual distance verification for known 4-city case ──');
const sq = [
  { name: 'O', x: 0, y: 0 },
  { name: 'A', x: 1, y: 0 },
  { name: 'B', x: 1, y: 1 },
  { name: 'C', x: 0, y: 1 },
];
// Optimal for square corners: perimeter = 4.0
const dp8 = solveTSP_DP(sq, 0);
const bnb8 = solveTSP_BnB(sq, 0);
console.log(`  DP:  ${dp8.route.join(' → ')} | dist=${dp8.distance.toFixed(6)}`);
console.log(`  BnB: ${bnb8.route.join(' → ')} | dist=${bnb8.distance.toFixed(6)}`);
assert(approxEqual(dp8.distance, 4.0, 1e-6), `Square perimeter optimal = 4.0 (DP got ${dp8.distance.toFixed(6)})`);
assert(approxEqual(bnb8.distance, 4.0, 1e-6), `Square perimeter optimal = 4.0 (BnB got ${bnb8.distance.toFixed(6)})`);

console.log();

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('══════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('  🎉 ALL TESTS PASSED — algorithms are correct!');
} else {
  console.log('  ⚠️  Some tests FAILED — see above for details.');
}
console.log('══════════════════════════════════════════════════════\n');
