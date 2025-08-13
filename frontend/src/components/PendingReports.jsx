import React, { useState } from 'react';
import { FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import API from '../api/axios';

const PendingReports = ({ reports, onSelect, setReports }) => {
  const [loadingClaimId, setLoadingClaimId] = useState(null);

  const pending = reports.filter(r => !r.investigator && !r.investigatorDecision);

  const handleViewReport = async (report) => {
    setLoadingClaimId(report._id);
    try {
      // Claim report in backend
      const res = await API.post(`/reports/${report._id}/claim`);
      const updatedReport = res.data;

      // ✅ Update local reports state instantly
      setReports(prev =>
        prev.map(r => r._id === updatedReport._id ? updatedReport : r)
      );

      // ✅ Open the claimed report modal
      onSelect(updatedReport);
    } catch (error) {
      alert('Failed to claim report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingClaimId(null);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Pending Reports</h3>
      <div className="report-grid">
        {pending.length === 0 && <p>No pending reports.</p>}
        {pending.map(report => (
          <div
            className={`report-card-grid ${report.analysis?.riskScore > 80 ? 'high-risk' : ''}`}
            key={report._id}
          >
            <p className="report-domain">{report.domain}</p>
            <p className="report-submitter">
              Submitted by: {report.submittedBy?.username || 'Unknown'}
            </p>
            <p className="report-date">
              <FaCalendarAlt style={{ marginRight: '6px', color: '#fff' }} />
              {new Date(report.createdAt).toLocaleString()}
            </p>
            <p className="report-risk">
              <FaExclamationTriangle style={{ marginRight: '6px' }} />
              {report.analysis?.riskScore ?? 'N/A'}
            </p>
            <button
              className="view-button"
              onClick={() => handleViewReport(report)}
              disabled={loadingClaimId === report._id}
            >
              {loadingClaimId === report._id ? 'Claiming...' : 'View Report'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingReports;
