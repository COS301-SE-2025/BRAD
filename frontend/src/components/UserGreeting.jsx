"use client"
import { UserCircle } from "lucide-react"

export default function UserGreeting({ username, title, subtitle }) {
  return (
    <div className="sticky top-0 z-10 bg-[var(--bg)] text-[var(--text)] border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}, {username}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <UserCircle size={40} className="text-brad-500" />
        <a href="/user-settings" className="text-brad-500 hover:underline">
          Settings
        </a>
      </div>
    </div>
  )
}
