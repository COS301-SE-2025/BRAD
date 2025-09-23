"use client";
import React, { useEffect, useMemo, useState } from "react";
import API from "@/lib/api/axios";
import {
  FaGlobe,
  FaShieldAlt,
  FaFileAlt,
  FaUser,
  FaCheckCircle,
  FaCalendarAlt,
  FaChartLine,
  FaClock,
  FaMapMarkerAlt,
  FaBuilding,
  FaNetworkWired,   
  FaSearch,          
  FaSpider,          
} from "react-icons/fa";
import { MdDangerous, MdSecurity } from "react-icons/md";

import ScrapingInfoViewer from "./ScrapingInfoViewer";

/**
 * Props:
 *  - report
 *  - trigger
 *  - view: "pending" | "in-progress" | "resolved"
 *  - loggedInUser
 *  - onRefresh
 */
export default function ReportAnalysisModal({
  report,
  trigger,
  view = "in-progress",
  loggedInUser = null,
  onRefresh = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState(null);
  const [showWhois, setShowWhois] = useState(false);
  const [showDns, setShowDns] = useState(false);
  const [role, setRole] = useState("reporter");

  useEffect(() => {
    if (loggedInUser?.role) setRole(loggedInUser.role);
  }, [loggedInUser]);

  if (!report) return null;

  const analysis = report.analysis || {};
  const scrapingInfo = report.scrapingInfo || {};
  const s = scrapingInfo.summary || {};
  const evidence = report.evidence || [];

  const getDisplayStatus = (r) => {
    if (!r.investigatorDecision && !r.reviewedBy) return "Pending";
    if (!r.investigatorDecision && r.reviewedBy) return "In Progress";
    if (r.investigatorDecision) return "Resolved";
    return "Unknown";
  };

  const siteRiskReasons = useMemo(() => {
    if (!scrapingInfo.pages) return [];
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
    const allRedirects = uniq(scrapingInfo.pages.flatMap((p) => p.flags?.redirectChain || []));
    const allSuspiciousJS = uniq(scrapingInfo.pages.flatMap((p) => p.flags?.suspiciousJS || []));
    const flaggedCount = scrapingInfo.pages.filter((p) => (p.riskScore ?? 0) > 0).length;
    const malwarePages = scrapingInfo.pages.filter((p) => p.flags?.malwareDetected).length;
    const obfusPages = scrapingInfo.pages.filter((p) => p.flags?.obfuscatedScripts).length;
    const httpOnHttps = scrapingInfo.pages.reduce((a, p) => a + (p.flags?.httpOnHttpsCount || 0), 0);
    const errorResponses = scrapingInfo.pages.reduce((a, p) => a + (p.flags?.errorResponses || 0), 0);
    const kwMatches = scrapingInfo.pages.reduce((a, p) => a + (p.flags?.keywordMatches || 0), 0);

    const reasons = [];
    if (flaggedCount) reasons.push(`${flaggedCount} pages flagged`);
    if (malwarePages) reasons.push(`Malware indicators on ${malwarePages} pages`);
    if (obfusPages) reasons.push(`Obfuscated scripts on ${obfusPages} pages`);
    if (kwMatches) reasons.push(`${kwMatches} keyword matches`);
    if (httpOnHttps) reasons.push(`${httpOnHttps} mixed-content attempts`);
    if (errorResponses) reasons.push(`${errorResponses} error responses`);
    if (allSuspiciousJS.length) reasons.push(`${allSuspiciousJS.length} suspicious JS snippets`);
    if (allRedirects.length > 3) reasons.push(`Long redirect chains observed (${allRedirects.length})`);
    return reasons;
  }, [scrapingInfo]);

  const finalRiskScore = analysis.riskScore ?? s.siteRiskScore ?? "N/A";
  const finalRiskLevel = analysis.riskLevel ?? s.siteRiskLevel ?? "N/A";

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await API.post(`/reports/${report._id}/claim`, {
        investigatorId: loggedInUser?._id,
      });
      onRefresh();
      alert("Report claimed");
      setOpen(false);
    } catch (err) {
      console.error("Claim failed:", err);
      alert("Failed to claim report");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleDecision = async (verdict) => {
    if (!confirm(`Mark report as ${verdict}?`)) return;
    setIsDeciding(true);
    try {
      await API.patch(`/report/${report._id}/decision`, { verdict });
      onRefresh();
      alert(`Report marked as ${verdict}`);
      setOpen(false);
    } catch (err) {
      console.error("Decision error:", err);
      alert("Failed to update decision");
    } finally {
      setIsDeciding(false);
    }
  };

  const EvidenceGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
      {evidence.length === 0 && (
        <div className="text-sm text-gray-500">No evidence</div>
      )}
      {evidence.map((file, i) => {
        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(file);
        return (
          <div key={i} className="border rounded p-2">
            {isImage ? (
              <img
                src={`/api/static/uploads/evidence/${file}`}
                alt="evidence"
                className="w-full h-32 object-cover rounded cursor-pointer"
                onClick={() => setActiveEvidence(file)}
              />
            ) : (
              <a
                href={`/api/static/uploads/evidence/${file}`}
                download
                className="text-blue-600 underline"
              >
                {file}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 py-10 px-4">
          <div
            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaGlobe className="text-blue-500" /> {report.domain}
              </h2>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            {/* Reporter minimal view */}
            {role === "general" && (
              <div className="space-y-4">
                <InfoCard icon={<FaCalendarAlt />} label="Date Submitted" value={new Date(report.createdAt).toLocaleString()} />
                <InfoCard icon={<FaChartLine />} label="Risk Score" value={finalRiskScore} />
                <InfoCard icon={<MdSecurity />} label="Risk Level" value={finalRiskLevel} />
                <InfoCard icon={<FaCheckCircle />} label="Verdict" value={report.investigatorDecision ?? "N/A"} />
                <InfoCard icon={<FaShieldAlt />} label="Status" value={getDisplayStatus(report)} />
              </div>
            )}

            {/* Investigator/Admin views */}
            {role !== "general" && (
              <>
                {view === "pending" && (
                  <div className="space-y-6">
                    <InfoCard icon={<FaShieldAlt />} label="Status" value={getDisplayStatus(report)} />
                    <InfoCard icon={<FaUser />} label="Investigator" value={report.reviewedBy?.username || "Unassigned"} />
                    <InfoCard icon={<FaChartLine />} label="Risk Score" value={finalRiskScore} />
                    <InfoCard icon={<MdSecurity />} label="Risk Level" value={finalRiskLevel} />

                    <section>
                      <h3 className="font-semibold flex items-center gap-2">
                        <FaShieldAlt /> Forensic (Basic)
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <InfoCard icon={<FaMapMarkerAlt />} label="IP" value={analysis.ip} />
                        <InfoCard icon={<FaBuilding />} label="Registrar" value={analysis.registrar} />
                        <InfoCard icon={<FaCheckCircle />} label="SSL Valid" value={analysis.sslValid ? "Yes" : "No"} />
                        <InfoCard icon={<FaCalendarAlt />} label="SSL Expiry" value={analysis.sslExpires} />
                      </div>
                    </section>

                    <section>
                      <h3 className="font-semibold flex items-center gap-2">
                        <FaFileAlt /> Evidence
                      </h3>
                      <EvidenceGrid />
                    </section>

                    <button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="px-4 py-2 bg-yellow-500 text-white rounded"
                    >
                      {isClaiming ? "Claiming..." : "Claim Report"}
                    </button>
                  </div>
                )}

                {view !== "pending" && (
                  <div className="space-y-6">
                    <InfoCard icon={<FaShieldAlt />} label="Status" value={getDisplayStatus(report)} />
                    <InfoCard icon={<FaUser />} label="Investigator" value={report.reviewedBy?.username} />
                    <InfoCard icon={<FaChartLine />} label="Final Risk Score" value={finalRiskScore} />
                    <InfoCard icon={<MdSecurity />} label="Final Risk Level" value={finalRiskLevel} />
                    {s.startTime && <InfoCard icon={<FaClock />} label="Scan Start" value={s.startTime} />}
                    {s.endTime && <InfoCard icon={<FaClock />} label="Scan End" value={s.endTime} />}
                    {s.durationMs && <InfoCard icon={<FaClock />} label="Duration (ms)" value={s.durationMs} />}

                    <section>
                      <h3 className="font-semibold flex items-center gap-2">
                        <FaShieldAlt /> Forensic Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <InfoCard icon={<FaMapMarkerAlt />} label="IP" value={analysis.ip} />
                        <InfoCard icon={<FaBuilding />} label="Registrar" value={analysis.registrar} />
                        <InfoCard icon={<FaUser />} label="WHOIS Owner" value={analysis.whoisOwner} />
                        <InfoCard icon={<FaCheckCircle />} label="SSL Valid" value={analysis.sslValid ? "Yes" : "No"} />
                        <InfoCard icon={<FaCalendarAlt />} label="SSL Expiry" value={analysis.sslExpires} />
                        <InfoCard icon={<FaMapMarkerAlt />} label="Reverse IP" value={analysis.reverseIp} />
                        <InfoCard icon={<FaMapMarkerAlt />} label="Country" value={analysis.geo?.country} />
                        <InfoCard icon={<FaBuilding />} label="ASN/Org" value={analysis.geo?.asn} />
                        <InfoCard icon={<FaCalendarAlt />} label="Domain Created" value={analysis.stats?.domain_created} />
                        <InfoCard icon={<FaClock />} label="Domain Age" value={analysis.stats?.domain_age_days} />
                        <InfoCard icon={<FaClock />} label="SSL Days Remaining" value={analysis.stats?.ssl_days_remaining} />
                        <InfoCard icon={<FaClock />} label="NS Count" value={analysis.stats?.dns?.ns_count} />
                        <InfoCard icon={<FaClock />} label="MX Count" value={analysis.stats?.dns?.mx_count} />
                        <InfoCard icon={<FaCalendarAlt />} label="Analysis Timestamp" value={analysis.timestamp} />
                      </div>
                    </section>

                    <section>
                      <h3 className="font-semibold flex items-center gap-2">
                        <MdSecurity className="text-red-500" /> Risk Analysis
                      </h3>
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded mt-2">
                        <div><b>Level:</b> {analysis.riskLevel}</div>
                        <div><b>Score:</b> {analysis.riskScore}</div>
                        {analysis.riskReasons && (
                          <ul className="list-disc ml-6 mt-2 text-sm">
                            {Array.isArray(analysis.riskReasons)
                              ? analysis.riskReasons.map((r, i) => <li key={i}>{r}</li>)
                              : Object.entries(analysis.riskReasons).map(([k, v]) => (
                                <li key={k}><b>{k}:</b> {String(v)}</li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </section>

                    <ScrapingInfoViewer scrapingInfo={scrapingInfo} headerIcon={<FaSpider />} />
                    {siteRiskReasons.length > 0 && (
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        <b>Site Risk Reasons</b>
                        <ul className="list-disc ml-6 mt-1">
                          {siteRiskReasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}

                    {analysis.whoisRaw && (
                      <section>
                        <button onClick={() => setShowWhois(!showWhois)} className="px-3 py-1 bg-gray-200 rounded">
                          <FaSearch />{showWhois ? "Hide WHOIS Raw" : "Show WHOIS Raw"}
                        </button>
                        {showWhois && (
                          <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded mt-2 overflow-x-auto text-sm">
                            {JSON.stringify(analysis.whoisRaw, null, 2)}
                          </pre>
                        )}
                      </section>
                    )}

                    {analysis.dns && (
                      <section>
                        <button onClick={() => setShowDns(!showDns)} className="px-3 py-1 bg-gray-200 rounded">
                          <FaNetworkWired />{showDns ? "Hide DNS" : "Show DNS"}
                        </button>
                        {showDns && (
                          <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded mt-2 overflow-x-auto text-sm">
                            {JSON.stringify(analysis.dns, null, 2)}
                          </pre>
                        )}
                      </section>
                    )}

                    <section>
                      <h3 className="font-semibold flex items-center gap-2">
                        <FaFileAlt /> Evidence
                      </h3>
                      <EvidenceGrid />
                    </section>

                    {role === "investigator" && view === "in-progress" && !report.investigatorDecision && (
                      <div className="flex gap-3">
                        <button
                          className="px-4 py-2 bg-red-500 text-white rounded flex items-center gap-2"
                          onClick={() => handleDecision("malicious")}
                          disabled={isDeciding}
                        >
                          <MdDangerous />
                          {isDeciding ? "Submitting..." : "Mark Malicious"}
                        </button>
                        <button
                          className="px-4 py-2 bg-green-500 text-white rounded flex items-center gap-2"
                          onClick={() => handleDecision("benign")}
                          disabled={isDeciding}
                        >
                          <FaCheckCircle />
                          {isDeciding ? "Submitting..." : "Mark Benign"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function InfoCard({ label, value, icon = null }) {
  if (!value) return null;
  return (
    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded flex items-center gap-2">
      {icon && <span className="text-gray-500">{icon}</span>}
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-medium">{String(value)}</div>
      </div>
    </div>
  );
}
