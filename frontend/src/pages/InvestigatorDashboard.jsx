import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import InvestigatorNavbar from '../components/InvestigatorNavbar';
import PendingReports from '../components/PendingReports';
import ReviewedReports from '../components/ReviewedReports';
import InProgressReports from '../components/InProgressReports';
import Notification from "../components/Notification";
import ReportModal from '../components/ReportModal'; 
import '../styles/InvestigatorDashboard.css';

const InvestigatorDashboard = ({ view }) => {
  const loggedInUser = JSON.parse(localStorage.getItem('user'));

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    action: null,
    message: ""
  });

  const showNotification = (type, message) => {
    setNotification(prev => prev ? prev : { type, message });
  };

  const handleCloseReport = () => setSelectedReport(null);

  const handleClaimReport = async () => {
    if (!selectedReport) return;
    try {
      const res = await API.post(`/reports/${selectedReport._id}/claim`);
      const updatedReport = res.data;
      setReports(prevReports =>
        prevReports.map(r => r._id === updatedReport._id ? updatedReport : r)
      );
      setSelectedReport(updatedReport);
      showNotification("success", "Report successfully claimed.");
    } catch (error) {
      console.error("Claim error:", error);
      showNotification("error", error.response?.data?.message || "Failed to claim report.");
    }
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
        {view === 'pending' && <PendingReports reports={reports} setReports={setReports} onSelect={setSelectedReport} />}
        {view === 'reviewed' && <ReviewedReports reports={reports} onSelect={setSelectedReport} />}
        {view === 'in_progress' && <InProgressReports reports={reports} onSelect={setSelectedReport} setReports={setReports} />}

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Report Modal */}
        {selectedReport && (
          <ReportModal
            report={selectedReport}
            onClose={handleCloseReport}
            loggedInUser={loggedInUser}
            view={view}
            handleDecision={handleDecision}
          />
        )}

        {/* {showImageModal && activeImage && (
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
        )} */}

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
