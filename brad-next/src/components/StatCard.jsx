export default function StatCard({ title, value, color }) {
  return (
    <div className="card p-6 text-center">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
