"use client"
import { useState, useEffect } from "react"
import { Home, ClipboardList, Clock, CheckCircle, HelpCircle, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import Logo from "./Logo"

export default function Sidebar({ onToggle }) {
  const [expanded, setExpanded] = useState(false)

  // Notify parent of expanded state
  useEffect(() => {
    if (onToggle) onToggle(expanded)
  }, [expanded, onToggle])

  const menuItems = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/investigator/dashboard" },
    { icon: <ClipboardList size={20} />, label: "Pending Reports", href: "/investigator/pending" },
    { icon: <Clock size={20} />, label: "In Progress", href: "/investigator/in-progress" },
    { icon: <CheckCircle size={20} />, label: "Resolved", href: "/investigator/resolved" },
    { icon: <HelpCircle size={20} />, label: "Help", href: "/help" },
    { icon: <Settings size={20} />, label: "Settings", href: "/user-settings" },
    { icon: <LogOut size={20} />, label: "Log out", href: "/login" },
  ]

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`fixed top-0 left-0 h-screen bg-brad-800 text-white flex flex-col transition-all duration-300 z-50 ${
        expanded ? "w-56" : "w-16"
      }`}
    >
      <Logo expanded={expanded} size={32} />
      <nav className="flex-1 mt-6">
        {menuItems.map((item, idx) => (
          <Link key={idx} href={item.href}>
            <div className="flex items-center px-4 py-3 hover:bg-brad-700 cursor-pointer">
              {item.icon}
              {expanded && <span className="ml-3">{item.label}</span>}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  )
}
