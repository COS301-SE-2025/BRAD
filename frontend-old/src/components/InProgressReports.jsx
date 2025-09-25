import React, { useMemo, useState } from 'react';
import { FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';

const InProgressReports = ({ reports, onSelect, setReports }) => {
  const [loadingClaimId, setLoadingClaimId] = useState(null);

  // Adjust 'in-progress' vs 'in_progress' if your backend uses the other form
  const inProgress = useMemo(
    () => reports.filter(r => r.reviewedBy && !r.investigatorDecision && r.analysisStatus === 'in-progress'),
    [reports]
  );

  const handleViewReport = (report) => {
    onSelect(report); // open the report modal
  };

  // Map average (0–100) to a level
  const toLevel = (avg) => (avg >= 70 ? "High" : avg >= 40 ? "Medium" : "Low");

  // Pull scores safely; show SUM, classify by AVG
  const getScores = (r) => {
    const forensic = Number(r?.analysis?.riskScore);
    const site = Number(r?.scrapingInfo?.summary?.siteRiskScore);
    const parts = [forensic, site].filter(Number.isFinite);

    if (!parts.length) {
      const fallbackLevel = r?.analysis?.riskLevel || r?.scrapingInfo?.summary?.siteRiskLevel || null;
      return { forensic, site, combined: null, avg: null, level: fallbackLevel };
    }

    const combined = parts.reduce((a, b) => a + b, 0); // sum (0–200)
    const avg = combined / parts.length;               // avg (0–100)
    const level = toLevel(combined);
    return { forensic, site, combined, avg, level };
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: '#fff' }}>In Progress Reports</h3>
      <div className="report-grid">
        {inProgress.length === 0 && <p>No in-progress reports.</p>}

        {inProgress.map(report => {
          const { combined, avg, level } = getScores(report);
          const riskClass = level ? level.toLowerCase() : '';
          const isHighCard = level === 'High';

          return (
            <div
              className={`report-card-grid ${isHighCard ? 'high-risk' : ''}`}
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
                {level ? (
                  <>
                    {combined !== null ? ` (${Math.round(combined)})` : null}
                    <span className={`risk-badge ${riskClass}`}>{level}</span>
                  </>
                ) : (
                  "N/A"
                )}
              </p>

              <button
                className="view-button"
                onClick={() => handleViewReport(report)}
              >
                View Analysis
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InProgressReports;
