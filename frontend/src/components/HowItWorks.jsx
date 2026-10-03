import React, { useState } from 'react';

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="how-section">
      <button className="collapsible-header" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <span className="chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="how-body">{children}</div>}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="card">
      <h2 className="card-title">📚 How It Works</h2>

      <Section title="🔷 Dynamic Programming (Held-Karp)">
        <ul className="how-list">
          <li>Breaks TSP into overlapping subproblems: <em>"What is the shortest path from the depot to city i, having visited exactly the cities in set S?"</em></li>
          <li>State: <code>dp[S][i]</code> = minimum cost to reach city <code>i</code> having visited the subset <code>S</code>.</li>
          <li>Builds solutions bottom-up — from subsets of size 1 up to the full set.</li>
          <li>Reuses previously solved states via memoization, avoiding redundant computation.</li>
          <li>Reconstructs the optimal route by backtracking through a parent table.</li>
          <li>Guarantees the globally optimal solution.</li>
        </ul>
        <div className="complexity-box blue-box">
          <strong>Time:</strong> O(n² · 2ⁿ) &nbsp;|&nbsp; <strong>Space:</strong> O(n · 2ⁿ)
        </div>
      </Section>

      <Section title="🔶 Branch & Bound (Reduced Cost Matrix)">
        <ul className="how-list">
          <li>Builds possible routes step-by-step as a search tree.</li>
          <li>Maintains the best complete tour found so far (<em>upper bound</em>).</li>
          <li>Computes a <em>lower bound</em> for each partial route via matrix reduction:
            subtract each row's minimum, then each column's minimum — the sum gives a guaranteed lower bound.</li>
          <li>Prunes any branch whose lower bound ≥ current best — it cannot lead to a better solution.</li>
          <li>Uses a min-heap priority queue to explore most-promising nodes first (Best-First Search).</li>
          <li>Tracks nodes explored and branches pruned to demonstrate effectiveness of pruning.</li>
        </ul>
        <div className="complexity-box orange-box">
          <strong>Worst case:</strong> Exponential — but aggressive pruning often explores far fewer nodes in practice.
        </div>
      </Section>

      <Section title="📊 Problem Complexity">
        <p className="complexity-intro">
          The number of possible delivery tours grows extremely quickly as the number of locations increases.
          This makes TSP a canonical example for comparing optimization strategies.
        </p>
        <div className="complexity-table">
          <div className="complexity-row header-row">
            <span>Approach</span>
            <span>Complexity</span>
            <span>4 cities</span>
            <span>8 cities</span>
            <span>12 cities</span>
          </div>
          <div className="complexity-row">
            <span>Brute Force</span>
            <span><code>O(n!)</code></span>
            <span>24</span>
            <span>40,320</span>
            <span>479,001,600</span>
          </div>
          <div className="complexity-row">
            <span>Dynamic Programming</span>
            <span><code>O(n² · 2ⁿ)</code></span>
            <span>48</span>
            <span>16,384</span>
            <span>589,824</span>
          </div>
          <div className="complexity-row">
            <span>Branch & Bound</span>
            <span>Varies (pruning)</span>
            <span>≪ n!</span>
            <span>≪ n!</span>
            <span>≪ n!</span>
          </div>
        </div>
        <p className="complexity-note">
          <em>Note: Branch &amp; Bound worst-case is still exponential. Its advantage over DP depends on the specific instance and how effectively branches are pruned.</em>
        </p>
      </Section>

      <Section title="🏫 Campus Delivery Demo">
        <div className="demo-scenario">
          <p>
            A delivery vehicle starts at the <strong>campus depot</strong>, visits several customer
            locations around campus, and returns to the depot.
          </p>
          <p>
            The optimizer finds the <strong>minimum-distance tour</strong> — ensuring the delivery
            driver travels as little as possible while visiting every customer exactly once.
          </p>
          <p>
            Both algorithms are <em>exact</em> — they always find the globally optimal solution.
            Their results are guaranteed to match for any given set of locations.
          </p>
        </div>
      </Section>
    </div>
  );
}
