"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import UserGreeting from "@/components/UserGreeting";
import ReportForm from "@/components/ReportForm";
import ReportStepsCards from "@/components/ReportStepsCards";
import Notification from "@/components/Notification";
import { Menu } from "lucide-react";

export default function ReportPage() {
  const [storedUser, setStoredUser] = useState({ username: "Reporter" });
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setStoredUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
    document.title = "B.R.A.D | Report URL";
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)] overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar onToggle={setSidebarExpanded} />
      </div>

      {/* Mobile burger button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 bg-brad-700 text-white rounded-md shadow-md"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Sidebar Modal */}
      {sidebarOpen && <MobileSidebar onClose={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div
        className={`transition-all duration-300 flex-1 p-4 md:p-8 mt-12 md:mt-0 ${
          sidebarExpanded ? "md:ml-56" : "md:ml-16"
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

        {/* Report form */}
        <div className="mt-6 w-full">
          <ReportForm setNotification={setNotification} />
        </div>

        {/* Steps cards */}
        <div className="mt-8">
          <ReportStepsCards />
        </div>
      </div>
    </div>
  );
}
