"use client"
import ReportFileCard from "@/components/ReportFileCard"
import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import { useState } from "react"

export default function PendingReportsPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  // Mock reports
   const reports = [
    { domain: "phishingsite.com", date: "2025-09-01", risk: 85, status: "pending" },
    { domain: "safesite.org", date: "2025-09-02", risk: 20, status: "pending" },
    { domain: "weirdlink.net", date: "2025-09-03", risk: 65, status: "pending" },
    { domain: "dodgyapp.io", date: "2025-09-04", risk: 90, status: "pending" },
    { domain: "fakebank-login.com", date: "2025-09-05", risk: 95, status: "pending" },
    { domain: "malware-dropper.net", date: "2025-09-06", risk: 78, status: "pending" },
    { domain: "adwarehub.org", date: "2025-09-07", risk: 55, status: "pending" },
    { domain: "socialmedia-fake.net", date: "2025-09-08", risk: 82, status: "pending" },
    { domain: "freecrypto-giveaway.io", date: "2025-09-09", risk: 99, status: "pending" },
    { domain: "suspicious-link.co", date: "2025-09-10", risk: 71, status: "pending" },
    { domain: "scamoffer.biz", date: "2025-09-11", risk: 65, status: "pending" },
    { domain: "tracking-adsite.net", date: "2025-09-12", risk: 44, status: "pending" },
    { domain: "virusdownload.com", date: "2025-09-13", risk: 88, status: "pending" },
    { domain: "clonepay-service.org", date: "2025-09-14", risk: 91, status: "pending" },
    { domain: "unsecure-portal.co", date: "2025-09-15", risk: 73, status: "pending" },
    { domain: "fakecharity.net", date: "2025-09-16", risk: 80, status: "pending" },
    { domain: "stealfunds.biz", date: "2025-09-17", risk: 93, status: "pending" },
    { domain: "hijackapp.io", date: "2025-09-18", risk: 76, status: "pending" },
    { domain: "copycat-bank.org", date: "2025-09-19", risk: 89, status: "pending" },
    { domain: "spamgenerator.net", date: "2025-09-20", risk: 54, status: "pending" },
  ]
  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />
      <main
        className={`flex-1 bg-[var(--bg)] text-[var(--text)] transition-all duration-300 min-h-screen ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        <UserGreeting
        username="InvestigatorX"
        title="Hello"
        subtitle="View all reports pending and claim a report to start investigating."
        />

        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Pending Reports</h2>
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
