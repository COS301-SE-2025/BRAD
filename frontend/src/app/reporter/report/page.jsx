"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import ReportForm from "@/components/ReportForm"
import ReportStepsCarousel from "@/components/ReportStepsCarousel"
import Notification from "@/components/Notification";

export default function ReportPage() {
  const storedUser =
    JSON.parse(localStorage.getItem("user")) || { username: "Reporter" }

  // track sidebar expanded state (ReporterSidebar calls onToggle)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    document.title = "B.R.A.D | Report URL"
  }, [])

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar - will notify parent via onToggle when hovered */}
      <Sidebar onToggle={setSidebarExpanded} />

      {/* Main content - shifts right depending on sidebar state */}
      <div
        className={`flex-1 transition-all duration-300 p-8 ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        {/* Sticky, full-width greeting (same pattern as dashboard) */}
        <UserGreeting
          username={storedUser.username}
          title="Hello"
          subtitle="Report a URL and add optional evidence to help our investigators with their analysis."
        />

        {notification && (
          <Notification
            type={notification.type}
            title={notification.title}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Notification>
        )}


        {/* Layout: left = form, right = steps (matches dashboard layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left column: the report form (spans 2/3 on large screens) */}
          <div className="lg:col-span-2">
            {/* keep the form component full-width — it already provides its card-like styling */}
            <ReportForm setNotification={setNotification} />
          </div>

          {/* Right column: steps / help carousel */}
          <aside className="lg:col-span-1">
            <ReportStepsCarousel />
          </aside>
        </div>
      </div>
    </div>
  )
}
