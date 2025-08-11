import React, { useState } from 'react';
import '../styles/ForensicReportBlock.css';

const ForensicReportBlock = ({ analysis = {} }) => {
  const [showWhois, setShowWhois] = useState(false);
  const [showDns, setShowDns] = useState(false);
  const [showRisk, setShowRisk] = useState(true);

  if (!analysis || Object.keys(analysis).length === 0) {
    return <p className="no-analysis">No forensic analysis available.</p>;
  }

  return (
    <div className="forensic-block">
      <h3 className="section-title">🕵️ Forensic Analysis</h3>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          🌐 <span className="label">IP Address:</span>
          <span className="value">{analysis.ip || 'N/A'}</span>
        </div>
        <div className="summary-card">
          🏢 <span className="label">Registrar:</span>
          <span className="value">{analysis.registrar || 'N/A'}</span>
        </div>
        <div className="summary-card">
          👤 <span className="label">WHOIS Owner:</span>
          <span className="value">{analysis.whoisOwner || 'N/A'}</span>
        </div>
        <div className="summary-card">
          🔒 <span className="label">SSL Valid:</span>
          <span className="value">{analysis.sslValid ? 'Yes' : 'No'}</span>
        </div>
        <div className="summary-card">
          📅 <span className="label">SSL Expiry:</span>
          <span className="value">{analysis.sslExpires || 'N/A'}</span>
        </div>
        <div className="summary-card">
          🔄 <span className="label">Reverse IP:</span>
          <span className="value">{analysis.reverseIp || 'N/A'}</span>
        </div>
      </div>

      {/* Geo */}
      {analysis.geo && (
        <div className="info-section">
          <p><strong>🌍 Hosting Country:</strong> {analysis.geo.country || 'N/A'}</p>
          <p><strong>🏢 ASN / Org:</strong> {analysis.geo.asn || 'N/A'}</p>
        </div>
      )}

      {/* Stats */}
      {analysis.stats && (
        <div className="info-section">
          <h4>📊 Domain & Security Stats</h4>
          <p><strong>Domain Age:</strong> {analysis.stats.domain_age_days} days</p>
          <p><strong>SSL Days Left:</strong> {analysis.stats.ssl_days_remaining}</p>
          <p><strong>DNS Security:</strong></p>
          <ul>
            <li>SPF: {analysis.stats.dns?.has_spf ? '✅' : '❌'}</li>
            <li>DMARC: {analysis.stats.dns?.has_dmarc ? '✅' : '❌'}</li>
            <li>MX Count: {analysis.stats.dns?.mx_count}</li>
            <li>NS Count: {analysis.stats.dns?.ns_count}</li>
          </ul>
        </div>
      )}

      {/* Risk Section */}
      <div className="risk-section">
        <button className="toggle-button" onClick={() => setShowRisk(prev => !prev)}>
          {showRisk ? '📉 Hide Risk Analysis ▲' : '📈 Show Risk Analysis ▼'}
        </button>
        {showRisk && (
          <>
            <p><strong>Risk Level:</strong> 
              <span className={`risk-badge ${analysis.riskLevel?.toLowerCase() || ''}`}>
                {analysis.riskLevel || 'N/A'}
              </span>
            </p>
            <p><strong>Risk Score:</strong> {analysis.riskScore || 'N/A'}</p>

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
          </>
        )}
      </div>

      {/* WHOIS */}
      {analysis.whoisRaw && (
        <div className="whois-section">
          <button className="toggle-button" onClick={() => setShowWhois(prev => !prev)}>
            {showWhois ? '📄 Hide WHOIS Raw ▲' : '📄 Show WHOIS Raw ▼'}
          </button>
          {showWhois && (
            <div className="table-wrapper">
              <table className="styled-table">
                <tbody>
                  {Object.entries(analysis.whoisRaw).map(([key, value]) => (
                    <tr key={key}>
                      <td><strong>{key}</strong></td>
                      <td>{Array.isArray(value) ? value.join(', ') : String(value)}</td>
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
        <div className="dns-section">
          <button className="toggle-button" onClick={() => setShowDns(prev => !prev)}>
            {showDns ? '🌍 Hide DNS Records ▲' : '🌍 Show DNS Records ▼'}
          </button>
          {showDns && (
            <div className="table-wrapper">
              <table className="styled-table">
                <thead>
                  <tr><th>Type</th><th>Value</th></tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.dns).flatMap(([type, entries]) =>
                    Array.isArray(entries) ? entries.map((val, i) => (
                      <tr key={`${type}-${i}`}><td>{type}</td><td>{val}</td></tr>
                    )) : (
                      <tr key={type}><td>{type}</td><td>{String(entries)}</td></tr>
                    )
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
