import React, { useEffect, useMemo, useState } from "react";
import "../styles/ReportModal.css";
import {
  FaListAlt,
  FaLink,
  FaImage,
  FaInfoCircle,
  FaExchangeAlt,
  FaHashtag,
} from "react-icons/fa";

const ScrapingInfoViewer = ({ scrapingInfo }) => {
  const [activeTab, setActiveTab] = useState("structured"); // structured | http | links | hashes | screenshots
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pageHashes, setPageHashes] = useState([]); // [{url, sha256, size}]

  if (!scrapingInfo) return <p className="no-analysis">No scraping data available.</p>;

  const tabs = [
    { id: "structured",  label: "Structured Info", icon: <FaListAlt /> },
    { id: "http",        label: "HTTP Summary",    icon: <FaExchangeAlt /> },
    { id: "links",       label: "Flagged",         icon: <FaLink /> },
    { id: "hashes",      label: "Hashes",          icon: <FaHashtag /> },
    { id: "screenshots", label: "Screenshots",     icon: <FaImage /> },
  ];

  // ---------- Data shaping ----------
  const pages = useMemo(() => {
    if (Array.isArray(scrapingInfo.pages) && scrapingInfo.pages.length) return scrapingInfo.pages;
    return [scrapingInfo];
  }, [scrapingInfo]);

  const sum = scrapingInfo.summary || {};

  // ---------- Helpers ----------
  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

  const bytes = (n) =>
    typeof n === "number"
      ? n < 1024
        ? `${n} B`
        : n < 1024 * 1024
          ? `${(n / 1024).toFixed(1)} KB`
          : `${(n / 1024 / 1024).toFixed(1)} MB`
      : "—";

  const hostPath = (u) => {
    try {
      const url = new URL(u);
      return { host: url.host, path: url.pathname + (url.search || "") };
    } catch {
      return { host: "", path: u || "" };
    }
  };

  const toImageUrl = (p) => {
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith("/static/")) return `/api${p}`;
    return `/api/static/${p}`;
  };

  const tally = (rows, getKey) => {
    const map = new Map();
    for (const r of rows) {
      const k = getKey(r);
      if (!k) continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  // ---------- Aggregates for Structured/Flagged ----------
  const crawledLinks = useMemo(
    () => (Array.isArray(scrapingInfo.crawledLinks) ? scrapingInfo.crawledLinks : []),
    [scrapingInfo]
  );

  const allLinks = useMemo(() => {
    if (crawledLinks.length) return uniq(crawledLinks);
    return uniq(pages.flatMap((p) => p.structuredInfo?.links || []));
  }, [crawledLinks, pages]);

  const allFormsCount = useMemo(
    () => pages.reduce((acc, p) => acc + (p.structuredInfo?.forms?.length || 0), 0),
    [pages]
  );

  const allSuspiciousJS = useMemo(
    () => uniq(pages.flatMap((p) => p.flags?.suspiciousJS || [])),
    [pages]
  );

  const anyObfuscated = useMemo(
    () => pages.some((p) => p.flags?.obfuscatedScripts),
    [pages]
  );

  const allRedirects = useMemo(
    () => uniq(pages.flatMap((p) => p.flags?.redirectChain || [])),
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

  // ---------- HTTP summary (site-wide) ----------
  const rawNet = scrapingInfo.network?.requests || [];
  const responses = useMemo(
    () => rawNet.filter((r) => typeof r.status === "number"),
    [rawNet]
  );

  const methodCounts   = useMemo(() => tally(responses, (r) => (r.method || "GET").toUpperCase()), [responses]);
  const typeCounts     = useMemo(() => tally(responses, (r) => r.resourceType || r.type || "other"), [responses]);
  const hostCounts     = useMemo(() => tally(responses, (r) => hostPath(r.url).host || "(unknown)"), [responses]);
  const statusBuckets  = useMemo(
    () => tally(responses, (r) => {
      const s = Number(r.status) || 0;
      return `${Math.floor(s / 100)}xx`;
    }),
    [responses]
  );

  // ---------- Hashes (prefer server hash, fall back to browser SHA-256) ----------
  useEffect(() => {
    let cancelled = false;

    const sha256 = async (str) => {
      if (!window.crypto?.subtle) return null;
      const enc = new TextEncoder();
      const data = enc.encode(str);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    (async () => {
      const results = [];
      for (const p of pages) {
        const url = p.url || p.finalUrl || p.startUrl || "(unknown)";
        const precomputed = p.htmlHash || p.htmlSHA256; // support both names
        const html = p.htmlRaw || p.rawHtml || p.html || scrapingInfo.htmlRaw || scrapingInfo.rawHtml || "";
        let hash = precomputed || null;
        if (!hash && html) {
          try { hash = await sha256(html); } catch { hash = null; }
        }
        results.push({ url, sha256: hash, size: html ? html.length : 0 });
      }
      if (!cancelled) setPageHashes(results);
    })();

    return () => { cancelled = true; };
  }, [pages, scrapingInfo]);

  // ---------- Renderers ----------
  const renderStructured = () => (
    <div className="scraping-section">
      {/* Site-wide aggregates */}
      <div className="info-section">
        <p><strong>Site-wide</strong></p>
        <div className="stats-grid">
          <p>Total links: {allLinks.length}</p>
          <p>Total forms: {allFormsCount}</p>
          <p>Suspicious JS snippets: {allSuspiciousJS.length}</p>
          <p>Obfuscated scripts: {anyObfuscated ? "Yes" : "No"}</p>
        </div>

        {allSuspiciousJS.length > 0 && (
          <ul className="mono-list">
            {allSuspiciousJS.map((code, i) => (
              <li key={i}><code>{code}</code></li>
            ))}
          </ul>
        )}

        {allRedirects.length > 0 && (
          <>
            <p style={{ marginTop: 8 }}><strong>Redirects seen (any page):</strong></p>
            <ul className="mono-list">
              {allRedirects.map((u, i) => <li key={i}><code>{u}</code></li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );

  const renderHttpSummary = () => (
    <div className="scraping-section">
      {!responses.length ? (
        <p className="no-analysis">No HTTP response logs available (only high-level summary).</p>
      ) : (
        <>
          <div className="info-section">
            <p><strong>Methods</strong></p>
            <table className="styled-table small">
              <tbody>{methodCounts.map(([k, v]) => (<tr key={k}><td>{k}</td><td>{v}</td></tr>))}</tbody>
            </table>
          </div>

          <div className="info-section">
            <p><strong>Resource types</strong></p>
            <table className="styled-table small">
              <tbody>{typeCounts.map(([k, v]) => (<tr key={k}><td>{k}</td><td>{v}</td></tr>))}</tbody>
            </table>
          </div>

          <div className="info-section">
            <p><strong>Status buckets</strong></p>
            <table className="styled-table small">
              <tbody>{statusBuckets.map(([k, v]) => (<tr key={k}><td>{k}</td><td>{v}</td></tr>))}</tbody>
            </table>
          </div>

          <div className="info-section">
            <p><strong>Top hosts</strong></p>
            <table className="styled-table small">
              <tbody>{hostCounts.slice(0, 10).map(([k, v]) => (<tr key={k}><td>{k}</td><td>{v}</td></tr>))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  const renderFlagged = () => (
    <div className="scraping-section">
      {flaggedPages.length === 0 ? (
        <p className="no-analysis">No pages flagged.</p>
      ) : (
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Risk</th>
                <th>Flags</th>
                <th>Requests/Errors</th>
              </tr>
            </thead>
            <tbody>
              {flaggedPages.map((p, i) => {
                const f = p.flags || {};
                const ns = p.networkSummary || {};
                const tags = [];
                if (f.obfuscatedScripts) tags.push("Obfuscated JS");
                if (f.malwareDetected)   tags.push("Malware");
                if ((f.keywordMatches || 0) > 0) tags.push(`Keywords: ${f.keywordMatches}`);
                if ((f.httpOnHttpsCount || 0) > 0) tags.push(`HTTP→HTTPS: ${f.httpOnHttpsCount}`);
                if ((f.errorResponses || 0) > 0)   tags.push(`Errors: ${f.errorResponses}`);

                return (
                  <tr key={i}>
                    <td className="url-cell">
                      <div className="path">{p.url || p.finalUrl || p.startUrl || "(unknown)"}</div>
                    </td>
                    <td>{p.riskLevel || "—"}{p.riskScore != null ? ` (${p.riskScore})` : ""}</td>
                    <td>
                      {tags.length ? (
                        <div className="pill-tray">{tags.map((t, j) => <span key={j} className="pill">{t}</span>)}</div>
                      ) : "—"}
                    </td>
                    <td>{ns.requests ?? ns.requestsTotal ?? "—"} / {ns.errors ?? ns.errorCount ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderHashes = () => (
    <div className="scraping-section">
      {!pageHashes.length ? (
        <p className="no-analysis">No hashes available.</p>
      ) : (
        <table className="styled-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>HTML SHA-256</th>
            </tr>
          </thead>
          <tbody>
            {pageHashes.map((h, i) => (
              <tr key={i}>
                <td className="url-cell"><div className="path">{h.url}</div></td>
                <td><code>{h.sha256 || "—"}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!window.crypto?.subtle && (
        <p className="small-dim" style={{ marginTop: 8 }}>
          Browser crypto API not available; showing server-provided hashes only.
        </p>
      )}
    </div>
  );

  const renderScreenshots = () => {
    const shots = uniq([
      ...(Array.isArray(scrapingInfo.screenshots) ? scrapingInfo.screenshots : []),
      ...(scrapingInfo.screenshotPath ? [scrapingInfo.screenshotPath] : []),
      ...pages.map((p) => p.screenshotPath || p.screenshot?.path).filter(Boolean),
    ]).map(toImageUrl);

    if (!shots.length) return <p className="no-analysis">No screenshots available.</p>;

    return (
      <>
        <div className="scraping-section">
          <div className="screenshot-grid">
            {shots.map((src, i) => (
              <button
                key={i}
                className="screenshot-thumb"
                onClick={() => { setActiveScreenshot(src); setShowScreenshotModal(true); }}
                title={`Screenshot ${i + 1}`}
              >
                <img src={src} alt={`Screenshot ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {showScreenshotModal && activeScreenshot && (
          <div className="shot-modal" onClick={() => setShowScreenshotModal(false)}>
            <div className="shot-modal-content" onClick={(e) => e.stopPropagation()}>
              <header className="shot-modal-header">
                <strong>Screenshot</strong>
                <div className="shot-controls">
                  <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>−</button>
                  <button onClick={() => setZoom(1)}>Fit</button>
                  <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>+</button>
                  <a href={activeScreenshot} target="_blank" rel="noopener noreferrer" className="shot-open">
                    Open original
                  </a>
                  <button className="close-button" onClick={() => setShowScreenshotModal(false)}>✖</button>
                </div>
              </header>
              <div className="shot-modal-body">
                <img
                  src={activeScreenshot}
                  alt="Screenshot Full"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center top" }}
                  onLoad={() => setZoom(1)}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "structured":  return renderStructured();     // site-wide aggregates
      case "http":        return renderHttpSummary();    // site-wide HTTP view
      case "links":       return renderFlagged();        // pages flagged
      case "hashes":      return renderHashes();         // per-page hashes (no picker)
      case "screenshots": return renderScreenshots();    // all screenshots
      default:            return null;
    }
  };

  return (
    <div className="scraping-info-viewer">
      <h2><FaListAlt /> Scraping & Crawling Data</h2>

      {/* Overall Site Summary (always visible) */}
      {scrapingInfo.summary && (
        <div className="scraping-summary">
          <FaInfoCircle />
          <div className="stats-grid">
            <p><strong>Pages crawled:</strong> {sum.pagesCrawled ?? "—"}</p>
            <p><strong>Flagged:</strong> {sum.pagesFlagged ?? 0}</p>
            <p><strong>Requests sampled:</strong> {sum.requestsSampled ?? "—"}</p>
            <p><strong>Site risk:</strong> {sum.siteRiskLevel ?? "—"} ({sum.siteRiskScore ?? "—"})</p>
            <p><strong>Total req:</strong> {sum.requestsTotal ?? "—"}</p>
            <p><strong>Total resp:</strong> {sum.responsesTotal ?? "—"}</p>
            <p><strong>Errors:</strong> {sum.errorsTotal ?? 0}</p>
            <p><strong>HTTP→HTTPS attempts:</strong> {sum.httpOnHttpsAttemptsTotal ?? 0}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="scraping-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`scraping-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {renderActiveTab()}
    </div>
  );
};

export default ScrapingInfoViewer;
