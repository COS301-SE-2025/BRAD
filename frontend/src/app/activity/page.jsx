"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import ThemeToggle from "@/components/ThemeToggle"
import API from "@/lib/api/axios"

export default function ActivityLogsPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  useEffect(() => {
    document.title = "B.R.A.D | Activity Logs"
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await API.get("/activity/my-activities")
      setActivities(response.data)
    } catch (err) {
      console.error("Failed to fetch activities:", err)
      setError("Failed to load activity logs.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar */}
      <Sidebar onToggle={setSidebarExpanded} />

      {/* Main content */}
      <div
        className={`flex-1 p-8 transition-all duration-300 ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        {/* Top bar */}
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>

        <div className="card p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">My Activity Logs</h2>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-brad-500">{error}</p>
          ) : activities.length === 0 ? (
            <p>No activity logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Action</th>
                    <th className="border px-4 py-2 text-left">Date / Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{act.action}</td>
                      <td className="border px-4 py-2">{act.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
