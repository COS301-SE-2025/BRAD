"use client"
import ReportFileCard from "@/components/ReportFileCard"
import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import { useState } from "react"

export default function InProgressReportsPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const reports = [
    { domain: "hackerlink.net", date: "2025-09-01", risk: 75, status: "in-progress", investigator: "Alice" },
    { domain: "unknownapp.com", date: "2025-09-02", risk: 55, status: "in-progress", investigator: "Bob" },
    { domain: "sketchyfiles.org", date: "2025-09-03", risk: 88, status: "in-progress", investigator: "Charlie" },
    { domain: "trojan-site.biz", date: "2025-09-04", risk: 92, status: "in-progress", investigator: "Alice" },
    { domain: "fakeupdate.net", date: "2025-09-05", risk: 81, status: "in-progress", investigator: "David" },
    { domain: "couponfraud.io", date: "2025-09-06", risk: 69, status: "in-progress", investigator: "Eva" },
    { domain: "clonepage.com", date: "2025-09-07", risk: 77, status: "in-progress", investigator: "Bob" },
    { domain: "trackingapp.net", date: "2025-09-08", risk: 66, status: "in-progress", investigator: "Charlie" },
    { domain: "fakeexchange.org", date: "2025-09-09", risk: 94, status: "in-progress", investigator: "Alice" },
    { domain: "suspectpayment.io", date: "2025-09-10", risk: 73, status: "in-progress", investigator: "Eva" },
    { domain: "unsecureform.biz", date: "2025-09-11", risk: 84, status: "in-progress", investigator: "David" },
    { domain: "spammyads.net", date: "2025-09-12", risk: 48, status: "in-progress", investigator: "Bob" },
    { domain: "scamcharity.org", date: "2025-09-13", risk: 85, status: "in-progress", investigator: "Charlie" },
    { domain: "hijacktool.com", date: "2025-09-14", risk: 91, status: "in-progress", investigator: "Alice" },
    { domain: "dataleak.io", date: "2025-09-15", risk: 89, status: "in-progress", investigator: "Eva" },
    { domain: "virusportal.net", date: "2025-09-16", risk: 95, status: "in-progress", investigator: "David" },
    { domain: "phishing-email.biz", date: "2025-09-17", risk: 79, status: "in-progress", investigator: "Charlie" },
    { domain: "darksite.org", date: "2025-09-18", risk: 87, status: "in-progress", investigator: "Alice" },
    { domain: "keylogger.io", date: "2025-09-19", risk: 93, status: "in-progress", investigator: "Bob" },
    { domain: "malwaremirror.com", date: "2025-09-20", risk: 97, status: "in-progress", investigator: "David" },
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
        subtitle="View all reports that are in progress and have already been claimed. Continue your investigation process."
      />

        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6">In Progress Reports</h2>
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
