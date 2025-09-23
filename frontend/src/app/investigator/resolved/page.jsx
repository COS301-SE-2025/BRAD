"use client";
import ReportFileCard from "@/components/ReportFileCard";
import Sidebar from "@/components/Sidebar";
import UserGreeting from "@/components/UserGreeting";
import { useEffect, useState } from "react";
import API from "@/lib/api/axios";

export default function ResolvedReportsPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [reports, setReports] = useState([]);
  const [storedUser, setStoredUser] = useState({ username: "Investigator", role: "investigator" });

  // Load user safely
  useEffect(() => {
    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (userData) {
      setStoredUser(JSON.parse(userData));
    }
  }, []);

  const fetchReports = async () => {
    try {
      const res = await API.get("/reports");
      const allReports = res.data || [];
      const resolved = allReports.filter(
        (r) => r.investigatorDecision);
      setReports(resolved);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />
      <main
        className={`flex-1 transition-all duration-300 min-h-screen ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        <UserGreeting
          username={storedUser.username}
          title="Hello"
          subtitle="View all reports that have been resolved and their verdicts."
        />

        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Resolved Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportFileCard
                key={report._id}
                report={report}
                view="resolved"
                loggedInUser={storedUser}
                onRefresh={fetchReports}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
