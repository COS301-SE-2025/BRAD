import React, { useEffect, useState } from 'react';
import ReporterNavbar from '../components/ReporterNavbar';
import '../styles/ReporterDashboard.css';
import Notification from '../components/Notification';
import API from '../api/axios';

const ReporterDashboard = () => {
  const [history, setHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [notification, setNotification] = useState(null);
  const user = JSON.parse(localStorage.getItem('user')) || { username: 'Reporter' };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get('/reports/mine');
        setHistory(res.data);
      } catch (err) {
        showNotification('error', 'Failed to fetch report history.');
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="reporter-dashboard">
      <ReporterNavbar />

      <div className="dashboard-main">
        <h2 className="dashboard-greeting">Hello, {user.username} 👋</h2>

        <div className="dashboard-actions">
          <button className="settings-btn" onClick={() => window.location.href = '/settings'}>
            ⚙️ User Settings
          </button>
        </div>

        <h3>📜 Your Report History</h3>
        <div className="history-section">
          <div className="history-header">
            <h2>Report History</h2>
            <select
              className="filter-select"
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Filter by status</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="report-list">
            {reports
              .filter((r) =>
                filter === ''
                  ? true
                  : filter === 'Resolved'
                  ? r.investigatorDecision
                  : !r.investigatorDecision
              )
              .map((report) => (
             <div className="report-card" key={report._id}>
            <p><strong>{report.domain}</strong></p>
            <p>Date Submitted: {new Date(report.createdAt).toLocaleString()}</p>
            <p>Status: {report.investigatorDecision ? 'Resolved' : 'Pending'}</p>

            {report.evidence && report.evidence.length > 0 && (
            <div className="evidence-names">
            <p><strong>Evidence:</strong></p>
            <ul>
                {report.evidence.map((fileUrl, idx) => (
            <li
            key={idx}
            onClick={() => {
            const filename = fileUrl.split('/').pop();
            setActiveImage(filename);
            setShowImageModal(true);
            }}
            style={{
                cursor: 'pointer',
                color: 'blue',
                textDecoration: 'underline',
            }}
            >
            {fileUrl.split('/').pop()}
            </li>

                ))}
            </ul>
            </div>
            )}

            {report.investigatorDecision && report.analysis && (
                <button
                className="view-button"
                onClick={() => setSelectedReport(report)}
                >
                View Analysis
                </button>
            )}
            </div>

              ))}
          </div>
        </div>

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ReporterDashboard;
