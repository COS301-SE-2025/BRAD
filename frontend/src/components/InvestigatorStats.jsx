"use client"

export default function InvestigatorStats({ investigators }) {
  return (
    <div className="card p-6">
      <h3 className="mb-4 font-semibold">Investigator Stats</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Name</th>
            <th className="text-left py-2">Claimed</th>
            <th className="text-left py-2">Malicious %</th>
            <th className="text-left py-2">Safe %</th>
            <th className="text-left py-2">Avg Analysis Time</th>
          </tr>
        </thead>
        <tbody>
          {investigators.map((inv, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2">{inv.name}</td>
              <td className="py-2">{inv.resolved}</td>
              <td className="py-2">{inv.malicious}%</td>
              <td className="py-2">{inv.safe}%</td>
              <td className="py-2">{inv.avgTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
