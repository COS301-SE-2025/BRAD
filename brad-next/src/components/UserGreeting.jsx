import { UserCircle } from "lucide-react"

export default function UserGreeting({ username }) {
  return (
    <div className="sticky top-0 z-40 bg-[var(--bg)] flex justify-between items-center mb-6 py-4 px-2 border-b border-gray-200 dark:border-gray-700">
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
