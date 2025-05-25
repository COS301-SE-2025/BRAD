import React from 'react';
import '../styles/ReporterDashboard.css';
import Navbar from '../components/Navbar';

const ReporterDashboard = () => {
  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="dashboard-content">
        {/* Submit Section */}
        <div className="submit-section">
          <h2>Submit Suspicious URL</h2>
          <div className="url-input-group">
            <input type="text" placeholder="Enter URL" className="url-input" />
            <button className="submit-url-button">Submit</button>
          </div>
          <div className="evidence-upload">
            <p>Attach Optional Evidence</p>
            <div className="drop-area">Drag & Drop files here<br />or</div>
            <button className="browse-button">Browse files</button>
          </div>
        </div>

        {/* Report History Section */}
        <div className="history-section">
          <div className="history-header">
            <h2>Report History</h2>
            <select className="filter-select">
              <option>Filter by status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>

          <div className="report-list">
            <div className="report-card">
              <p>Report_Name</p>
              <p>Date Submitted: 2025/05/20</p>
              <p>Status: Pending...</p>
            </div>
            <div className="report-card">
              <p>Report_Name</p>
              <p>Date Submitted: 2025/05/14</p>
              <p>Status: Pending...</p>
            </div>
            <div className="report-card">
              <p>Report_Name</p>
              <p>Date Submitted: 2025/05/07</p>
              <p>Status: In Progress</p>
            </div>
            <div className="report-card">
              <p>Report_Name</p>
              <p>Date Submitted: 2025/05/20</p>
              <p>Status: Resolved</p>
              <button className="view-button">View Analysis</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporterDashboard;
