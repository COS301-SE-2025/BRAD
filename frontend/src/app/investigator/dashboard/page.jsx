"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import StatCard from "@/components/StatCard"
import ReportDistributionChart from "@/components/ReportDistributionChart"
import ReportsBarChart from "@/components/ReportsBarChart"
import ReportsTreemap from "@/components/ReportsTreemap"
import TopDomains from "@/components/TopDomains"

import {
  getTotalReports,
  getMaliciousReports,
  getSafeReports,
  getRepeatedDomains,
  getPendingReportsCount,
  getInProgressReportsCount,
  getResolvedReportsCount,
  getReportsByYear,
  getReportsByWeek,
  getReportsByDay,
} from "@/lib/api/stats"

export default function InvestigatorDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const storedUser = JSON.parse(localStorage.getItem("user")) || { username: "Investigator" }

  // Dashboard states
  const [summary, setSummary] = useState({
    total: 0,
    malicious: 0,
    safe: 0,
    topDomains: [],
    open: 0,
    closed: 0,
    pendingEvidence: 0,
  })

  const [distribution, setDistribution] = useState([])
  const [barData, setBarData] = useState([])
  const [timeFrame, setTimeFrame] = useState("Monthly")

  // === Fetch Stats ===
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [total, malicious, safe, domains, open, closed, pending] =
          await Promise.all([
            getTotalReports(),
            getMaliciousReports(),
            getSafeReports(),
            getRepeatedDomains(),
            getPendingReportsCount(),
            getInProgressReportsCount(),
            getResolvedReportsCount(),
          ])

        setSummary({
          total: total || 0,
          malicious: malicious || 0,
          safe: safe || 0,
          topDomains: domains || [],
          open: open || 0,
          closed: closed || 0,
          pendingEvidence: pending || 0,
        })

        setDistribution([
          { name: "Malicious Reports", value: malicious || 0 },
          { name: "Safe Reports", value: safe || 0 },
        ])
      } catch (err) {
        console.error("Error fetching investigator stats:", err)
      }
    }

    fetchStats()
  }, [])

  // === Fetch Reports over Time ===
  useEffect(() => {
    const fetchBarData = async () => {
      try {
        let data
        if (timeFrame === "Weekly") data = await getReportsByWeek()
        else if (timeFrame === "Daily") data = await getReportsByDay()
        else data = await getReportsByYear()

        let formatted
        if (timeFrame === "Monthly") {
          const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
          formatted = data.map((d) => ({
            label: months[d.month - 1],
            cases: d.count,
          }))
        } else if (timeFrame === "Weekly") {
          formatted = data.map((d) => ({
            label: `Week ${d.week}`,
            cases: d.count,
          }))
        } else {
          formatted = data.map((d) => ({
            label: `${d.day}`,
            cases: d.count,
          }))
        }

        setBarData(formatted)
      } catch (err) {
        console.error("Error fetching reports over time:", err)
      }
    }

    fetchBarData()
  }, [timeFrame])

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar */}
      <Sidebar onToggle={setSidebarExpanded} />

      {/* Main content */}
      <main
        className={`flex-1 bg-[var(--bg)] text-[var(--text)] transition-all duration-300 min-h-screen ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        {/* Greeting */}
        <UserGreeting
          username={storedUser.username}
          title="Welcome back"
          subtitle="Here are the latest insights on your reports."
        />

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard title="Total Reports" value={summary.total} color="text-brad-500" />
            <StatCard title="Malicious Reports" value={summary.malicious} color="text-red-500" />
            <StatCard title="Safe Reports" value={summary.safe} color="text-green-500" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportDistributionChart data={distribution} />
            <ReportsTreemap
              data={[
                { name: "Pending", value: summary.open },
                { name: "In Progress", value: summary.closed },
                { name: "Resolved", value: summary.pendingEvidence },
              ]}
            />
          </div>

          {/* Reports over time & Top Domains */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <ReportsBarChart data={barData} timeFrame={timeFrame} onTimeFrameChange={setTimeFrame} />
            <TopDomains domains={summary.topDomains} />
          </div>
        </div>
      </main>
    </div>
  )
}
