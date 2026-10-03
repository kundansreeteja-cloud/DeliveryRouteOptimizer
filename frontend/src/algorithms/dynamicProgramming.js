/**
 * Held-Karp Dynamic Programming Algorithm for TSP
 *
 * Time Complexity:  O(n^2 * 2^n)
 * Space Complexity: O(n * 2^n)
 *
 * The key idea: dp[S][i] = minimum cost to reach city i
 * having visited exactly the cities in subset S,
 * starting from the depot (city 0).
 */

/**
 * Compute Euclidean distance between two locations.
 */
function euclidean(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Build an n×n distance matrix from locations array.
 */
export function buildDistanceMatrix(locations) {
  const n = locations.length;
  const dist = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      dist[i][j] = euclidean(locations[i], locations[j]);
    }
  }
  return dist;
}

/**
 * Solve TSP via Held-Karp DP.
 *
 * @param {Array}  locations  - Array of { name, x, y }
 * @param {number} depotIndex - Index of the starting depot
 * @returns {{ route, distance, statesExplored, executionTime }}
 */
export function solveTSP_DP(locations, depotIndex = 0) {
  const startTime = performance.now();
  const n = locations.length;

  if (n === 1) {
    return {
      route: [locations[0].name, locations[0].name],
      distance: 0,
      statesExplored: 0,
      executionTime: performance.now() - startTime,
    };
  }

  // Reorder so depot is index 0 internally
  const reordered = [
    locations[depotIndex],
    ...locations.filter((_, i) => i !== depotIndex),
  ];

  const dist = buildDistanceMatrix(reordered);
  const FULL_MASK = (1 << n) - 1;

  // dp[mask][i] = min cost to be at city i having visited cities in mask
  // mask bit j corresponds to reordered city j
  const INF = Infinity;
  const dp = Array.from({ length: 1 << n }, () => Array(n).fill(INF));
  // parent[mask][i] = previous city in optimal subpath
  const parent = Array.from({ length: 1 << n }, () => Array(n).fill(-1));

  // Start at depot (city 0), having visited only city 0
  dp[1][0] = 0;

  let statesExplored = 0;

  // Iterate over all subsets of cities
  for (let mask = 1; mask < (1 << n); mask++) {
    // Only process masks that include city 0 (depot)
    if (!(mask & 1)) continue;

    for (let u = 0; u < n; u++) {
      // u must be in the mask
      if (!(mask & (1 << u))) continue;
      if (dp[mask][u] === INF) continue;

      statesExplored++;

      // Extend to every unvisited city v
      for (let v = 0; v < n; v++) {
        if (mask & (1 << v)) continue; // already visited

        const newMask = mask | (1 << v);
        const newCost = dp[mask][u] + dist[u][v];

        if (newCost < dp[newMask][v]) {
          dp[newMask][v] = newCost;
          parent[newMask][v] = u;
        }
      }
    }
  }

  // Find the best last city to return to depot from
  let bestCost = INF;
  let lastCity = -1;

  for (let u = 1; u < n; u++) {
    if (dp[FULL_MASK][u] === INF) continue;
    const cost = dp[FULL_MASK][u] + dist[u][0];
    if (cost < bestCost) {
      bestCost = cost;
      lastCity = u;
    }
  }

  // Reconstruct route by backtracking through parent table
  const routeIndices = [];
  let mask = FULL_MASK;
  let cur = lastCity;

  while (cur !== -1) {
    routeIndices.push(cur);
    const prev = parent[mask][cur];
    mask ^= (1 << cur);
    cur = prev;
  }

  routeIndices.reverse();
  // routeIndices now goes: 0 → ... → lastCity
  // Add return to depot
  routeIndices.push(0);

  const route = routeIndices.map((i) => reordered[i].name);

  const executionTime = performance.now() - startTime;

  return {
    route,
    distance: bestCost,
    statesExplored,
    executionTime,
  };
}
