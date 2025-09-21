"use client"
import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Helper functions to generate mock data
const generateMonthlyData = () => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return months.map((m) => ({
    label: m,
    cases: Math.floor(Math.random() * 1500) + 200, // mock values
  }))
}

const generateWeeklyData = () => {
  return Array.from({ length: 4 }, (_, i) => ({
    label: `Week ${i + 1}`,
    cases: Math.floor(Math.random() * 500) + 100,
  }))
}

const generateDailyData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    cases: Math.floor(Math.random() * 100) + 10,
  }))
}

export default function ReportsBarChart() {
  const [period, setPeriod] = useState("Monthly")

  const dataSets = {
    Monthly: generateMonthlyData(),
    Weekly: generateWeeklyData(),
    Daily: generateDailyData(),
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Reports Over Time</h3>

        {/* Dropdown */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brad-400"
        >
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dataSets[period]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /> {/* adds grid */}
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="cases" fill="#4aa6ff" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
