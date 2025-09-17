"use client"
import ReportFileCard from "@/components/ReportFileCard"
import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import { useState } from "react"

export default function ResolvedReportsPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const reports = [
    { domain: "badsite.io", date: "2025-09-01", risk: 92, status: "resolved", verdict: "malicious" },
    { domain: "legitdomain.org", date: "2025-09-02", risk: 10, status: "resolved", verdict: "benign" },
    { domain: "dangerousfiles.net", date: "2025-09-03", risk: 78, status: "resolved", verdict: "malicious" },
    { domain: "trustedapp.com", date: "2025-09-04", risk: 15, status: "resolved", verdict: "benign" },
    { domain: "fakeportal.biz", date: "2025-09-05", risk: 88, status: "resolved", verdict: "malicious" },
    { domain: "shopping-safe.io", date: "2025-09-06", risk: 22, status: "resolved", verdict: "benign" },
    { domain: "exploit-kit.net", date: "2025-09-07", risk: 96, status: "resolved", verdict: "malicious" },
    { domain: "securedomain.org", date: "2025-09-08", risk: 19, status: "resolved", verdict: "benign" },
    { domain: "spysite.co", date: "2025-09-09", risk: 91, status: "resolved", verdict: "malicious" },
    { domain: "helpfulapp.com", date: "2025-09-10", risk: 14, status: "resolved", verdict: "benign" },
    { domain: "phishingscam.io", date: "2025-09-11", risk: 94, status: "resolved", verdict: "malicious" },
    { domain: "authenticstore.org", date: "2025-09-12", risk: 18, status: "resolved", verdict: "benign" },
    { domain: "infectedlink.net", date: "2025-09-13", risk: 82, status: "resolved", verdict: "malicious" },
    { domain: "verifiedapp.biz", date: "2025-09-14", risk: 25, status: "resolved", verdict: "benign" },
    { domain: "ransomwaredrop.io", date: "2025-09-15", risk: 97, status: "resolved", verdict: "malicious" },
    { domain: "securedportal.com", date: "2025-09-16", risk: 12, status: "resolved", verdict: "benign" },
    { domain: "trojaninjector.net", date: "2025-09-17", risk: 90, status: "resolved", verdict: "malicious" },
    { domain: "whitelisted.org", date: "2025-09-18", risk: 11, status: "resolved", verdict: "benign" },
    { domain: "stealsdata.biz", date: "2025-09-19", risk: 93, status: "resolved", verdict: "malicious" },
    { domain: "cleanapp.io", date: "2025-09-20", risk: 16, status: "resolved", verdict: "benign" },
  ]

  return (
    <div className="flex">
      <Sidebar onToggle={setSidebarExpanded} />
      <main
        className={`flex-1 bg-[var(--bg)] text-[var(--text)] transition-all duration-300 min-h-screen ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        <UserGreeting
        username="InvestigatorX"
        title="Hello"
        subtitle="View all reports that have been resolved and their verdicts."
        />

        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Resolved Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report, i) => (
              <ReportFileCard key={i} report={report} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
