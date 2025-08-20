import React, { useMemo, useState } from "react";
import ScrapingInfoViewer from "./ScrapingInfoViewer";
import Notification from "./Notification";
import {
  Globe, Building, User, Lock, Calendar, RefreshCcw,
  FileText, Server, Shield, Paperclip
} from "lucide-react";
import API from '../api/axios';
import "../styles/ReportModal.css";

const ReportModal = ({ report, onClose, loggedInUser, view, handleDecision, refreshReports }) => {
  const [showWhois, setShowWhois] = useState(false);
  const [showDns, setShowDns] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeEvidence, setActiveEvidence] = useState(null);

  const analysis = report?.analysis || {};
  const scrapingInfo = report?.scrapingInfo || {};
  const s = scrapingInfo?.summary || {};

  const showNotification = (type, message) => setNotification({ type, message });

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const res = await API.post(`/reports/${report._id}/claim`, { investigatorId: loggedInUser._id });
      Object.assign(report, res.data);
      showNotification("success", "Report successfully claimed.");
      if (refreshReports) refreshReports();
    } catch (err) {
      console.error("Claim failed:", err);
      showNotification("error", err.response?.data?.message || "Failed to claim report.");
    } finally {
      setIsClaiming(false);
    }
  };

  const getDisplayStatus = (r) => {
    if (!r.investigatorDecision && !r.reviewedBy) return "Pending";
    if (!r.investigatorDecision && r.reviewedBy) return "In Progress";
    if (r.investigatorDecision) return "Resolved";
    return "Unknown";
  };

  const labelize = (key = "") =>
    key
      .replace(/[_-]+/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const fmt = (v, fallback = "N/A") => {
    if (v === null || v === undefined || (typeof v === "number" && !isFinite(v))) return fallback;
    return typeof v === "number" ? v.toLocaleString() : String(v);
  };

  // ---------- Site-wide aggregates (for reasons) ----------
  const pages = useMemo(() => {
    if (Array.isArray(scrapingInfo.pages) && scrapingInfo.pages.length) return scrapingInfo.pages;
    return scrapingInfo && (scrapingInfo.url || scrapingInfo.finalUrl || scrapingInfo.startUrl)
      ? [scrapingInfo]
      : [];
  }, [scrapingInfo]);

  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

  const allRedirects = useMemo(
    () => uniq(pages.flatMap((p) => p.flags?.redirectChain || [])),
    [pages]
  );
  const allSuspiciousJS = useMemo(
    () => uniq(pages.flatMap((p) => p.flags?.suspiciousJS || [])),
    [pages]
  );

  const flaggedPages = useMemo(() => {
    return pages.filter((p) => {
      const f = p.flags || {};
      return (
        (p.riskScore ?? 0) > 0 ||
        f.obfuscatedScripts ||
        f.malwareDetected ||
        (f.keywordMatches || 0) > 0 ||
        (f.errorResponses || 0) > 0 ||
        (f.httpOnHttpsCount || 0) > 0
      );
    });
  }, [pages]);

  const sfx = (n) => (n === 1 ? "" : "s");
  const siteRiskReasons = useMemo(() => {
    if (!pages.length) return [];
    const reasons = [];
    const flaggedCount   = flaggedPages.length;
    const malwarePages   = pages.filter((p) => p.flags?.malwareDetected).length;
    const obfusPages     = pages.filter((p) => p.flags?.obfuscatedScripts).length;
    const httpOnHttps    = pages.reduce((a, p) => a + (p.flags?.httpOnHttpsCount || 0), 0);
    const errorResponses = pages.reduce((a, p) => a + (p.flags?.errorResponses || 0), 0);
    const kwMatches      = pages.reduce((a, p) => a + (p.flags?.keywordMatches || 0), 0);
    const redirects      = allRedirects.length;
    const susJsSnippets  = allSuspiciousJS.length;

    if (flaggedCount)   reasons.push(`${flaggedCount} page${sfx(flaggedCount)} flagged`);
    if (malwarePages)   reasons.push(`Malware indicators on ${malwarePages} page${sfx(malwarePages)}`);
    if (obfusPages)     reasons.push(`Obfuscated scripts on ${obfusPages} page${sfx(obfusPages)}`);
    if (kwMatches)      reasons.push(`${kwMatches} suspicious keyword match${sfx(kwMatches)}`);
    if (httpOnHttps)    reasons.push(`${httpOnHttps} HTTP→HTTPS downgrade/mixed-content attempt${sfx(httpOnHttps)}`);
    if (errorResponses) reasons.push(`${errorResponses} error response${sfx(errorResponses)} (4xx/5xx)`);
    if (susJsSnippets)  reasons.push(`${susJsSnippets} suspicious JS snippet${sfx(susJsSnippets)}`);
    if (redirects > 3)  reasons.push(`Long redirect chains observed (${redirects})`);
    return reasons;
  }, [pages, flaggedPages, allRedirects, allSuspiciousJS]);

  // ---------- Final risk (max of forensic + site scores) ----------
  const toLevel = (score) => (score >= 70 ? "High" : score >= 40 ? "Medium" : "Low");
  const forensicScoreRaw = Number(analysis?.riskScore);
  const siteScoreRaw     = Number(s?.siteRiskScore);

  const finalRiskScore = forensicScoreRaw + siteScoreRaw;

  // Level from score if present, otherwise fall back to provided levels
  const fallbackLevel = finalRiskScore?.riskLevel;
  const finalRiskLevel = finalRiskScore !== null ? toLevel(finalRiskScore) : fallbackLevel;

  const showFullDetails = view !== "pending";

  return (
    <div className="report-modal-overlay">
      <div className="report-modal">

        {/* Notification Banner */}
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Header */}
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

        {/* Top cards */}
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

          {/* Final Risk */}
          <div className="heading-card">
            <h4>Final Risk</h4>
            <p>
              <span className={`risk-badge ${finalRiskLevel ? finalRiskLevel.toLowerCase() : ""}`}>
                {finalRiskLevel || "N/A"}
              </span>
              {finalRiskScore !== null ? ` (${Math.round(finalRiskScore)})` : ""}
            </p>
          </div>
        </div>

        {showFullDetails && scrapingInfo?.summary && (
          <div className="heading-section">
            <div className="heading-card">
              <h4>Scan Window</h4>
              <p>
                {s.startTime ? new Date(s.startTime).toLocaleString() : "—"} →{" "}
                {s.endTime ? new Date(s.endTime).toLocaleString() : "—"}
              </p>
            </div>
            <div className="heading-card">
              <h4>Duration</h4>
              <p>{typeof s.durationMs === "number" ? `${(s.durationMs / 1000).toFixed(1)}s` : "—"}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="report-main-grid">
          {/* Left: Forensic */}
          <div className="report-column forensic-column">

            {!analysis || Object.keys(analysis).length === 0 ? (
              <p className="no-analysis">No forensic analysis available.</p>
            ) : (
              <div className="forensic-block">
                <h3 className="section-title">
                  <Shield size={18} /> Forensic Analysis
                </h3>

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

                {analysis.geo && (
                  <div className="info-section">
                    <h4><Globe size={18} /> Hosting Info</h4>
                    <p><strong>Country:</strong> {analysis.geo.country || "N/A"}</p>
                    <p><strong>ASN / Org:</strong> {analysis.geo.asn || "N/A"}</p>
                  </div>
                )}

                {analysis.stats && (
                  <div className="info-section">
                    <h4>Forensic Stats</h4>
                    <div className="stats-grid">
                      <p><strong>Domain created:</strong> {analysis.stats.domain_created || "N/A"}</p>
                      <p><strong>Domain age:</strong> {fmt(analysis.stats.domain_age_days)} days</p>
                      <p><strong>SSL days remaining:</strong> {fmt(analysis.stats.ssl_days_remaining)}</p>
                      <p><strong>NS count:</strong> {fmt(analysis.stats.dns?.ns_count)}</p>
                      <p><strong>MX count:</strong> {fmt(analysis.stats.dns?.mx_count)}</p>
                      <p><strong>Analysis timestamp:</strong> {analysis.timestamp ? new Date(analysis.timestamp).toLocaleString() : "—"}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {report.analysis && (
              <div className="forensic-block">
                <h3 className="section-title">
                  <Shield size={18} /> Forensic Analysis: Risk Analysis
                </h3>
                <div className="risk-summary">
                  <p>
                    <strong>Risk Level:</strong>{" "}
                    <span className={`risk-badge ${report.analysis.riskLevel?.toLowerCase() || ""}`}>
                      {report.analysis.riskLevel || "N/A"}
                    </span>
                  </p>
                  <p><strong>Risk Score:</strong> {Number.isFinite(forensicScoreRaw) ? Math.round(forensicScoreRaw) : "N/A"}</p>

                  {analysis.riskReasons && (
                    <div className="info-section">
                      <h4>Risk Factors</h4>
                      <ul className="risk-reasons">
                        {Array.isArray(analysis.riskReasons)
                          ? analysis.riskReasons.map((r, i) => <li key={i}>{r}</li>)
                          : Object.entries(analysis.riskReasons).map(([k, v]) => (
                              <li key={k}><strong>{labelize(k)}:</strong> {String(v)}</li>
                            ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Scraping / Site Risk */}
          <div className="report-column scraping-column">
            {showFullDetails && (
              <>
                <ScrapingInfoViewer scrapingInfo={scrapingInfo} />

                {(s?.siteRiskLevel || Number.isFinite(siteScoreRaw) || siteRiskReasons.length > 0) && (
                  <div className="info-section">
                    <h3 className="section-title">
                      <Shield size={18} /> Scraping &amp; Crawling Data: Risk Analysis
                    </h3>
                    <div className="risk-reasons">
                      <p>
                        <strong>Risk Level:</strong>{" "}
                        <span className={`risk-badge ${s?.siteRiskLevel ? s.siteRiskLevel.toLowerCase() : ""}`}>
                          {s?.siteRiskLevel || "N/A"}
                        </span>
                      </p>
                      <p><strong>Risk Score:</strong> {Number.isFinite(siteScoreRaw) ? Math.round(siteScoreRaw) : "N/A"}</p>

                      {siteRiskReasons.length > 0 && (
                        <div className="info-section" style={{ marginTop: 8 }}>
                          <h4>Site Risk Reasons</h4>
                          <ul className="risk-reasons">
                            {siteRiskReasons.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* WHOIS raw */}
                {analysis.whoisRaw && (
                  <div className="toggle-section">
                    <button
                      className={`scraping-toggle-btn ${showWhois ? "active" : ""}`}
                      onClick={() => setShowWhois((prev) => !prev)}
                    >
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

                {/* DNS records */}
                {analysis.dns && (
                  <div className="toggle-section">
                    <button
                      className={`scraping-toggle-btn ${showDns ? "active" : ""}`}
                      onClick={() => setShowDns((prev) => !prev)}
                    >
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
                                ? entries.map((val, i) => (
                                    <tr key={`${type}-${i}`}><td>{type}</td><td>{val}</td></tr>
                                  ))
                                : (<tr key={type}><td>{type}</td><td>{String(entries)}</td></tr>)
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Evidence */}
            {report.evidence && report.evidence.length > 0 && (
              <div className="evidence-section">
                <h3><Paperclip size={18} /> Evidence</h3>
                <div className="evidence-grid">
                  {report.evidence.map((file, idx) => {
                    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file);
                    const href = `http://localhost:3000/static/uploads/evidence/${file}`;
                    return (
                      <div key={idx} className="evidence-card">
                        {isImage ? (
                          <img src={href} alt={`Evidence ${idx + 1}`} onClick={() => setActiveEvidence(file)} />
                        ) : (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="evidence-file">
                            <Paperclip size={20} /> {file}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decision buttons */}
        {showFullDetails && view === "in_progress" && !report.investigatorDecision && (
          <section className="decision-section">
            <button
              className="decision-btn malicious"
              disabled={report.reviewedBy?._id !== loggedInUser?._id}
              onClick={() => handleDecision(report._id, "malicious")}
            >
              Mark as Malicious
            </button>
            <button
              className="decision-btn benign"
              disabled={report.reviewedBy?._id !== loggedInUser?._id}
              onClick={() => handleDecision(report._id, "benign")}
            >
              Mark as Safe
            </button>
          </section>
        )}

        {/* Evidence preview modal */}
        {activeEvidence && (
          <div className="evidence-preview-overlay" onClick={() => setActiveEvidence(null)}>
            <div className="evidence-preview-modal" onClick={(e) => e.stopPropagation()}>
              <header className="evidence-preview-header">
                <h4>Evidence Preview</h4>
                <button className="close-button" onClick={() => setActiveEvidence(null)}>✖</button>
              </header>
              <div className="evidence-preview-body">
                <img
                  src={`http://localhost:3000/static/uploads/evidence/${activeEvidence}`}
                  alt="Evidence Full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
