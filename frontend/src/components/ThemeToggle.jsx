"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <span className="text-sm font-medium">
        {isDark ? "Dark Mode" : "Light Mode"}
      </span>

      {/* Toggle Container */}
      <div
        className={`relative w-14 h-7 flex items-center rounded-full cursor-pointer transition-colors duration-300
          ${isDark ? "bg-gray-700" : "bg-gray-300"}`}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {/* Knob */}
        <div
          className={`absolute w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300
            ${isDark ? "translate-x-7" : "translate-x-1"}`}
        />
        {/* Icons */}
        <Sun className="absolute left-1 w-4 h-4 text-yellow-400" />
        <Moon className="absolute right-1 w-4 h-4 text-blue-500" />
      </div>
    </div>
  )
}
