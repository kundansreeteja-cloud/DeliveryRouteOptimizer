/**
 * Branch and Bound Algorithm for TSP
 *
 * Uses a priority-queue (min-heap) with lower-bound pruning.
 *
 * Lower Bound calculation (Reduced Cost Matrix):
 *   For each row subtract its minimum; for each column subtract its minimum.
 *   The sum of all reductions is the initial lower bound.
 *   For each node expansion the bound is updated by the edge cost + reduction
 *   of the new sub-matrix.
 *
 * This guarantees that pruned branches cannot contain an optimal solution.
 */

function euclidean(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function buildDistanceMatrix(locations) {
  const n = locations.length;
  const dist = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      dist[i][j] = i === j ? Infinity : euclidean(locations[i], locations[j]);
    }
  }
  return dist;
}

/**
 * Reduce a cost matrix: subtract row/column minima.
 * Returns { reducedMatrix, reductionCost }.
 */
function reduceMatrix(matrix) {
  const n = matrix.length;
  const m = matrix.map((row) => [...row]);
  let cost = 0;

  // Row reduction
  for (let i = 0; i < n; i++) {
    const rowMin = Math.min(...m[i]);
    if (rowMin !== Infinity && rowMin > 0) {
      cost += rowMin;
      for (let j = 0; j < n; j++) {
        if (m[i][j] !== Infinity) m[i][j] -= rowMin;
      }
    }
  }

  // Column reduction
  for (let j = 0; j < n; j++) {
    const colMin = Math.min(...m.map((row) => row[j]));
    if (colMin !== Infinity && colMin > 0) {
      cost += colMin;
      for (let i = 0; i < n; i++) {
        if (m[i][j] !== Infinity) m[i][j] -= colMin;
      }
    }
  }

  return { reducedMatrix: m, reductionCost: cost };
}

/**
 * Create the child matrix when we travel from city `from` to city `to`.
 * - Set row `from` and column `to` to Infinity.
 * - Set cell [to][0] (depot) to Infinity to prevent premature sub-tour.
 */
function getChildMatrix(matrix, from, to, depot) {
  const n = matrix.length;
  const m = matrix.map((row) => [...row]);

  // Eliminate the row of `from` and column of `to`
  for (let j = 0; j < n; j++) m[from][j] = Infinity;
  for (let i = 0; i < n; i++) m[i][to] = Infinity;

  // Prevent sub-tour back to depot until the full tour is formed
  m[to][depot] = Infinity;

  return m;
}

/**
 * Simple min-heap implementation for the priority queue.
 */
class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(node) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size() {
    return this.heap.length;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].bound <= this.heap[i].bound) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.heap[l].bound < this.heap[smallest].bound) smallest = l;
      if (r < n && this.heap[r].bound < this.heap[smallest].bound) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

/**
 * Solve TSP via Branch and Bound (Reduced Cost Matrix method).
 *
 * @param {Array}  locations  - Array of { name, x, y }
 * @param {number} depotIndex - Index of the starting depot
 * @returns {{ route, distance, nodesExplored, branchesPruned, executionTime }}
 */
export function solveTSP_BnB(locations, depotIndex = 0) {
  const startTime = performance.now();
  const n = locations.length;

  if (n === 1) {
    return {
      route: [locations[0].name, locations[0].name],
      distance: 0,
      nodesExplored: 0,
      branchesPruned: 0,
      executionTime: performance.now() - startTime,
    };
  }

  // Reorder so depot is index 0 internally
  const reordered = [
    locations[depotIndex],
    ...locations.filter((_, i) => i !== depotIndex),
  ];

  const rawDist = buildDistanceMatrix(reordered);

  // Initial matrix reduction
  const { reducedMatrix: initMatrix, reductionCost: initCost } =
    reduceMatrix(rawDist);

  // Root node: start at depot (0), visited only depot
  const root = {
    matrix: initMatrix,
    bound: initCost,
    path: [0],
    level: 0,
    city: 0,
  };

  const pq = new MinHeap();
  pq.push(root);

  let bestCost = Infinity;
  let bestPath = [];
  let nodesExplored = 0;
  let branchesPruned = 0;

  while (pq.size > 0) {
    const node = pq.pop();

    // Prune: if lower bound exceeds best, skip
    if (node.bound >= bestCost) {
      branchesPruned++;
      continue;
    }

    nodesExplored++;

    const { matrix, bound, path, city } = node;

    // If all cities visited, close the tour
    if (path.length === n) {
      const returnCost = rawDist[city][0];
      if (returnCost === Infinity) continue;
      const totalCost = bound + returnCost;
      // Note: bound already incorporates all edge costs via reduction
      // We use a simpler approach: track actual path cost
      // Recompute actual tour cost from the reconstructed path
      let actualCost = 0;
      for (let i = 0; i < path.length - 1; i++) {
        actualCost += rawDist[path[i]][path[i + 1]];
      }
      actualCost += rawDist[path[path.length - 1]][0]; // return to depot

      if (actualCost < bestCost) {
        bestCost = actualCost;
        bestPath = [...path, 0];
      }
      continue;
    }

    // Branch: try all unvisited cities
    for (let next = 0; next < n; next++) {
      if (path.includes(next)) continue;

      const childMatrix = getChildMatrix(matrix, city, next, 0);
      const { reducedMatrix, reductionCost } = reduceMatrix(childMatrix);

      const edgeCost = matrix[city][next] === Infinity ? Infinity : matrix[city][next];
      if (edgeCost === Infinity) {
        branchesPruned++;
        continue;
      }

      const childBound = bound + edgeCost + reductionCost;

      if (childBound < bestCost) {
        pq.push({
          matrix: reducedMatrix,
          bound: childBound,
          path: [...path, next],
          level: node.level + 1,
          city: next,
        });
      } else {
        branchesPruned++;
      }
    }
  }

  const route = bestPath.map((i) => reordered[i].name);
  const executionTime = performance.now() - startTime;

  return {
    route,
    distance: bestCost,
    nodesExplored,
    branchesPruned,
    executionTime,
  };
}
