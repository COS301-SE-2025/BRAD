"use client"

import { useEffect, useMemo, useState } from "react"
import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import ReportFileCard from "@/components/ReportFileCard"
import ReportProgressBar from "@/components/ReportProgressBar"
import ReportsTreemap from "@/components/ReportsTreemap"

export default function ReporterDashboard() {
  const storedUser =
    JSON.parse(localStorage.getItem("user")) || { username: "Reporter" }

  // Mock report history data (10+ items, varied statuses & risks)
  const [reports, setReports] = useState([
    { id: 1, domain: "malicious-site.com", date: "2025-09-01", risk: 92, status: "pending" },
    { id: 2, domain: "phishy.co", date: "2025-09-02", risk: 55, status: "in-progress", investigator: "Agent Smith" },
    { id: 3, domain: "spammy.net", date: "2025-09-03", risk: 12, status: "resolved", verdict: "benign" },
    { id: 4, domain: "fakebank-login.com", date: "2025-09-04", risk: 97, status: "pending" },
    { id: 5, domain: "tracking-adsite.net", date: "2025-09-05", risk: 43, status: "in-progress", investigator: "Agent Roe" },
    { id: 6, domain: "copycat-bank.org", date: "2025-09-06", risk: 88, status: "resolved", verdict: "malicious" },
    { id: 7, domain: "freecrypto-giveaway.io", date: "2025-09-07", risk: 99, status: "pending" },
    { id: 8, domain: "socialmedia-fake.net", date: "2025-09-08", risk: 81, status: "in-progress", investigator: "Agent K" },
    { id: 9, domain: "unsecure-portal.co", date: "2025-09-09", risk: 72, status: "resolved", verdict: "malicious" },
    { id: 10, domain: "adwarehub.org", date: "2025-09-10", risk: 56, status: "pending" },
    { id: 11, domain: "suspicious-link.co", date: "2025-09-11", risk: 68, status: "in-progress" },
    { id: 12, domain: "virusdownload.com", date: "2025-09-12", risk: 91, status: "resolved", verdict: "malicious" },
  ])

  // sidebar expanded state (Sidebar will notify via onToggle)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  // status filter (internal values are lower-case to match report.status)
  const [filter, setFilter] = useState("all")
  const filteredReports = useMemo(
    () => (filter === "all" ? reports : reports.filter((r) => r.status === filter)),
    [reports, filter]
  )

  useEffect(() => {
    document.title = "B.R.A.D | Reporter Dashboard"
  }, [])

  const mapStatusForProgress = (status) => {
    if (!status) return "Pending"
    switch (status) {
      case "pending":
        return "Pending"
      case "in-progress":
        return "In Progress"
      case "resolved":
        return "Resolved"
      default:
        return status
    }
  }

  const treemapData = useMemo(() => {
    const counts = reports.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {})
    return Object.keys(counts).map((status) => ({
      name: status,
      value: counts[status],
    }))
  }, [reports])

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar */}
      <Sidebar onToggle={setSidebarExpanded} />

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 p-8 ${sidebarExpanded ? "ml-56" : "ml-16"}`}>
        {/* Greeting */}
        <UserGreeting
          username={storedUser.username}
          title="Welcome back"
          subtitle="Here you can view your report history"
        />

        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6 mb-4">
          <h2 className="text-xl font-semibold">Your Reports</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm text-[var(--muted)]">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-[var(--bg)] text-[var(--text)]"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Layout: reports left, treemap right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: report cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div key={report.id} className="card p-4">
                  <ReportFileCard report={report} />
                  <ReportProgressBar status={mapStatusForProgress(report.status)} />
                </div>
              ))
            ) : (
              <div className="text-center mt-10 col-span-full">
                <p className="text-lg">You have no reports yet.</p>
                <a href="/reporter/report" className="btn-primary mt-4 inline-block">
                  Report Your First Domain
                </a>
              </div>
            )}
          </div>

          {/* Right: treemap & summary */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-3">Report Status Overview</h3>
              <ReportsTreemap data={treemapData} />
            </div>

            <div className="card p-4">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="text-sm text-[var(--muted)] space-y-2">
                <div><strong>Total:</strong> {reports.length}</div>
                <div><strong>Pending:</strong> {reports.filter((r) => r.status === "pending").length}</div>
                <div><strong>In Progress:</strong> {reports.filter((r) => r.status === "in-progress").length}</div>
                <div><strong>Resolved:</strong> {reports.filter((r) => r.status === "resolved").length}</div>
                <div>
                  <strong>Average risk:</strong>{" "}
                  {reports.length > 0
                    ? Math.round(reports.reduce((s, r) => s + (r.risk || 0), 0) / reports.length)
                    : 0}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
