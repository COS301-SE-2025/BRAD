"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UserGreeting from "@/components/UserGreeting";
import Notification from "@/components/Notification";
import ReportAnalysisView from "@/components/ReportAnalysisView";
import API from "@/lib/api/axios";
import { useParams } from "next/navigation";

export default function InProgressReportPage() {
  const { id } = useParams();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [storedUser, setStoredUser] = useState({ username: "Investigator", role: "investigator" });
  const [notification, setNotification] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (userData) setStoredUser(JSON.parse(userData));
  }, []);

  // Use the exact same fetching logic as the list page: fetch /reports and filter client-side
  const fetchReport = async () => {
    try {
      const res = await API.get("/reports");
      const allReports = res.data || [];
      const inProgress = allReports.filter((r) => r.reviewedBy && !r.investigatorDecision && r.analysisStatus === "in-progress");
      const found = inProgress.find((r) => String(r._id) === String(id));
      if (!found) {
        setNotification({ type: "error", title: "Not Found", message: "Report not found or not in-progress." });
      } else {
        setReport(found);
      }
    } catch (err) {
      setNotification({ type: "error", title: "Error", message: "Failed to fetch report." });
      console.error("Error fetching report:", err);
    }
  };

  useEffect(() => {
    if (id) fetchReport();
  }, [id]);

  useEffect(() => {
    document.title = "B.R.A.D | Investigator Report";
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />
      <main className={`flex-1 transition-all duration-300 min-h-screen ${sidebarExpanded ? "ml-56" : "ml-16"}`}>
        <UserGreeting username={storedUser.username} title="Report Analysis" subtitle={report ? `Viewing ${report.domain}` : "Loading..."} />

        {notification && (
          <Notification type={notification.type} title={notification.title} onClose={() => setNotification(null)}>
            {notification.message}
          </Notification>
        )}

        <div className="p-8">
          {!report ? (
            <p className="text-center text-gray-500">Loading report details...</p>
          ) : (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md mt-6">
              <ReportAnalysisView report={report} view={report.analysisStatus} loggedInUser={storedUser} onRefresh={fetchReport} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}