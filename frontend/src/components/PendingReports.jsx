import React from 'react';

const PendingReports = ({ reports, onSelect }) => {
  const pending = reports.filter(r => r.analyzed && !r.investigatorDecision);

  return (
    <div className="report-column">
      <h3>Pending Reports</h3>
      {pending.length === 0 && <p>No pending reports.</p>}
      {pending.map(report => (
        <div
          className={`report-card ${report.analysis?.riskScore > 80 ? 'high-risk' : ''}`}
          key={report._id}
        >
          <p><strong>{report.domain}</strong></p>
          <p>Date: {new Date(report.createdAt).toLocaleString()}</p>
          <p>Risk Score: {report.analysis?.riskScore ?? 'N/A'}</p>
          <button className="view-button" onClick={() => onSelect(report)}>View Report</button>
        </div>
      ))}
    </div>
  );
};

export default PendingReports;
