"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  ClipboardList,
  Clock,
  CheckCircle,
  FilePlus2,
  HelpCircle,
  Settings,
  LogOut,
  Users,
} from "lucide-react"
import Link from "next/link"
import Logo from "./Logo"

export default function Sidebar({ onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()
  const [role, setRole] = useState("reporter") // default fallback

  // Derive role from URL
  useEffect(() => {
    if (pathname.startsWith("/investigator")) {
      setRole("investigator")
    } else if (pathname.startsWith("/reporter")) {
      setRole("reporter")
    } else if (pathname.startsWith("/admin")) {
      setRole("admin")
    }
  }, [pathname])

  // Notify parent of expanded state
  useEffect(() => {
    if (onToggle) onToggle(expanded)
  }, [expanded, onToggle])

  // Role-specific menus
  const menus = {
    investigator: [
      { icon: <Home size={20} />, label: "Dashboard", href: "/investigator/dashboard" },
      { icon: <ClipboardList size={20} />, label: "Pending Reports", href: "/investigator/pending" },
      { icon: <Clock size={20} />, label: "In Progress", href: "/investigator/in-progress" },
      { icon: <CheckCircle size={20} />, label: "Resolved", href: "/investigator/resolved" },
      { icon: <HelpCircle size={20} />, label: "Help", href: "/investigator/help" },

    ],
    reporter: [
      { icon: <Home size={20} />, label: "Dashboard", href: "/reporter/dashboard" },
      { icon: <FilePlus2 size={20} />, label: "Report", href: "/reporter/report" },
      { icon: <HelpCircle size={20} />, label: "Help", href: "/reporter/help" },

    ],
    admin: [
      { icon: <Home size={20} />, label: "Dashboard", href: "/admin/dashboard" },
      { icon: <Users size={20} />, label: "Manage Users", href: "/admin/users" },
    ],
  }

  // Shared menu items
  const commonItems = [
    { icon: <Settings size={20} />, label: "Settings", href: "/user-settings" },
    { icon: <LogOut size={20} />, label: "Log out", href: "/login" },
  ]

  const menuItems = [...(menus[role] || []), ...commonItems]

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
            <div
              className={`flex items-center px-4 py-3 hover:bg-brad-700 cursor-pointer ${
                pathname === item.href ? "bg-brad-700" : ""
              }`}
            >
              {item.icon}
              {expanded && <span className="ml-3">{item.label}</span>}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  )
}
