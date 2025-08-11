import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import InvestigatorNavbar from '../components/InvestigatorNavbar';
import PendingReports from '../components/PendingReports';
import ReviewedReports from '../components/ReviewedReports';
import ScrapingInfoViewer from '../components/ScrapingInfoViewer';
import Notification from "../components/Notification";
import ForensicReportBlock from '../components/ForensicReportBlock'; // ✅ imported here
import '../styles/InvestigatorDashboard.css';

const InvestigatorDashboard = ({ view }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
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

              {/* Evidence Preview */}
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
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 0'
                      }}
                    >
                      <span role="img" aria-label="image">🖼️</span>
                      <span style={{ color: 'black' }}>{filename}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedReport.analysis ? (
                <>
                  {/* ✅ Replaced giant inline block with reusable component */}
                  <ForensicReportBlock analysis={selectedReport.analysis} />

                  <ScrapingInfoViewer
                    scrapingInfo={selectedReport.scrapingInfo}
                    showScraping={showScraping}
                    setShowScraping={setShowScraping}
                  />
                </>
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

        {/* Confirmation Modal */}
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
