import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import InvestigatorNavbar from '../components/InvestigatorNavbar';
import ScrapingInfoViewer from '../components/ScrapingInfoViewer';
import ForensicReportBlock from '../components/ForensicReportBlock'
import '../styles/InvestigatorDashboard.css';

const InvestigatorDashboard = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showScraping, setShowScraping] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
const [activeImage, setActiveImage] = useState(null);


  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const res = await API.get('/reports');
      setReports(res.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const handleDecision = async (id, verdict) => {
    const confirm = window.confirm(`Are you sure you want to mark this report as ${verdict.toUpperCase()}?`);
    if (!confirm) return;

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

  useEffect(() => {
    document.title = 'B.R.A.D | Investigator';
  }, []);

  const pending = reports.filter(r => r.analyzed && !r.investigatorDecision);
  const completed = reports.filter(r => r.investigatorDecision);

  return (
    <div className="investigator-dashboard">
      <InvestigatorNavbar />
      <div className="dashboard-main">
        <h2 className="dashboard-heading">Welcome, Investigator</h2>

        <div className="dashboard-columns">
          {/* Pending */}
          <div className="report-column">
            <h3>Reports Awaiting Review</h3>
            {pending.length === 0 && <p>No pending reports.</p>}
            {pending.map(report => (
              <div className={`report-card ${report.analysis?.riskScore > 80 ? 'high-risk' : ''}`} key={report._id}>
                <p><strong>{report.domain}</strong></p>
                
                <p>Date: {new Date(report.createdAt).toLocaleString()}</p>
                <p>Risk Score: {report.analysis?.riskScore ?? 'N/A'}</p>
                <button className="view-button" onClick={() => setSelectedReport(report)}>View Report</button>

              </div>
            ))}
          </div>

          <div className="report-column">
            <h3>Reviewed Reports</h3>
            {completed.length === 0 && <p>No completed reports yet.</p>}
            {completed.map(report => (
              <div className="report-card reviewed" key={report._id}>
                <p><strong>{report.domain}</strong></p>
                <p>Date: {new Date(report.createdAt).toLocaleString()}</p>
                <p>Verdict: {report.investigatorDecision}</p>
                <button className="view-button" onClick={() => setSelectedReport(report)}>View Analysis</button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
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
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 0',
        }}
      >
        <span role="img" aria-label="image">🖼️</span>
        <span style={{ color: 'black', textDecoration: 'none' }}>{filename}</span>
      </div>
    ))}
  </div>
)}

              {selectedReport.analysis ? (
                <>
                  <ForensicReportBlock analysis={selectedReport.analysis} />

                  <div className="section-separator" />

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
                  <button className="malicious" onClick={() => handleDecision(selectedReport._id, 'malicious')}>
                    Mark as Malicious
                  </button>
                  <button className="benign" onClick={() => handleDecision(selectedReport._id, 'benign')}>
                    Mark as Safe
                  </button>
                </div>
              )}

              <button className="close-button" onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        )}

{showImageModal && activeImage && (
  <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h4>Evidence Preview: {activeImage}</h4>
      <img
        src={`http://localhost:3000/static/uploads/evidence/${activeImage}`}
        alt="Evidence Full"
        style={{ maxWidth: '80%', maxHeight: '80vh', borderRadius: '5px' }}
      />
      <button
        className="close-button"
        style={{ marginTop: '5px' }}
        onClick={() => setShowImageModal(false)}
      >
        Close
      </button>
    </div>
  </div>
)}



      </div>
    </div>
  );
};

export default InvestigatorDashboard;
