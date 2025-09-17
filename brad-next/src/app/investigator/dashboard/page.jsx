"use client"
import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import StatCard from "@/components/StatCard"
import ReportDistributionChart from "@/components/ReportDistributionChart"
import ReportsBarChart from "@/components/ReportsBarChart"
import ReportsTreemap from "@/components/ReportsTreemap"
import TopDomains from "@/components/TopDomains"

export default function InvestigatorDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  // Mock data for now (will hook to API later)
  const stats = { totalReports: 1200, malicious: 800, safe: 400 }
  const distribution = [
    { name: "Malicious", value: stats.malicious },
    { name: "Safe", value: stats.safe },
  ]
  const treemapData = [
    { name: "Pending", value: 150 },
    { name: "In Progress", value: 200 },
    { name: "Resolved", value: 850 },
  ]
  const topDomains = [
    { domain: "malicious-site.com", count: 45 },
    { domain: "phishing-link.net", count: 32 },
    { domain: "unsafe-download.org", count: 20 },
    { domain: "fake-login.io", count: 15 },
  ]

  return (
    <div className="flex">
      {/* Sidebar stays fixed on the left */}
      <Sidebar onToggle={setSidebarExpanded} />

      {/* Main content */}
      <main
        className={`flex-1 bg-[var(--bg)] text-[var(--text)] transition-all duration-300 min-h-screen ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        {/* Sticky greeting header */}
        <UserGreeting username="InvestigatorX" />

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard title="Total Reports" value={stats.totalReports} color="text-brad-500" />
            <StatCard title="Malicious Reports" value={stats.malicious} color="text-red-500" />
            <StatCard title="Safe Reports" value={stats.safe} color="text-green-500" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportDistributionChart data={distribution} />
            <ReportsTreemap data={treemapData} />
          </div>

          {/* Reports over time & Top Domains */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <ReportsBarChart />
            <TopDomains domains={topDomains} />
          </div>
        </div>
      </main>
    </div>
  )
}
