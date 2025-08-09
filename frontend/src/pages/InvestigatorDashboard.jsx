import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import '../styles/InvestigatorDashboard.css';
import InvestigatorNavbar from '../components/InvestigatorNavbar';
import PendingReports from '../components/PendingReports';
import ReviewedReports from '../components/ReviewedReports';
import ScrapingInfoViewer from '../components/ScrapingInfoViewer';
import Notification from "../components/Notification";

const InvestigatorDashboard = ({ view }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showWhois, setShowWhois] = useState(false);
  const [showDns, setShowDns] = useState(false);
  const [showScraping, setShowScraping] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [notification, setNotification] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    action: null,
    message: ""
  });

  const showNotification = (type, message) => {
    setNotification(prev => prev ? prev : { type, message });
  };

  const fetchReports = async () => {
    try {
      const res = await API.get('/reports');
      setReports(res.data);
    } catch (err) {
      showNotification("error", "Failed to fetch reports. Please try again.");
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = 'B.R.A.D | Investigator';
  }, []);

  const handleDecision = async (id, verdict) => {
    setConfirmModal({ visible: false, action: null, message: "" });
    setSelectedReport(null);

    try {
      await API.patch(`/report/${id}/decision`, { verdict });
      fetchReports();
      showNotification("success", `Report marked as "${verdict}".`);
    } catch (err) {
      showNotification("error", "Error submitting decision. Please retry.");
    }
  };

  return (
    <div className="investigator-dashboard">
      <InvestigatorNavbar />
      <div className="dashboard-main">
        {view === 'pending' && <PendingReports reports={reports} onSelect={setSelectedReport} />}
        {view === 'reviewed' && <ReviewedReports reports={reports} onSelect={setSelectedReport} />}

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Report Modal */}
        {selectedReport && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Analysis for {selectedReport.domain}</h3>

              {selectedReport?.evidence?.length > 0 && (
                <div className="evidence-preview">
                  <h4>Submitted Evidence</h4>
                  {selectedReport.evidence.map((filename, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setActiveImage(filename);
                        setShowImageModal(true);
                      }}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}
                    >
                      <span role="img" aria-label="image">🖼️</span>
                      <span style={{ color: 'black' }}>{filename}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedReport.analysis ? (
                <div className="analysis-details">
                  <div className="analysis-cards">
                    <div className="analysis-card">
                      🕒 <span className="card-label">Scanned At:</span>
                      <span className="card-value">{new Date(selectedReport.analysis.scannedAt).toLocaleString()}</span>
                    </div>
                    <div className="analysis-card risk">
                      🚨 <span className="card-label">Risk Score:</span>
                      <span className="card-value">{selectedReport.analysis.riskScore}</span>
                    </div>
                    <div className="analysis-card">
                      🦠 <span className="card-label">Malware Detected:</span>
                      <span className="card-value">{selectedReport.analysis.malwareDetected ? "Yes" : "No"}</span>
                    </div>
                    <div className="analysis-card">
                      🌐 <span className="card-label">IP Address:</span>
                      <span className="card-value">{selectedReport.analysis.ip}</span>
                    </div>
                    <div className="analysis-card">
                      🏢 <span className="card-label">Registrar:</span>
                      <span className="card-value">{selectedReport.analysis.registrar}</span>
                    </div>
                    <div className="analysis-card">
                      🔒 <span className="card-label">SSL Valid:</span>
                      <span className="card-value">{selectedReport.analysis.sslValid ? "Yes" : "No"}</span>
                    </div>
                    <div className="analysis-card">
                      👤 <span className="card-label">WHOIS Owner:</span>
                      <span className="card-value">{selectedReport.analysis.whoisOwner}</span>
                    </div>
                  </div>

                  <p className="analysis-summary"><strong>📝 Summary:</strong> {selectedReport.analysis.summary}</p>

                  {selectedReport.analysis.whoisRaw && (
                    <div className="whois-section">
                      <button className="toggle-button" onClick={() => setShowWhois(prev => !prev)}>
                        {showWhois ? '📄 Hide WHOIS Raw Data ▲' : '📄 Show WHOIS Raw Data ▼'}
                      </button>
                      {showWhois && (
                        <div className="whois-table-wrapper">
                          <table className="whois-table">
                            <tbody>
                              {Object.entries(selectedReport.analysis.whoisRaw).map(([key, value]) => (
                                <tr key={key}>
                                  <td><strong>{key}</strong></td>
                                  <td>{Array.isArray(value) ? value.join(', ') : String(value)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedReport.analysis?.dns && (
                    <div className="dns-section">
                      <button className="toggle-button" onClick={() => setShowDns(prev => !prev)}>
                        {showDns ? '🌍 Hide DNS Records ▲' : '🌍 Show DNS Records ▼'}
                      </button>
                      {showDns && (
                        <div className="dns-table-wrapper">
                          <h4>DNS Records</h4>
                          <table className="dns-table">
                            <tbody>
                              {Object.entries(selectedReport.analysis.dns).map(([recordType, values]) =>
                                Array.isArray(values)
                                  ? values.map((val, idx) => (
                                      <tr key={`${recordType}-${idx}`}>
                                        <td>{recordType}</td>
                                        <td>{val}</td>
                                      </tr>
                                    ))
                                  : (
                                      <tr key={recordType}>
                                        <td>{recordType}</td>
                                        <td>{String(values)}</td>
                                      </tr>
                                    )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  <ScrapingInfoViewer
                    scrapingInfo={selectedReport.scrapingInfo}
                    showScraping={showScraping}
                    setShowScraping={setShowScraping}
                  />
                </div>
              ) : (
                <p>No analysis available.</p>
              )}

              {!selectedReport.investigatorDecision && (
                <div className="modal-buttons">
                  <button
                    className="malicious"
                    onClick={() =>
                      setConfirmModal({
                        visible: true,
                        message: `Are you sure you want to mark this report as MALICIOUS?`,
                        action: () => handleDecision(selectedReport._id, 'malicious')
                      })
                    }
                  >
                    Mark as Malicious
                  </button>
                  <button
                    className="benign"
                    onClick={() =>
                      setConfirmModal({
                        visible: true,
                        message: `Are you sure you want to mark this report as SAFE?`,
                        action: () => handleDecision(selectedReport._id, 'benign')
                      })
                    }
                  >
                    Mark as Safe
                  </button>
                </div>
              )}

              <button className="close-button" onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {showImageModal && activeImage && (
          <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h4>Evidence Preview: {activeImage}</h4>
              <img
                src={`http://localhost:3000/static/uploads/evidence/${activeImage}`}
                alt="Evidence Full"
                style={{ maxWidth: '80%', maxHeight: '80vh', borderRadius: '5px' }}
              />
              <button className="close-button" onClick={() => setShowImageModal(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Confirmation Modal — always on top */}
        {confirmModal.visible && (
          <div className="modal-overlay confirmation-modal">
            <div className="modal-content">
              <h3>Confirm Action</h3>
              <p>{confirmModal.message}</p>
              <div className="modal-buttons">
                <button className="benign" onClick={confirmModal.action}>Yes</button>
                <button className="malicious" onClick={() => setConfirmModal({ visible: false, action: null, message: "" })}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigatorDashboard;
