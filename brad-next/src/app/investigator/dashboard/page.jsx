"use client"
import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import StatCard from "@/components/StatCard"
import ReportDistributionChart from "@/components/ReportDistributionChart"
import ReportsBarChart from "@/components/ReportsBarChart"
import ReportsTreemap from "@/components/ReportsTreemap"

export default function InvestigatorDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const stats = {
    totalReports: 1200,
    malicious: 800,
    safe: 400,
  }

  const distribution = [
    { name: "Malicious", value: stats.malicious },
    { name: "Safe", value: stats.safe },
  ]

  const treemapData = [
    { name: "Pending", value: 150 },
    { name: "In Progress", value: 200 },
    { name: "Resolved", value: 850 },
  ]

  return (
    <div className="flex">
      <Sidebar onToggle={setSidebarExpanded} />
      <main
        className={`flex-1 p-8 bg-[var(--bg)] text-[var(--text)] transition-all duration-300 ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        <UserGreeting username="InvestigatorX" />

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

        <div className="mt-6">
          <ReportsBarChart />
        </div>
      </main>
    </div>
  )
}
