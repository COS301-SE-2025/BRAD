import React, { useState } from 'react';
import { FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import API from '../api/axios';

const PendingReports = ({ reports, onSelect, setReports }) => {
  const [loadingClaimId, setLoadingClaimId] = useState(null);

  const pending = reports.filter(r => !r.investigator && !r.investigatorDecision && r.analysisStatus === 'pending');

 const handleViewReport = (report) => {
  onSelect(report); // ✅ just open the report modal
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
>
  View Report
</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingReports;
