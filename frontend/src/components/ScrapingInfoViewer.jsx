"use client";

import { useMemo, useState } from "react";
import { FaListAlt, FaExchangeAlt, FaLink, FaImage, FaInfoCircle } from "react-icons/fa";

/**
 * Lightweight scraping info viewer:
 * - shows summary grid if available
 * - provides simple tabs: Structured | HTTP | Flagged | Screenshots
 *
 * This is a trimmed port of the old ScrapingInfoViewer to provide the useful info.
 */

export default function ScrapingInfoViewer({ scrapingInfo }) {
  const [activeTab, setActiveTab] = useState("structured");
  if (!scrapingInfo) return <p className="text-sm text-gray-500">No scraping data available.</p>;

  const sum = scrapingInfo.summary || {};
  const pages = Array.isArray(scrapingInfo.pages) && scrapingInfo.pages.length ? scrapingInfo.pages : [scrapingInfo];

  const tabs = [
    { id: "structured", label: "Structured Info", icon: <FaListAlt /> },
    { id: "http", label: "HTTP Summary", icon: <FaExchangeAlt /> },
    { id: "flagged", label: "Flagged", icon: <FaLink /> },
    { id: "screenshots", label: "Screenshots", icon: <FaImage /> },
  ];

  const renderStructured = () => (
    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><strong>Pages crawled:</strong> {sum.pagesCrawled ?? "—"}</div>
        <div><strong>Flagged:</strong> {sum.pagesFlagged ?? 0}</div>
        <div><strong>Requests sampled:</strong> {sum.requestsSampled ?? "—"}</div>
        <div><strong>Site risk:</strong> {sum.siteRiskLevel ?? "—"} ({sum.siteRiskScore ?? "—"})</div>
        <div><strong>Total req:</strong> {sum.requestsTotal ?? "—"}</div>
        <div><strong>Errors:</strong> {sum.errorsTotal ?? 0}</div>
      </div>
    </div>
  );

  const renderHTTP = () => (
    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
      <div className="text-sm">
        <strong>HTTP summary</strong>
        <div className="mt-2">
          {pages.map((p, i) => (
            <div key={i} className="mb-2">
              <div className="font-medium truncate">{p.url || p.finalUrl || p.startUrl}</div>
              <div className="text-xs text-gray-600">Status: {p.httpStatus ?? "—"} · Resp size: {p.responseSize ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFlagged = () => (
    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
      <div className="text-sm">
        <strong>Flagged pages</strong>
        <ul className="list-disc ml-6 mt-2">
          {pages.filter(p => p.flags && (p.flags.malwareDetected || p.flags.obfuscatedScripts || (p.flags.keywordMatches || 0) > 0)).length === 0 && <li>None</li>}
          {pages.map((p, i) => {
            const f = p.flags || {};
            if (!f.malwareDetected && !f.obfuscatedScripts && !(f.keywordMatches || 0)) return null;
            return (
              <li key={i}>
                {p.url || p.finalUrl || p.startUrl} — {f.malwareDetected ? "malware " : ""}{f.obfuscatedScripts ? "obfuscated " : ""}{(f.keywordMatches || 0) ? `${f.keywordMatches} kw` : ""}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  const renderScreenshots = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {pages.flatMap(p => p.screenshots || []).length === 0 && <div className="text-sm text-gray-500">No screenshots</div>}
      {pages.flatMap(p => p.screenshots || []).map((s, i) => (
        <img key={i} src={ s.startsWith("/") ? `/api${s}` : s } alt={`ss-${i}`} className="w-full h-28 object-cover rounded" />
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FaInfoCircle />
        <div className="text-sm font-medium">Scraping & Crawling Data</div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1 rounded ${activeTab === t.id ? "bg-[var(--primary)] text-white" : "bg-gray-100 dark:bg-gray-800"}`}
          >
            <span className="inline-flex items-center gap-2">{t.icon}<span className="text-sm">{t.label}</span></span>
          </button>
        ))}
      </div>

      <div>
        {activeTab === "structured" && renderStructured()}
        {activeTab === "http" && renderHTTP()}
        {activeTab === "flagged" && renderFlagged()}
        {activeTab === "screenshots" && renderScreenshots()}
      </div>
    </div>
  );
}
