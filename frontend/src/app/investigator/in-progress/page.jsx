"use client";
import ReportFileCard from "@/components/ReportFileCard";
import Sidebar from "@/components/Sidebar";
import UserGreeting from "@/components/UserGreeting";
import Notification from "@/components/Notification";
import { useEffect, useState } from "react";
import API from "@/lib/api/axios";

export default function InProgressReportsPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [reports, setReports] = useState([]);
  const [storedUser, setStoredUser] = useState({ username: "Investigator", role: "investigator" });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (userData) setStoredUser(JSON.parse(userData));
  }, []);

  const fetchReports = async () => {
    try {
      const res = await API.get("/reports");
      const allReports = res.data || [];
      const inProgress = allReports.filter(
        (r) => r.reviewedBy && !r.investigatorDecision && r.analysisStatus === "in-progress"
      );
      setReports(inProgress);
    } catch (err) {
      setNotification({ type: "error", title: "Error", message: "Failed to fetch reports." });
      console.error("Error fetching reports:", err);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      document.title = "B.R.A.D | Investigator In-Progress Reports"
    }, [])

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />
      <main className={`flex-1 transition-all duration-300 min-h-screen ${sidebarExpanded ? "ml-56" : "ml-16"}`}>
        <UserGreeting
          username={storedUser.username}
          title="Hello"
          subtitle="View all reports that are in progress and have already been claimed. Continue your investigation process."
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

        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6">In Progress Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportFileCard
                key={report._id}
                report={report}
                view="in-progress"
                loggedInUser={storedUser}
                onRefresh={fetchReports}
                setNotification={setNotification}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
