import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import '../styles/InvestigatorDashboard.css';
import InvestigatorNavbar from '../components/InvestigatorNavbar';

const InvestigatorDashboard = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    try {
      const res = await API.get('/reports');
      setReports(res.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const handleDecision = async (id, verdict) => {
    try {
      await API.patch(`/report/${id}/decision`, { verdict });
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      console.error("Error submitting decision:", err);
    }
  };

  useEffect(() => {
    fetchReports();

    const interval = setInterval(() => {
      fetchReports();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const pending = reports.filter(r => r.analyzed && !r.investigatorDecision);
  const completed = reports.filter(r => r.investigatorDecision);

  return (
    <div className="investigator-dashboard">
      <InvestigatorNavbar />

      <div className="dashboard-main">
        <h2>Welcome Investigator</h2>

        <div className="dashboard-columns">
          {/* Pending */}
          <div className="report-column">
            <h3>Reports Awaiting Review</h3>
            {pending.map(report => (
              <div className="report-card" key={report._id}>
                <p><strong>{report.domain}</strong></p>
                <p>Date: {new Date(report.createdAt).toLocaleString()}</p>
                <button className="view-button" onClick={() => setSelectedReport(report)}>
                  View Report
                </button>
              </div>
            ))}
          </div>

          {/* Completed */}
          <div className="report-column">
            <h3>Reviewed Reports</h3>
            {completed.map(report => (
              <div className="report-card" key={report._id}>
                <p><strong>{report.domain}</strong></p>
                <p>Date: {new Date(report.createdAt).toLocaleString()()}</p>
                <p>Verdict: {report.investigatorDecision}</p>
                <button className="view-button" onClick={() => setSelectedReport(report)}>
                  View Analysis
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Shared Modal */}
        {selectedReport && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Analysis for {selectedReport.domain}</h3>
              <pre>{JSON.stringify(selectedReport.analysis, null, 2)}</pre>

              {!selectedReport.investigatorDecision && (
                <div className="modal-buttons">
                  <button onClick={() => handleDecision(selectedReport._id, 'malicious')}>
                    Mark as Malicious
                  </button>
                  <button onClick={() => handleDecision(selectedReport._id, 'benign')}>
                    Mark as Safe
                  </button>
                </div>
              )}

              <button onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigatorDashboard;
