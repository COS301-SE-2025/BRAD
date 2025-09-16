import { UserCircle } from "lucide-react"

export default function UserGreeting({ username }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {username} 👋</h1>
        <p className="text-muted-foreground">Here are the latest insights on your reports.</p>
      </div>
      <div className="flex items-center gap-3">
        <UserCircle size={40} className="text-brad-500" />
        <a href="/settings" className="text-brad-500 hover:underline">
          Settings
        </a>
      </div>
    </div>
  )
}
