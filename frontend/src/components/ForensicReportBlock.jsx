// src/components/ForensicReportBlock.jsx
import React, { useState } from 'react';
import '../styles/ForensicReportBlock.css';

const ForensicReportBlock = ({ analysis = {} }) => {
  const [showWhois, setShowWhois] = useState(false);
  const [showDns, setShowDns] = useState(false);
  const [showRisk, setShowRisk] = useState(true);

  if (!analysis) return <p>No forensic analysis available.</p>;

  return (
    <div className="forensic-block">
      <h4>Forensic Analysis</h4>

      <p><strong>IP Address:</strong> {analysis.ip}</p>
      <p><strong>Registrar:</strong> {analysis.registrar}</p>
      <p><strong>WHOIS Owner:</strong> {analysis.whoisOwner}</p>
      <p><strong>SSL Valid:</strong> {analysis.sslValid ? 'Yes' : 'No'}</p>
      <p><strong>SSL Expiry:</strong> {analysis.sslExpires}</p>
      <p><strong>Reverse IP:</strong> {analysis.reverseIp}</p>

      {analysis.geo && (
        <>
          <p><strong>Hosting Country:</strong> {analysis.geo.country}</p>
          <p><strong>ASN / Org:</strong> {analysis.geo.asn}</p>
        </>
      )}

      {analysis.stats && (
        <div className="stats-section">
          <p><strong>Domain Age:</strong> {analysis.stats.domain_age_days} days</p>
          <p><strong>SSL Days Left:</strong> {analysis.stats.ssl_days_remaining}</p>
          <p><strong>DNS Security:</strong></p>
          <ul>
            <li>SPF: {analysis.stats.dns?.has_spf ? '✓' : '❌'}</li>
            <li>DMARC: {analysis.stats.dns?.has_dmarc ? '✓' : '❌'}</li>
            <li>MX Count: {analysis.stats.dns?.mx_count}</li>
            <li>NS Count: {analysis.stats.dns?.ns_count}</li>
          </ul>
        </div>
      )}

      {/* New Risk Scoring Block */}
      <div className="risk-section">
        <button className="toggle-button" onClick={() => setShowRisk(prev => !prev)}>
          {showRisk ? 'Hide Risk Analysis ▲' : 'Show Risk Analysis ▼'}
        </button>

        {showRisk && (
          <>
            <p><strong>Risk Level:</strong> {analysis.riskLevel}</p>
            <p><strong>Risk Score:</strong> {analysis.riskScore}</p>

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

      {/* Toggle WHOIS */}
      {analysis.whoisRaw && (
        <div className="whois-section">
          <button className="toggle-button" onClick={() => setShowWhois(prev => !prev)}>
            {showWhois ? 'Hide WHOIS Raw ▲' : 'Show WHOIS Raw ▼'}
          </button>
          {showWhois && (
            <table className="whois-table">
              <tbody>
                {Object.entries(analysis.whoisRaw).map(([key, value]) => (
                  <tr key={key}>
                    <td><strong>{key}</strong></td>
                    <td>{Array.isArray(value) ? value.join(', ') : String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Toggle DNS */}
      {analysis.dns && (
        <div className="dns-section">
          <button className="toggle-button" onClick={() => setShowDns(prev => !prev)}>
            {showDns ? 'Hide DNS Records ▲' : 'Show DNS Records ▼'}
          </button>
          {showDns && (
            <table className="dns-table">
              <thead>
                <tr><th>Type</th><th>Value</th></tr>
              </thead>
              <tbody>
                {Object.entries(analysis.dns).flatMap(([type, entries]) =>
                  Array.isArray(entries) ? entries.map((val, i) => (
                    <tr key={`${type}-${i}`}><td>{type}</td><td>{val}</td></tr>
                  )) : (
                    <tr><td>{type}</td><td>{String(entries)}</td></tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ForensicReportBlock;
// src/styles/ForensicReportBlock.css