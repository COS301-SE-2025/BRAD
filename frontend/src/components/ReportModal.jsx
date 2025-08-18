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
      Object.assign(report, res.data);
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
    if (!report.investigatorDecision && !report.reviewedBy) return "Pending";
    if (!report.investigatorDecision && report.reviewedBy) return "In Progress";
    if (report.investigatorDecision) return "Resolved";
    return "Unknown";
  };

  const showFullDetails = view !== "pending"; // Hide extra info for pending reports

  return (
    <div className="report-modal-overlay">
      <div className="report-modal">

        {/* Modal Header */}
        <header className="report-modal-header">
          <h2>Investigation Report</h2>
          <div className="header-buttons">
            {view === "pending" && !report.investigatorDecision && (
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
              </div>
            )}
          </div>

          {/* Right Column - Only show if not pending */}
          {showFullDetails && (
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

              {/* Stats & Risk sections remain hidden for pending */}
            </div>
          )}

        </div>

        {/* Decision Buttons for In-Progress Reports */}
        {showFullDetails && view === "in_progress" && !report.investigatorDecision && (
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