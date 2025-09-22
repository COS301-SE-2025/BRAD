"use client"

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

export default function ReportsBarChart({ data, timeFrame, onTimeFrameChange }) {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Reports Over Time</h3>

        {/* Dropdown for timeframe selection */}
        <select
          value={timeFrame}
          onChange={(e) => onTimeFrameChange(e.target.value)}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brad-400"
        >
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
