import React from 'react';

const ReviewedReports = ({ reports, onSelect }) => {
  const reviewed = reports.filter(r => r.investigatorDecision);

  return (
    <div className="report-column">
      <h3>Reviewed Reports</h3>
      {reviewed.length === 0 && <p>No reviewed reports yet.</p>}
      {reviewed.map(report => (
        <div className="report-card reviewed" key={report._id}>
          <p><strong>{report.domain}</strong></p>
          <p>Date: {new Date(report.createdAt).toLocaleString()}</p>
          <p>Verdict: {report.investigatorDecision}</p>
          <button className="view-button" onClick={() => onSelect(report)}>View Analysis</button>
        </div>
      ))}
    </div>
  );
};

export default ReviewedReports;
