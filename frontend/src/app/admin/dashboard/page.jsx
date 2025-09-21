"use client"

import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import ReportsTreemap from "@/components/ReportsTreemap"
import ReportDistributionChart from "@/components/ReportDistributionChart"
import ReportsBarChart from "@/components/ReportsBarChart"
import TopDomains from "@/components/TopDomains"
import StatCard from "@/components/StatCard"
import InvestigatorStats from "@/components/InvestigatorStats"
import { useState } from "react"

export default function AdminDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  // 🔹 Mock data
  const treemapData = [
    { name: "Pending", value: 40 },
    { name: "In Progress", value: 25 },
    { name: "Resolved", value: 70 },
  ]

  const distributionData = [
    { name: "Malicious", value: 55 },
    { name: "Safe", value: 45 },
  ]

  const barChartData = [
    { name: "Jan", reports: 30 },
    { name: "Feb", reports: 45 },
    { name: "Mar", reports: 60 },
    { name: "Apr", reports: 50 },
    { name: "May", reports: 70 },
  ]

  const topDomains = [
    { domain: "malicious-site.com", count: 45 },
    { domain: "phishing-link.net", count: 32 },
    { domain: "unsafe-download.org", count: 20 },
    { domain: "fake-login.io", count: 15 },
  ]

  const statCards = [
    { title: "Total Reports", value: "235", color: "text-blue-500" },
    { title: "Avg Bot Analysis Time", value: "3s", color: "text-green-500" },
    { title: "Avg Investigator Analysis Time", value: "12m", color: "text-yellow-500" },
    { title: "Avg Resolution Time", value: "1h 30m", color: "text-red-500" },
  ]

  const investigatorStats = [
    { name: "Investigator A", resolved: 50, malicious: 60, safe: 40, avgTime: "10m" },
    { name: "Investigator B", resolved: 35, malicious: 40, safe: 60, avgTime: "14m" },
    { name: "Investigator C", resolved: 20, malicious: 50, safe: 50, avgTime: "11m" },
  ]

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />

      <main
        className={`transition-all duration-300 w-full ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        {/* Greeting (full width + sticky top) */}
        <UserGreeting
          username="Admin"
          title="Welcome back"
          subtitle="Here are the latest system insights and investigator stats."
          fullWidth
        />

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-6 px-6">
          {statCards.map((stat, i) => (
            <StatCard
              key={i}
              title={stat.title}
              value={stat.value}
              color={stat.color}
            />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">
          <ReportsTreemap data={treemapData} />
          <ReportDistributionChart data={distributionData} />
        </div>

        <div className="mt-6 px-6">
          <ReportsBarChart data={barChartData} />
        </div>

        {/* Investigator Stats */}
        <div className="mt-6 px-6">
          <InvestigatorStats investigators={investigatorStats} />
        </div>

        {/* Top Domains */}
        <div className="mt-6 px-6">
          <TopDomains domains={topDomains} />
        </div>
      </main>
    </div>
  )
}
