import React, { useState } from "react";
import {
  Globe,
  Building,
  User,
  Lock,
  Calendar,
  RefreshCcw,
  BarChart,
  FileText,
  Server,
  Shield,
} from "lucide-react";
import "../styles/ForensicReportBlock.css";

const ForensicReportBlock = ({ analysis = {} }) => {
  const [showWhois, setShowWhois] = useState(false);
  const [showDns, setShowDns] = useState(false);
  const [showRisk, setShowRisk] = useState(true);

  if (!analysis || Object.keys(analysis).length === 0) {
    return <p className="no-analysis">No forensic analysis available.</p>;
  }

  return (
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
          <div className="dns-stats">
            <h5>DNS Security</h5>
            <table className="styled-table small">
              <tbody>
                <tr><td>SPF</td><td>{analysis.stats.dns?.has_spf ? "Enabled" : "Missing"}</td></tr>
                <tr><td>DMARC</td><td>{analysis.stats.dns?.has_dmarc ? "Enabled" : "Missing"}</td></tr>
                <tr><td>MX Count</td><td>{analysis.stats.dns?.mx_count}</td></tr>
                <tr><td>NS Count</td><td>{analysis.stats.dns?.ns_count}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Risk Section */}
      <div className="toggle-section">
        <button className="toggle-button" onClick={() => setShowRisk(prev => !prev)}>
          <Shield size={16} />
          {showRisk ? " Hide Risk Analysis ▲" : " Show Risk Analysis ▼"}
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

      {/* WHOIS */}
      {analysis.whoisRaw && (
        <div className="toggle-section">
          <button className="toggle-button" onClick={() => setShowWhois(prev => !prev)}>
            <FileText size={16} />
            {showWhois ? " Hide WHOIS Raw ▲" : " Show WHOIS Raw ▼"}
          </button>
          {showWhois && (
            <div className="table-wrapper">
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

      {/* DNS */}
      {analysis.dns && (
        <div className="toggle-section">
          <button className="toggle-button" onClick={() => setShowDns(prev => !prev)}>
            <Server size={16} />
            {showDns ? " Hide DNS Records ▲" : " Show DNS Records ▼"}
          </button>
          {showDns && (
            <div className="table-wrapper">
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
  );
};

export default ForensicReportBlock;
