"use client"
import { FaCalendarAlt, FaUser, FaShieldAlt } from "react-icons/fa"
import { MdDangerous, MdCheckCircle } from "react-icons/md"

export default function ReportFileCard({ report }) {
  return (
    <div className="relative bg-[var(--card)] rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      {/* File tab shape */}
      <div className="absolute -top-3 left-4 bg-[var(--primary)] text-white px-3 py-1 rounded-t-md text-xs font-semibold">
        Report
      </div>

      {/* Report content */}
      <div className="mt-2 space-y-3">
        {/* Domain */}
        <h3 className="text-lg font-semibold text-[var(--text)]">
          {report.domain}
        </h3>

        {/* Date */}
        <div className="flex items-center text-sm text-[var(--muted)] gap-2">
          <FaCalendarAlt className="text-brad-500" />
          <span>{report.date}</span>
        </div>

        {/* Risk score */}
        <div className="flex items-center text-sm gap-2">
          <FaShieldAlt
            className={report.risk > 70 ? "text-red-500" : "text-green-500"}
          />
          <span>
            Risk Score: <b>{report.risk}</b>
          </span>
        </div>

        {/* Extra info based on status */}
        {report.status === "in-progress" && (
          <div className="flex items-center text-sm gap-2">
            <FaUser className="text-brad-500" />
            <span>Investigator: {report.investigator}</span>
          </div>
        )}

        {report.status === "resolved" && (
          <div className="flex items-center text-sm gap-2">
            {report.verdict === "malicious" ? (
              <MdDangerous className="text-red-500" />
            ) : (
              <MdCheckCircle className="text-green-500" />
            )}
            <span>Verdict: {report.verdict}</span>
          </div>
        )}
      </div>
    </div>
  )
}
