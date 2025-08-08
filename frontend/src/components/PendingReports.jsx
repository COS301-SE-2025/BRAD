import React from 'react';
import { FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';

const PendingReports = ({ reports, onSelect }) => {
  const pending = reports.filter(r => !r.investigator && !r.investigatorDecision);

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
            <p className="report-date">
              <FaCalendarAlt style={{ marginRight: '6px', color: '#fff' }} />
              {new Date(report.createdAt).toLocaleString()}
            </p>
            <p className="report-risk">
              <FaExclamationTriangle style={{ marginRight: '6px' }} />
              {report.analysis?.riskScore ?? 'N/A'}
            </p>
            <button className="view-button" onClick={() => onSelect(report)}>View Report</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingReports;
