import React from 'react';
import '../styles/Landing.css';
// import statsIcon from '../assets/stats-icon.png'; // You can design your own nice icon

const PerformanceStats = () => {
  return (
    <div className="performance-stats-section" id="performance">
      <h2>B.R.A.D. Performance Stats</h2>
      <div className="stats-cards">

        <div className="stats-card">
          <h3>Analysis Speed</h3>
          <p><span>5 seconds</span> avg time for bot analysis</p>
        </div>

        <div className="stats-card">
          <h3>Investigator Response</h3>
          <p><span>24 hours</span> avg time to complete manual review</p>
        </div>

        <div className="stats-card">
          <h3>Accuracy Rate</h3>
          <p><span>98%</span> detection accuracy with AI engine</p>
        </div>

        <div className="stats-card">
          <h3>Reports Processed</h3>
          <p><span>10,000+</span> URLs analyzed successfully</p>
        </div>

      </div>
    </div>
  );
};

export default PerformanceStats;
