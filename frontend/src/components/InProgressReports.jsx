import React, { useState } from 'react';
import { FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import API from '../api/axios';

const InProgressReports = ({ reports, onSelect, setReports }) => {
  const [loadingClaimId, setLoadingClaimId] = useState(null);

  const inProgress = reports.filter(r => r.reviewedBy && !r.investigatorDecision && r.analysisStatus === 'in-progress');

 const handleViewReport = (report) => {
  onSelect(report); // ✅ just open the report modal
};


  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: '#fff' }}>In Progress Reports</h3>
      <div className="report-grid">
        {inProgress.length === 0 && <p>No in-progress reports.</p>}
        {inProgress.map(report => (
          <div
            className={`report-card-grid ${report.analysis?.riskScore > 80 ? 'high-risk' : ''}`}
            key={report._id}
          >
            <p className="report-domain">{report.domain}</p>
            <p className="report-submitter">
              Submitted by: {report.submittedBy?.username || 'Unknown'}
            </p>
            <p className="report-reviewer">
              Claimed by: {report.reviewedBy?.username || 'Unknown'}
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

export default InProgressReports;
