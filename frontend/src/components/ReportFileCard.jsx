// "use client"
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FaCalendarAlt, FaUser, FaShieldAlt } from "react-icons/fa";
import { MdDangerous, MdCheckCircle } from "react-icons/md";
import ReportAnalysisModal from "./ReportAnalysisModal";
import API from "@/lib/api/axios";

/**
 * Helper to safely compute risk score + level + color
 */
function getRiskInfo(analysis, scrapingSummary) {
  const forensic = Number(analysis?.riskScore ?? 0);
  const site = Number(scrapingSummary?.siteRiskScore ?? 0);

  const score = forensic + site;

  if (isNaN(score)) {
    return { score: null, level: "Unknown", color: "text-gray-400" };
  }

  let level = "Low";
  let color = "text-green-500";

  if (score >= 70) {
    level = "High";
    color = "text-red-500";
  } else if (score >= 40) {
    level = "Medium";
    color = "text-orange-500";
  }

  return { score, level, color };
}

/**
 * Props:
 *  - report
 *  - view: optional view string (used for accessibility)
 *  - loggedInUser: object - optional (preferred)
 *  - onRefresh: function to call to refresh lists after claim/decision
 */
export default function ReportFileCard({
  report,
  view = "pending",
  loggedInUser = null,
  onRefresh = () => {},
  setNotification,
}) {
  setNotification = setNotification || (() => {});
  const [role, setRole] = useState("reporter");
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  const analysis = report.analysis || {};
  const scrapingInfo = report.scrapingInfo || {};
  const s = scrapingInfo.summary || {};

  // derive role: prefer loggedInUser.role, fallback to route path
  useEffect(() => {
    if (loggedInUser?.role) setRole(loggedInUser.role);
    else if (pathname.startsWith("/investigator")) setRole("investigator");
    else if (pathname.startsWith("/admin")) setRole("admin");
    else if (pathname.startsWith("/reporter")) setRole("reporter");
  }, [loggedInUser, pathname]);

  // Centralized risk score logic
  const { score: finalRiskScore, level: finalRiskLevel, color: riskColor } =
    getRiskInfo(analysis, s);

  const claimReport = async (e) => {
    e?.stopPropagation?.();
    if (!loggedInUser && role !== "investigator") {
      return setNotification({
        type: "error",
        message:
          "You must be signed in as an investigator to claim this report.",
      });
    }
    try {
      await API.post(`/reports/${report._id}/claim`, {
        investigatorId: loggedInUser?._id,
      });
      setNotification({
        type: "success",
        message: "Report claimed successfully!",
      });
      onRefresh();
    } catch (err) {
      console.error("Claim error", err);
      setNotification({
        type: "error",
        message: err?.response?.data?.message || "Failed to claim report.",
      });
    }
  };

  return (
    <div className="relative rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* File-style header */}
      <div className="bg-blue-500 text-white px-4 py-2 text-sm font-bold flex items-center">
        Report
      </div>

      {/* File body */}
      <div className="p-4 space-y-3 bg-[var(--card)]">
        <h3 className="text-lg font-semibold text-[var(--text)] truncate">
          {report.domain}
        </h3>

        <div className="flex items-center text-sm text-[var(--muted)] gap-2">
          <FaCalendarAlt className="text-brad-500 flex-shrink-0" />
          <span className="truncate block w-full">
            {new Date(report.createdAt).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center text-sm gap-2">
          <FaShieldAlt className={`${riskColor} flex-shrink-0`} />
          <span className="truncate block w-full">
            Risk Score:{" "}
            <b>{finalRiskScore !== null ? finalRiskScore : "N/A"}</b> (
            {finalRiskLevel})
          </span>
        </div>

        {report.analysisStatus === "in-progress" && (
          <div className="flex items-center text-sm gap-2">
            <FaUser className="text-brad-500 flex-shrink-0" />
            <span className="truncate block w-full">
              Investigator:{" "}
              {report.reviewedBy?.username ||
                report.investigator ||
                "Unknown"}
            </span>
          </div>
        )}

        {report.investigatorDecision && (
          <div className="flex items-center text-sm gap-2">
            {report.investigatorDecision === "malicious" ? (
              <MdDangerous className="text-red-500 flex-shrink-0" />
            ) : (
              <MdCheckCircle className="text-green-500 flex-shrink-0" />
            )}
            <span className="truncate block w-full">
              Verdict: {report.investigatorDecision}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <ReportAnalysisModal
            report={report}
            view={report.analysisStatus}
            loggedInUser={loggedInUser}
            onRefresh={onRefresh}
            trigger={
              <button className="flex-1 px-3 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-95">
                View Report
              </button>
            }
          />

          {role === "investigator" &&
            !report.reviewedBy &&
            !report.investigatorDecision &&
            report.analysisStatus === "pending" && (
              <button
                onClick={claimReport}
                className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:opacity-95"
              >
                Claim
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
