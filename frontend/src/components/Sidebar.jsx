"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  ClipboardList,
  FilePlus2,
  HelpCircle,
  Settings,
  LogOut,
  Users,
  ListChecks,
} from "lucide-react"
import Link from "next/link"
import Logo from "./Logo"

export default function Sidebar({ onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()
  const [role, setRole] = useState("general") 

  useEffect(() => {
    let detectedRole = "general"

    if (pathname.startsWith("/investigator")) {
      detectedRole = "investigator"
    } else if (pathname.startsWith("/reporter")) {
      detectedRole = "general"
    } else if (pathname.startsWith("/admin")) {
      detectedRole = "admin"
    } else if (pathname.startsWith("/user-settings")) {
      const userData =
        typeof window !== "undefined" ? localStorage.getItem("user") : null
      if (userData) {
        detectedRole = JSON.parse(userData).role || "general"
      }
    }

    setRole(detectedRole)
  }, [pathname])

  // notify parent of expanded state
  useEffect(() => {
    if (onToggle) onToggle(expanded)
  }, [expanded, onToggle])

  const menus = {
    investigator: [
      { icon: <Home size={20} />, label: "Dashboard", href: "/investigator/dashboard" },
      { icon: <ClipboardList size={20} />, label: "Pending Reports", href: "/investigator/pending" },
      { icon: <ClipboardList size={20} />, label: "In Progress", href: "/investigator/in-progress" },
      { icon: <ClipboardList size={20} />, label: "Resolved", href: "/investigator/resolved" },
      { icon: <HelpCircle size={20} />, label: "Help", href: "/investigator/help" },
    ],
    general: [
      { icon: <Home size={20} />, label: "Dashboard", href: "/reporter/dashboard" },
      { icon: <FilePlus2 size={20} />, label: "Report", href: "/reporter/report" },
      { icon: <HelpCircle size={20} />, label: "Help", href: "/reporter/help" },
    ],
    admin: [
      { icon: <Home size={20} />, label: "Dashboard", href: "/admin/dashboard" },
      { icon: <Users size={20} />, label: "Manage Users", href: "/admin/users" },
      { icon: <ListChecks size={20} />, label: "View Reports", href: "/admin/reports" },
      { icon: <HelpCircle size={20} />, label: "Help", href: "/admin/help" },
    ],
  }

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
