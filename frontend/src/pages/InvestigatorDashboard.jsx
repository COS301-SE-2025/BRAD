import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import '../styles/InvestigatorDashboard.css';
import InvestigatorNavbar from '../components/InvestigatorNavbar';
import ScrapingInfoViewer from '../components/ScrapingInfoViewer';

const InvestigatorDashboard = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showWhois, setShowWhois] = useState(false);
  const [showDns, setShowDns] = useState(false);
  const [showScraping, setShowScraping] = useState(false);


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

          {/* Completed */}
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

              {selectedReport.analysis ? (
                <div className="analysis-details">
                  <p><strong>Scanned At:</strong> {new Date(selectedReport.analysis.scannedAt).toLocaleString()}</p>
                  <p><strong>Risk Score:</strong> {selectedReport.analysis.riskScore}</p>
                  <p><strong>Malware Detected:</strong> {selectedReport.analysis.malwareDetected ? "Yes" : "No"}</p>
                  <p><strong>IP Address:</strong> {selectedReport.analysis.ip}</p>
                  <p><strong>Registrar:</strong> {selectedReport.analysis.registrar}</p>
                  <p><strong>SSL Valid:</strong> {selectedReport.analysis.sslValid ? "Yes" : "No"}</p>
                  <p><strong>WHOIS Owner:</strong> {selectedReport.analysis.whoisOwner}</p>
                  <p><strong>Summary:</strong> {selectedReport.analysis.summary}</p>

                  {selectedReport.analysis.whoisRaw && (
                    <div className="whois-section">
                      <button className="toggle-button" onClick={() => setShowWhois(prev => !prev)}>
                        {showWhois ? 'Hide WHOIS Raw Data ▲' : 'Show WHOIS Raw Data ▼'}
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
                        {showDns ? 'Hide DNS Records ▲' : 'Show DNS Records ▼'}
                      </button>

                      {showDns && (
                        <div className="dns-table-wrapper">
                          <h4>DNS Records</h4>
                          <table className="dns-table">
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(selectedReport.analysis.dns).flatMap(([recordType, values]) =>
                                Array.isArray(values)
                                  ? values.map((val, idx) => (
                                      <tr key={`${recordType}-${idx}`}>
                                        <td>{recordType}</td>
                                        <td>{val}</td>
                                      </tr>
                                    ))
                                  : [
                                      <tr key={recordType}>
                                        <td>{recordType}</td>
                                        <td>{String(values)}</td>
                                      </tr>
                                    ]
                              )}

                              {/* Reverse IP Info */}
                              {selectedReport.analysis.reverseIp && (
                                <>
                                  <tr>
                                    <th colSpan={2} style={{ textAlign: 'left' }}>Reverse IP</th>
                                  </tr>
                                  {Array.isArray(selectedReport.analysis.reverseIp)
                                    ? selectedReport.analysis.reverseIp.map((domain, idx) => (
                                        <tr key={`reverse-${idx}`}>
                                          <td>Domain</td>
                                          <td>{domain}</td>
                                        </tr>
                                      ))
                                    : (
                                      <tr>
                                        <td>Domain</td>
                                        <td>{selectedReport.analysis.reverseIp}</td>
                                      </tr>
                                    )}
                                </>
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
      </div>
    </div>
  );
};

export default InvestigatorDashboard;
