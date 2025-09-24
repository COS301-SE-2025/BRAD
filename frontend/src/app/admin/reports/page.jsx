"use client"

import Sidebar from "@/components/Sidebar"
import { useEffect, useState, useMemo } from "react"
import UserGreeting from "@/components/UserGreeting"
import ReportFileCard from "@/components/ReportFileCard"
import API from "@/lib/api/axios"
import Notification from "@/components/Notification"

export default function ReportsPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [storedUser, setStoredUser] = useState({ username: "Admin" })
  const [reports, setReports] = useState([])
  const [notification, setNotification] = useState(null)

  // Load user from localStorage (client only)
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        setStoredUser(JSON.parse(userData))
      } catch (e) {}
    }
  }, [])

  // Fetch reports
  const fetchReports = async () => {
    if (!storedUser._id) return
    try {
      const res = await API.get("/reports", { params: { submittedBy: storedUser._id } })
      setReports(res.data || [])
    } catch (err) {
      console.error("Error fetching reports", err)
      setNotification({ type: "error", title: "Error", message: "Failed to fetch reports." })
    }
  }

  useEffect(() => {
    if (storedUser._id) fetchReports()
    document.title = "B.R.A.D | Reports"
    const interval = setInterval(() => {
      if (storedUser._id) fetchReports()
    }, 5000)
    return () => clearInterval(interval)
  }, [storedUser])

  // Group reports by status
  const groupedReports = useMemo(() => {
    return {
      Pending: reports.filter(r => !r.investigatorDecision && r.analysisStatus === "pending"),
      "In Progress": reports.filter(r => r.analysisStatus === "in-progress"),
      Resolved: reports.filter(r => r.investigatorDecision),
    }
  }, [reports])

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />

      <main className={`transition-all duration-300 w-full ${sidebarExpanded ? "ml-56" : "ml-16"}`}>
        <UserGreeting
          username={storedUser.username}
          title="Hello"
          subtitle="View all reports that have been submitted."
          fullWidth
        />

        {notification && (
          <Notification
            type={notification.type}
            title={notification.title}
            children={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 px-6">
          {Object.keys(groupedReports).map(status => (
            <div key={status}>
              <h3 className="mb-4 font-semibold">{status}</h3>
              <div className="space-y-4">
                {groupedReports[status].length > 0 ? (
                  groupedReports[status].map(report => (
                    <ReportFileCard key={report._id} report={report} />
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">No {status.toLowerCase()} reports</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
