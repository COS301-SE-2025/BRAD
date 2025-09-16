"use client"
import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function ReportsBarChart() {
  const [period, setPeriod] = useState("daily")

  const dataSets = {
    daily: [
      { label: "Mon", reports: 30 },
      { label: "Tue", reports: 50 },
      { label: "Wed", reports: 70 },
      { label: "Thu", reports: 45 },
      { label: "Fri", reports: 90 },
    ],
    weekly: [
      { label: "Week 1", reports: 300 },
      { label: "Week 2", reports: 450 },
      { label: "Week 3", reports: 500 },
      { label: "Week 4", reports: 400 },
    ],
    monthly: [
      { label: "Jan", reports: 1200 },
      { label: "Feb", reports: 950 },
      { label: "Mar", reports: 1400 },
      { label: "Apr", reports: 1100 },
    ],
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Reports Over Time</h3>
        <div className="space-x-2">
          <button
            onClick={() => setPeriod("daily")}
            className={`px-3 py-1 rounded ${period === "daily" ? "bg-brad-500 text-white" : "bg-gray-200"}`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1 rounded ${period === "weekly" ? "bg-brad-500 text-white" : "bg-gray-200"}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1 rounded ${period === "monthly" ? "bg-brad-500 text-white" : "bg-gray-200"}`}
          >
            Monthly
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dataSets[period]}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="reports" fill="#1b82ff" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
