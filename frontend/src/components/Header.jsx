import React from 'react';

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-icon">🚚</div>
        <div className="header-text">
          <h1>Delivery Route Optimizer</h1>
          <p>Find the shortest delivery route using Dynamic Programming and Branch &amp; Bound</p>
        </div>
        <div className="header-pills">
          <span className="header-pill pill-dp">Held-Karp DP</span>
          <span className="header-pill pill-bnb">Branch &amp; Bound</span>
        </div>
      </div>
    </header>
  );
}
