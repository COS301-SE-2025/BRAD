import React, { useEffect, useState } from 'react';
import ReporterNavbar from '../components/ReporterNavbar';
import '../styles/ReporterDashboard.css';
import Notification from '../components/Notification';
import API from '../api/axios';

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

const ReporterDashboard = () => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('');
  const [notification, setNotification] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')) || { username: 'Reporter' };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const fetchReports = async () => {
    try {
      const res = await API.get('/reports', { params: { submittedBy: user._id } });
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching report history:', err);
      showNotification('error', 'Failed to fetch report history.');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) =>
    filter === ''
      ? true
      : filter === 'Resolved'
      ? r.investigatorDecision
      : !r.investigatorDecision
  );

  const pendingCount = reports.filter(r => !r.investigatorDecision).length;
  const resolvedCount = reports.filter(r => r.investigatorDecision).length;

  const pieOptions = {
    plugins: {
      legend: {
        labels: {
          color: 'white', 
          font: {
            size: 14,
          },
        },
      },
    },
  };

  const pieData = {
    labels: ['Pending', 'Resolved'],
    datasets: [
      {
        label: 'Report Status',
        data: [pendingCount, resolvedCount],
        backgroundColor: ['#f97316', '#22c55e'],
        hoverOffset: 20,
      },
    ],
  };

  return (
    <div className="reporter-dashboard">
      <ReporterNavbar />

      <div className="dashboard-main">
        {/* Greeting & Settings */}
        <div className="dashboard-header">
          <h2 className="dashboard-greeting">Hello, {user.username} 👋</h2>
          <button className="settings-btn" onClick={() => (window.location.href = '/settings')}>
            ⚙️ User Settings
          </button>
        </div>

        {/* History Section */}
        {reports.length === 0 ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2rem',
              borderRadius: '10px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <p>No report history.</p>
            <button
              onClick={() => (window.location.href = '/report')}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Click here to submit your first report
            </button>
          </div>
        ) : (
          <div
            className="history-section"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 320px',
              gap: '1.5rem',
            }}
          >
            {/* Header spanning both columns */}
            <div
              className="history-header"
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ margin: 0 }}>Report History</h2>
              <select
                className="filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">Filter by status</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Left: Report Cards Grid */}
            <div
              className="report-list"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {filteredReports.map((report) => (
                <div
                  className={`report-card ${
                    report.investigatorDecision ? 'resolved-card' : 'pending-card'
                  }`}
                  key={report._id}
                >
                  <p>
                    <strong>{report.domain}</strong>
                  </p>
                  <p className="date-submitted">
                    <span className="calendar-icon">📅</span>
                    Date Submitted: {new Date(report.createdAt).toLocaleString()}
                  </p>
                  <p>
                    Status:{' '}
                    <span
                      className={`status-tag ${
                        report.investigatorDecision ? 'resolved' : 'pending'
                      }`}
                    >
                      {report.investigatorDecision ? 'Resolved' : 'Pending'}
                    </span>
                  </p>

                  {report.investigatorDecision && report.analysis && (
                    <button className="view-button" onClick={() => setSelectedReport(report)}>
                      View Analysis
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Right: Pie Chart */}
            <div className="history-chart" style={{ alignSelf: 'start' }}>
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>
        )}

        {/* Notifications */}
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Analysis Modal */}
        {selectedReport && (
          <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
            <div className="modal-content analysis-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Analysis for {selectedReport.domain}</h3>
              <div className="analysis-field">
                <span className="analysis-label">Status:</span>
                <span
                  className={`analysis-value ${
                    selectedReport.investigatorDecision ? 'resolved' : 'pending'
                  }`}
                >
                  {selectedReport.investigatorDecision ? 'Resolved' : 'Pending'}
                </span>
              </div>
              <div className="analysis-field">
                <span className="analysis-label">Verdict:</span>
                <span className="analysis-value">
                  {selectedReport.investigatorDecision || 'N/A'}
                </span>
              </div>
              {selectedReport.analysis && (
                <>
                  <div className="analysis-field">
                    <span className="analysis-label">Risk Score:</span>
                    <span className="analysis-value">{selectedReport.analysis.riskScore}</span>
                  </div>
                  <div className="analysis-field">
                    <span className="analysis-label">Summary:</span>
                    <span className="analysis-value">{selectedReport.analysis.summary}</span>
                  </div>
                </>
              )}

              {/* Evidence displayed here */}
              {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                <div className="evidence-names" style={{ marginTop: '1rem' }}>
                  <p>
                    <strong>Evidence:</strong>
                  </p>
                  <ul>
                    {selectedReport.evidence.map((fileUrl, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          const filename = fileUrl.split('/').pop();
                          setActiveImage(filename);
                          setShowImageModal(true);
                        }}
                        style={{ cursor: 'pointer', color: '#90e0ef', textDecoration: 'underline' }}
                      >
                        {fileUrl.split('/').pop()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        )}

        {/* Evidence Image Modal */}
        {showImageModal && activeImage && (
          <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Evidence Preview: {activeImage}</h3>
              <img
                // src={`http://localhost:3000/static/uploads/evidence/${activeImage}`}
                src={`/api/static/uploads/evidence/${activeImage}`}
                alt="Evidence"
                style={{ maxWidth: '80%', maxHeight: '80vh', borderRadius: '5px' }}
              />
              <button onClick={() => setShowImageModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReporterDashboard;
