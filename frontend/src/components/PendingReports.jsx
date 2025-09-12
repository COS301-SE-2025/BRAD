import React, { useMemo } from "react";
import { FaCalendarAlt, FaExclamationTriangle } from "react-icons/fa";

const PendingReports = ({ reports = [], onSelect, setReports }) => {
  const pending = useMemo(
    () =>
      reports.filter(
        (r) => !r.investigator && !r.investigatorDecision && r.analysisStatus === "pending"
      ),
    [reports]
  );

  const handleViewReport = (report) => {
    onSelect(report); // open the report modal
  };

  // Map an average (0–100) to a level
  const toLevel = (avg) => (avg >= 70 ? "High" : avg >= 40 ? "Medium" : "Low");

  const getScores = (r) => {
    const forensic = Number(r?.analysis?.riskScore);
    const site = Number(r?.scrapingInfo?.summary?.siteRiskScore);
    const parts = [forensic, site].filter((n) => Number.isFinite(n));

    if (!parts.length) {
      // fallback if scores missing: try levels from payload
      const fallbackLevel =
        r?.analysis?.riskLevel || r?.scrapingInfo?.summary?.siteRiskLevel || null;
      return {
        forensic,
        site,
        combined: null,
        avg: null,
        level: fallbackLevel,
      };
    }

    const combined = parts.reduce((a, b) => a + b, 0); // <-- SUM of two scores
    const avg = combined / parts.length;               // keep level on 0–100 scale
    const level = toLevel(combined);

    return { forensic, site, combined, avg, level };
  };

  return (
    <div>
      <h3 style={{ marginBottom: "1rem", color: "#fff" }}>Pending Reports</h3>
      <div className="report-grid">
        {pending.length === 0 && <p>No pending reports.</p>}

        {pending.map((report) => {
          const { forensic, site, combined, avg, level } = getScores(report);
          const riskClass = level ? level.toLowerCase() : "";
          const isHigh = avg !== null && avg >= 70; // highlight based on average

          return (
            <div
              key={report._id}
              className={`report-card-grid ${isHigh ? "high-risk" : ""}`}
              onClick={() => onSelect(report)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(report);
              }}
            >
              <p className="report-domain">{report.domain}</p>

              <p className="report-submitter">
                Submitted by: {report.submittedBy?.username || "Unknown"}
              </p>

              <p className="report-date">
                <FaCalendarAlt style={{ marginRight: "6px", color: "#fff" }} />
                {new Date(report.createdAt).toLocaleString()}
              </p>

              <p
                className="report-risk"
                title={`Forensic: ${
                  Number.isFinite(forensic) ? Math.round(forensic) : "N/A"
                } | Site: ${Number.isFinite(site) ? Math.round(site) : "N/A"} | Combined: ${
                  combined !== null ? Math.round(combined) : "N/A"
                }`}
              >
                <FaExclamationTriangle style={{ marginRight: "6px" }} />
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

export default PendingReports;
