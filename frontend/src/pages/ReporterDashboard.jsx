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
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [activeImage, setActiveImage] = useState(null);
const [showImageModal, setShowImageModal] = useState(false);

  const MAX_FILES = 5;

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const combined = [...evidenceFiles, ...newFiles];
    if (combined.length > MAX_FILES) {
      alert('You can only attach up to 5 files.');
      setEvidenceFiles(combined.slice(0, MAX_FILES));
    } else {
      setEvidenceFiles(combined);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const combined = [...evidenceFiles, ...droppedFiles];
    if (combined.length > MAX_FILES) {
      alert('You can only attach up to 5 files.');
      setEvidenceFiles(combined.slice(0, MAX_FILES));
    } else {
      setEvidenceFiles(combined);
    }
  };

  const handleRemoveFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitReport = async () => {
    if (!domain) return alert('Please enter a domain/URL');

    const formData = new FormData();
    formData.append('domain', domain);
    formData.append('submittedBy', user._id);

    evidenceFiles.forEach((file) => {
      formData.append('evidence', file);
    });

    try {
      await API.post('/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDomain('');
      setEvidenceFiles([]);
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
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = 'B.R.A.D | Reporter';
  }, []);

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <div className="submit-section">
          <h2>Submit Suspicious URL</h2>
          <div className="url-input-group">
            <input
              type="text"
              placeholder="Enter URL"
              className="url-input"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <button className="submit-url-button" onClick={submitReport}>
              Submit
            </button>
          </div>

          <div
            className="evidence-upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <p>Attach Optional Evidence</p>
            <div className="drop-area">
              <p>Drag & Drop files here or </p>
              <label htmlFor="file-upload" className="custom-file-button">
                Choose Files
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="file-input"
              />
            </div>

            {evidenceFiles.length > 0 && (
              <ul className="file-list">
                {evidenceFiles.map((file, index) => (
                  <li key={index} className="file-list-item">
                    {file.name}
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="remove-file-button"
                      style={{
                        marginLeft: '10px',
                        color: 'red',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                        fontWeight: 'bold',
                      }}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

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

    {selectedReport && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Report for {selectedReport.domain}</h3>
      <p><strong>Submitted:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
      <p><strong>Status:</strong> {selectedReport.investigatorDecision ? 'Resolved' : 'Pending'}</p>
      <p><strong>Verdict:</strong> {selectedReport.investigatorDecision ?? 'Not decided'}</p>
      <p><strong>Risk Score:</strong> {selectedReport.analysis?.riskScore ?? 'N/A'}</p>

      {selectedReport.evidence && selectedReport.evidence.length > 0 && (
        <>
          <p><strong>Attached Evidence:</strong></p>
          <div className="evidence-preview">
            {selectedReport.evidence.map((fileUrl, idx) => (
              <img
                key={idx}
                src={fileUrl}
                alt={`evidence-${idx}`}
                className="evidence-thumbnail"
                style={{
                  maxWidth: '150px',
                  maxHeight: '150px',
                  marginRight: '10px',
                  marginBottom: '10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  objectFit: 'cover',
                }}
              />
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => setSelectedReport(null)}
        style={{ marginTop: '20px' }}
      >
        Close
      </button>
    </div>
  </div>
)}

{showImageModal && activeImage && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Image Preview</h3>
      <img
        src={`http://localhost:3000/static/uploads/evidence/${activeImage}`}
        alt="Evidence"
        style={{
          maxWidth: '100%',
          maxHeight: '80vh',
          borderRadius: '10px',
          marginBottom: '10px',
        }}
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
