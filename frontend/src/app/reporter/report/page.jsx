"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UserGreeting from "@/components/UserGreeting";
import ReportForm from "@/components/ReportForm";
import ReportStepsCards from "@/components/ReportStepsCards";
import Notification from "@/components/Notification";

export default function ReportPage() {
  const storedUser =
    JSON.parse(localStorage.getItem("user")) || { username: "Reporter" };

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    document.title = "B.R.A.D | Report URL";
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar */}
      <Sidebar onToggle={setSidebarExpanded} />

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 p-8 ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        {/* Greeting */}
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

        {/* Report form spanning full width */}
        <div className="mt-6 w-full">
          <ReportForm setNotification={setNotification} />
        </div>

        {/* Steps cards below the form */}
        <div className="mt-8">
          <ReportStepsCards />
        </div>
      </div>
    </div>
  );
}
