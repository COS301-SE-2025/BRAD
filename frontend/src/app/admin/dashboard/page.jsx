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
  const [topDomains, setTopDomains] = useState([])
  const [investigatorStats, setInvestigatorStats] = useState([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          total, malicious, safe, domains,
          pending, inProgress, resolved, reportsByYear,
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
          getReportsByYear(),
          getAvgBotAnalysisTime(),
          getAvgInvestigatorTime(),
          getAvgResolutionTime(),
          getInvestigatorStats(),
        ])

        setStatCards([
          { title: "Total Reports", value: total },
          { title: "Avg Bot Analysis Time", value: avgBot },
          { title: "Avg Investigator Analysis Time", value: avgInvestigator },
          { title: "Avg Resolution Time", value: avgResolution },
        ])

        setTreemapData([
          { name: "Pending", value: pending },
          { name: "In Progress", value: inProgress },
          { name: "Resolved", value: resolved },
        ])

        setDistributionData([
          { name: "Malicious", value: malicious },
          { name: "Safe", value: safe },
        ])

        // setBarChartData(
        //   reportsByYear.map((d, i) => ({ name: `Month ${d.month}`, reports: d.count }))
        // )

        

        setTopDomains(domains)
        setInvestigatorStats(invStats)
      } catch (err) {
        console.error("Error fetching admin dashboard stats:", err)
      }
    }

    fetchStats()
  }, [])
  
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
