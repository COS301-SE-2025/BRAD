import React, { useState, useEffect } from 'react';
import '../styles/ReporterDashboard.css';
import Navbar from '../components/Navbar';
import API from '../api/axios';

const ReporterDashboard = () => {
  const [domain, setDomain] = useState('');
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const submitReport = async () => {
    if (!domain) return alert('Please enter a domain/URL');

    try {
      await API.post('/report', { domain, submittedBy: user._id });
      setDomain('');
      alert('Report submitted successfully!');
      setTimeout(() => fetchReports(), 1000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report');
    }
  };

  const fetchReports = async () => {
    try {
      const response = await API.get('/reports');
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

useEffect(() => {
  fetchReports();

  const interval = setInterval(() => {
    fetchReports();
  }, 5000); // every 5 seconds

  return () => clearInterval(interval);
}, []);


  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <div className="submit-section">
          <h2>Submit Suspicious URL</h2>
          <div className="url-input-group">
            <input type="text" placeholder="Enter URL" className="url-input" value={domain} onChange={(e) => setDomain(e.target.value)} />
            <button className="submit-url-button" onClick={submitReport}>Submit</button>
          </div>
        </div>

        <div className="history-section">
          <div className="history-header">
            <h2>Report History</h2>
            <select className="filter-select" onChange={(e) => setFilter(e.target.value)}>
              <option value="">Filter by status</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="report-list">
            {reports
              .filter(r => filter === ''
                ? true
                : filter === 'Resolved'
                ? r.investigatorDecision
                : !r.investigatorDecision)
              .map(report => (
                <div className="report-card" key={report._id}>
                  <p><strong>{report.domain}</strong></p>
                  <p>Date Submitted: {new Date(report.createdAt).toLocaleString()}</p>
                  <p>Status: {report.investigatorDecision ? 'Resolved' : 'Pending'}</p>
                    {report.investigatorDecision && report.analysis && (
                      <button className="view-button" onClick={() => setSelectedReport(report)}>
                        View Analysis
                      </button>
                    )}
                </div>
              ))}
          </div>
        </div>

        {selectedReport && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Analysis for {selectedReport.domain}</h3>
              <p><strong>Verdict:</strong> {selectedReport.investigatorDecision ?? 'Not decided'}</p>
              <p><strong>Score:</strong> {selectedReport.analysis?.riskScore ?? 'N/A'}</p>
              <button onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReporterDashboard;
