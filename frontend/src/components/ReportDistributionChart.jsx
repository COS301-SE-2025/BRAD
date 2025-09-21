"use client"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const COLORS = ["#1b82ff", "#4aa6ff"]

export default function ReportDistributionChart({ data }) {
  return (
    <div className="card p-6">
      <h3 className="mb-4 font-semibold">Report Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            wrapperStyle={{ color: "black", fontSize: "0.875rem" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
