import React from 'react';
import { FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';

const ReviewedReports = ({ reports, onSelect }) => {
  const reviewed = reports.filter(r => r.investigatorDecision);

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Reviewed Reports</h3>
      <div className="report-grid">
        {reviewed.length === 0 && <p>No reviewed reports yet.</p>}
        {reviewed.map(report => (
          <div className="report-card-grid reviewed" key={report._id}>
            <p className="report-domain">{report.domain}</p>
            <p className="report-submitter">
              Submitted by: {report.submittedBy?.username || 'Unknown'}
            </p>
            <p className="report-reviewer">
              Reviewed by: {report.reviewedBy?.username || 'Unknown'}
            </p>
            <p className="report-date">
              <FaCalendarAlt style={{ marginRight: '6px', color: '#fff' }} />
              {new Date(report.createdAt).toLocaleString()}
            </p>
            <p className="report-risk">
              <FaExclamationTriangle style={{ marginRight: '6px' }} />
              {report.analysis?.riskScore ?? 'N/A'}
            </p>
            <p className="report-verdict">Verdict: {report.investigatorDecision}</p>
            <button className="view-button" onClick={() => onSelect(report)}>View Analysis</button>
          </div>
        ))}
      </div>
    </div>
  );
  
};

export default ReviewedReports;
