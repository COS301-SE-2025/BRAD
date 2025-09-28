"use client"

import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import ReportsTreemap from "@/components/ReportsTreemap"
import ReportDistributionChart from "@/components/ReportDistributionChart"
import ReportsBarChart from "@/components/ReportsBarChart"
import TopDomains from "@/components/TopDomains"
import StatCard from "@/components/StatCard"
import InvestigatorStats from "@/components/InvestigatorStats"
import { useEffect, useState } from "react"

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
  getAvgBotAnalysisTime,
  getAvgInvestigatorTime,
  getAvgResolutionTime,
  getInvestigatorStats,
} from "@/lib/api/stats"

export default function AdminDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [statCards, setStatCards] = useState([])
  const [treemapData, setTreemapData] = useState([])
  const [distributionData, setDistributionData] = useState([])
  const [barChartData, setBarChartData] = useState([])
  const [timeFrame, setTimeFrame] = useState("Monthly")
  const [topDomains, setTopDomains] = useState([])
  const [investigatorStats, setInvestigatorStats] = useState([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          total, malicious, safe, domains,
          pending, inProgress, resolved,
          avgBot, avgInvestigator, avgResolution,
          invStats
        ] = await Promise.all([
          getTotalReports(),
          getMaliciousReports(),
          getSafeReports(),
          getRepeatedDomains(),
          getPendingReportsCount(),
          getInProgressReportsCount(),
          getResolvedReportsCount(),
          getAvgBotAnalysisTime(),
          getAvgInvestigatorTime(),
          getAvgResolutionTime(),
          getInvestigatorStats(),
        ])

        setStatCards([
          { title: "Total Reports", value: total || 0 },
          { title: "Avg Bot Analysis Time", value: avgBot || "N/A" },
          { title: "Avg Investigator Analysis Time", value: avgInvestigator || "N/A" },
          { title: "Avg Resolution Time", value: avgResolution || "N/A" },
        ])

        setTreemapData([
          { name: "Pending", value: pending || 0 },
          { name: "In Progress", value: inProgress || 0 },
          { name: "Resolved", value: resolved || 0 },
        ])

        setDistributionData([
          { name: "Malicious", value: malicious || 0 },
          { name: "Safe", value: safe || 0 },
        ])

        setTopDomains(domains || [])
        setInvestigatorStats(invStats || [])
      } catch (err) {
        console.error("Error fetching admin dashboard stats:", err)
      }
    }

    fetchStats()
  }, [])

  // === Fetch Reports over Time for Bar Chart ===
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

        setBarChartData(formatted)
      } catch (err) {
        console.error("Error fetching reports over time:", err)
      }
    }

    fetchBarData()
  }, [timeFrame])

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />

      <main
        className={`transition-all duration-300 w-full ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
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
          <ReportsBarChart
            data={barChartData}
            timeFrame={timeFrame}
            onTimeFrameChange={setTimeFrame}
          />
        </div>

        <div className="mt-6 px-6">
          <InvestigatorStats investigators={investigatorStats} />
        </div>

        <div className="mt-6 px-6">
          <TopDomains domains={topDomains} />
        </div>
      </main>
    </div>
  )
}
