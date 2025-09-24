// "use client"
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FaCalendarAlt, FaUser, FaShieldAlt } from "react-icons/fa";
import { MdDangerous, MdCheckCircle } from "react-icons/md";
import ReportAnalysisModal from "./ReportAnalysisModal";
import API from "@/lib/api/axios";

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

  // derive role: prefer loggedInUser.role, fallback to route path
  useEffect(() => {
    if (loggedInUser?.role) setRole(loggedInUser.role);
    else if (pathname.startsWith("/investigator")) setRole("investigator");
    else if (pathname.startsWith("/admin")) setRole("admin");
    else if (pathname.startsWith("/reporter")) setRole("reporter");
  }, [loggedInUser, pathname]);

  // helper risk score (some backends put risk at top-level)
  const riskScore = report.riskScore ?? report.analysis?.riskScore ?? "N/A";

  const claimReport = async (e) => {
    e?.stopPropagation?.();
    if (!loggedInUser && role !== "investigator") {
      return setNotification({ type: "error", message: "You must be signed in as an investigator to claim this report." });

    }
    try {
      await API.post(`/reports/${report._id}/claim`, { investigatorId: loggedInUser?._id });
      setNotification({ type: "success", message: "Report claimed successfully!" });
      onRefresh();
    } catch (err) {
      console.error("Claim error", err);
      setNotification({ type: "error", message: err?.response?.data?.message || "Failed to claim report." });
    }
  };

  return (
    <div className="relative bg-[var(--card)] rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="absolute -top-3 left-4 bg-[var(--primary)] text-white px-3 py-1 rounded-t-md text-xs font-semibold">
        Report
      </div>

      <div className="mt-2 space-y-3">
        <h3 className="text-lg font-semibold text-[var(--text)] truncate">{report.domain}</h3>

        <div className="flex items-center text-sm text-[var(--muted)] gap-2">
          <FaCalendarAlt className="text-brad-500 flex-shrink-0" />
          <span className="truncate block w-full">{new Date(report.createdAt).toLocaleString()}</span>
        </div>

        <div className="flex items-center text-sm gap-2">
          <FaShieldAlt
            className={Number(riskScore) > 70 ? "text-red-500 flex-shrink-0" : "text-green-500 flex-shrink-0"}
          />
          <span className="truncate block w-full">
            Risk Score: <b>{riskScore}</b>
          </span>
        </div>

        {report.analysisStatus === "in-progress" && (
          <div className="flex items-center text-sm gap-2">
            <FaUser className="text-brad-500 flex-shrink-0" />
            <span className="truncate block w-full">
              Investigator: {report.reviewedBy?.username || report.investigator || "Unknown"}
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
            <span className="truncate block w-full">Verdict: {report.investigatorDecision}</span>
          </div>
        )}

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

          {/* Claim shown only to investigators for pending, unclaimed reports */}
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
