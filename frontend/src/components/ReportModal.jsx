import React, { useState } from "react";
import ScrapingInfoViewer from "./ScrapingInfoViewer";
import {
  Globe, Building, User, Lock, Calendar, RefreshCcw,
  BarChart, FileText, Server, Shield,
} from "lucide-react";
import API from '../api/axios';
import "../styles/ReportModal.css";

const ReportModal = ({ report, onClose, loggedInUser, view, handleDecision, refreshReports }) => {
  const [showWhois, setShowWhois] = useState(false);
  const [showDns, setShowDns] = useState(false);
  const [showRisk, setShowRisk] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const analysis = report.analysis || {};

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const res = await API.post(`/reports/${report._id}/claim`, { investigatorId: loggedInUser._id });
      Object.assign(report, res.data); // update local report
      alert("Report successfully claimed!");
      if (refreshReports) refreshReports();
    } catch (err) {
      console.error("Claim failed:", err);
      alert("Failed to claim report. Try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  const getDisplayStatus = (report) => {
  if (!report.investigatorDecision && !report.reviewedBy) {
    return "Pending";
  } else if (!report.investigatorDecision && report.reviewedBy) {
    return "In Progress";
  } else if (report.investigatorDecision) {
    return "Resolved";
  } else {
    return "Unknown";
  }
};

  const getStatusDetails = (report) => {
    if (!report.investigatorDecision && !report.reviewedBy) {
      return [
        "• investigatorDecision = null",
        "• Reviewedby = null"
      ];
    } else if (!report.investigatorDecision && report.reviewedBy) {
      return [
        "• investigatorDecision = null",
        `• Reviewedby = ${report.reviewedBy.username || "not null"}`
      ];
    } else if (report.investigatorDecision) {
      return [
        `• investigatorDecision = ${report.investigatorDecision}`,
        `• Reviewedby = ${report.reviewedBy?.username || "not null"}`
      ];
    }
    return [];
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal">

        {/* Modal Header */}
        <header className="report-modal-header">
          <h2>Investigation Report</h2>
          <div className="header-buttons">
            {view === "pending" && report.status !== "in-progress" && (
              <button className="claim-btn" disabled={isClaiming} onClick={handleClaim}>
                {isClaiming ? "Claiming..." : "Claim Report"}
              </button>
            )}
            <button className="close-button" onClick={onClose}>✖</button>
          </div>
        </header>

        {/* Heading Section */}
        <div className="heading-section">
          {[
            { label: "Domain", value: report.domain },
            { label: "Status", value: getDisplayStatus(report) },
            { label: "Investigator", value: report.reviewedBy?.username || "Unassigned" },
          ].map(({ label, value }, idx) => (
            <div className="heading-card" key={idx}>
              <h4>{label}</h4>
              <p>{value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="report-main-grid">

          {/* Left Column - Forensic Analysis */}
          <div className="report-column forensic-column">
            {!analysis || Object.keys(analysis).length === 0 ? (
              <p className="no-analysis">No forensic analysis available.</p>
            ) : (
              <div className="forensic-block">
                <h3 className="section-title">
                  <Shield size={18} /> Forensic Analysis
                </h3>

                {/* Summary Cards */}
                <div className="summary-cards">
                  {[
                    { icon: <Globe size={18} />, label: "IP Address", value: analysis.ip },
                    { icon: <Building size={18} />, label: "Registrar", value: analysis.registrar },
                    { icon: <User size={18} />, label: "WHOIS Owner", value: analysis.whoisOwner },
                    { icon: <Lock size={18} />, label: "SSL Valid", value: analysis.sslValid ? "Yes" : "No" },
                    { icon: <Calendar size={18} />, label: "SSL Expiry", value: analysis.sslExpires },
                    { icon: <RefreshCcw size={18} />, label: "Reverse IP", value: analysis.reverseIp },
                  ].map(({ icon, label, value }, idx) => (
                    <div className="summary-card" key={idx}>
                      {icon}
                      <span className="label">{label}</span>
                      <span className="value">{value || "N/A"}</span>
                    </div>
                  ))}
                </div>

                {/* Hosting Info */}
                {analysis.geo && (
                  <div className="info-section">
                    <h4><Globe size={18} /> Hosting Info</h4>
                    <p><strong>Country:</strong> {analysis.geo.country || "N/A"}</p>
                    <p><strong>ASN / Org:</strong> {analysis.geo.asn || "N/A"}</p>
                  </div>
                )}

                {/* Stats */}
                {analysis.stats && (
                  <div className="info-section">
                    <h4><BarChart size={18} /> Domain & Security Stats</h4>
                    <div className="stats-grid">
                      <p><strong>Domain Age:</strong> {analysis.stats.domain_age_days} days</p>
                      <p><strong>SSL Days Left:</strong> {analysis.stats.ssl_days_remaining}</p>
                    </div>
                  </div>
                )}

                {/* Risk Section */}
                <div className="toggle-section">
                  <button className="toggle-button" onClick={() => setShowRisk(prev => !prev)}>
                    <Shield size={16} />{showRisk ? " Hide Risk Analysis ▲" : " Show Risk Analysis ▼"}
                  </button>
                  {showRisk && (
                    <div className="risk-content">
                      <p>
                        <strong>Risk Level:</strong>
                        <span className={`risk-badge ${analysis.riskLevel?.toLowerCase() || ""}`}>
                          {analysis.riskLevel || "N/A"}
                        </span>
                      </p>
                      <p><strong>Risk Score:</strong> {analysis.riskScore || "N/A"}</p>
                      {analysis.riskReasons && (
                        <div className="risk-breakdown">
                          <h5>Risk Breakdown</h5>
                          <ul>
                            {Object.entries(analysis.riskReasons).map(([key, reason]) => (
                              <li key={key}>• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Scraping Info + WHOIS/DNS */}
          <div className="report-column scraping-column">
            <ScrapingInfoViewer scrapingInfo={report.scrapingInfo} />

            {/* WHOIS Toggle */}
            {analysis.whoisRaw && (
              <div className="toggle-section">
                <button className={`scraping-toggle-btn ${showWhois ? "active" : ""}`} onClick={() => setShowWhois(prev => !prev)}>
                  <FileText size={16} />{showWhois ? " Hide WHOIS Raw ▲" : " Show WHOIS Raw ▼"}
                </button>
                {showWhois && (
                  <div className="table-wrapper whois-table-wrapper">
                    <table className="styled-table">
                      <tbody>
                        {Object.entries(analysis.whoisRaw).map(([key, value]) => (
                          <tr key={key}>
                            <td><strong>{key}</strong></td>
                            <td>{Array.isArray(value) ? value.join(", ") : String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* DNS Toggle */}
            {analysis.dns && (
              <div className="toggle-section">
                <button className={`scraping-toggle-btn ${showDns ? "active" : ""}`} onClick={() => setShowDns(prev => !prev)}>
                  <Server size={16} />{showDns ? " Hide DNS Records ▲" : " Show DNS Records ▼"}
                </button>
                {showDns && (
                  <div className="table-wrapper dns-table-wrapper">
                    <table className="styled-table">
                      <thead>
                        <tr><th>Type</th><th>Value</th></tr>
                      </thead>
                      <tbody>
                        {Object.entries(analysis.dns).flatMap(([type, entries]) =>
                          Array.isArray(entries)
                            ? entries.map((val, i) => (<tr key={`${type}-${i}`}><td>{type}</td><td>{val}</td></tr>))
                            : (<tr key={type}><td>{type}</td><td>{String(entries)}</td></tr>)
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Decision Buttons for In-Progress Reports */}
        {view === "in_progress" && !report.investigatorDecision && (
          <section className="decision-section">
            <button className="decision-btn malicious" disabled={report.reviewedBy?._id !== loggedInUser?._id} onClick={() => handleDecision(report._id, "malicious")}>
              Mark as Malicious
            </button>
            <button className="decision-btn benign" disabled={report.reviewedBy?._id !== loggedInUser?._id} onClick={() => handleDecision(report._id, "benign")}>
              Mark as Safe
            </button>
          </section>
        )}

      </div>
    </div>
  );
};

export default ReportModal;
