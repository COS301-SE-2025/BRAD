"use client"
import { Treemap, ResponsiveContainer } from "recharts"

const COLORS = ["#fbbf24", "#3b82f6", "#10b981"] // pending, in-progress, resolved

export default function ReportsTreemap({ data }) {
  return (
    <div className="card p-6">
      <h3 className="mb-4 font-semibold">Report Status</h3>
      <ResponsiveContainer width="100%" height={250}>
      <Treemap
        data={data}
        dataKey="value"
        nameKey="name"
        stroke="#000000ff"
        fill="#8884d8"
        isAnimationActive={false} // disable animation
        content={({ x, y, width, height, name, value, index }) => {
          if (width <= 0 || height <= 0) return null;
          return (
            <g>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{ fill: COLORS[index % COLORS.length], stroke: "#fff" }}
              />
              <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                fill="#fff"
                fontSize={12}
                dy={4}
              >
                {name} ({value})
              </text>
            </g>
          );
        }}
      />
    </ResponsiveContainer>

    </div>
  )
}
