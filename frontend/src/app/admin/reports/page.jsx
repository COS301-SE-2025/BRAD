"use client"

import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import ReportFileCard from "@/components/ReportFileCard"
import { useState } from "react"

export default function ReportsPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  // Mock reports
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

  const grouped = {
    Pending: reports.filter((r) => r.status === "pending"),
    "In Progress": reports.filter((r) => r.status === "in-progress"),
    Resolved: reports.filter((r) => r.status === "resolved"),
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />

      <main
        className={`transition-all duration-300 w-full ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        {/* Greeting */}
        <UserGreeting
          username="Admin"
          title="Hello"
          subtitle="View all reports that have been submitted."
          fullWidth
        />

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 px-6">
          {Object.keys(grouped).map((status) => (
            <div key={status}>
              <h3 className="mb-4 font-semibold">{status}</h3>
              <div className="space-y-4">
                {grouped[status].map((r) => (
                  <ReportFileCard key={r.id} report={r} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
