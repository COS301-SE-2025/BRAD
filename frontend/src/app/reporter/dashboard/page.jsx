"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UserGreeting from "@/components/UserGreeting";
import ReportFileCard from "@/components/ReportFileCard";
import ReportProgressBar from "@/components/ReportProgressBar";
import ReportsTreemap from "@/components/ReportsTreemap";
import API from "@/lib/api/axios";
import Notification from "@/components/Notification";

export default function ReporterDashboard() {
  const [storedUser, setStoredUser] = useState({ username: "Reporter" });
  const [reports, setReports] = useState([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);

  // Load user from localStorage only on the client
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setStoredUser(JSON.parse(userData));
      } catch (e) {}
    }
  }, []);

  // fetch reports from backend
  const fetchReports = async () => {
    try {
      const res = await API.get("/reports", {
        params: { submittedBy: storedUser._id },
      });
      setReports(res.data || []);
    } catch (err) {
      console.error("Error fetching report history:", err);
      setNotification({
        type: "error",
        message: "Failed to fetch report history.",
      });
    }
  };

  useEffect(() => {
    document.title = "B.R.A.D | Reporter Dashboard";
    if (storedUser._id) fetchReports();
    const interval = setInterval(() => {
      if (storedUser._id) fetchReports();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedUser]);

  const filteredReports = useMemo(() => {
    if (filter === "all") return reports;
    if (filter === "pending") return reports.filter((r) => !r.investigatorDecision && r.analysisStatus === "pending");
    if (filter === "resolved") return reports.filter((r) => r.investigatorDecision);
    if (filter === "in-progress") return reports.filter((r) => r.analysisStatus === "in-progress");
    return reports;
  }, [reports, filter]);

  const mapStatusForProgress = (report) => {
    if (!report) return "Pending";
    if (report.investigatorDecision) return "Resolved";
    if (report.analysisStatus === "in-progress") return "In Progress";
    return "Pending";
  };

  const treemapData = useMemo(() => {
    const counts = reports.reduce((acc, r) => {
      const status = r.investigatorDecision ? "resolved" : r.analysisStatus === "in-progress" ? "in-progress" : "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map((status) => ({ name: status, value: counts[status] }));
  }, [reports]);

  useEffect(() => {
      document.title = 'B.R.A.D | Reporter Dashboard';
    }, []);
  
  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />

      <div
        className={`flex-1 transition-all duration-300 p-8 ${sidebarExpanded ? "ml-56" : "ml-16"}`}
      >
        <UserGreeting
          username={storedUser.username}
          title="Welcome back"
          subtitle="Here you can view your report history"
        />

        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6 mb-4">
          <h2 className="text-xl font-semibold">Your Reports</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm text-[var(--muted)]">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-[var(--bg)] text-[var(--text)]"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Layout: reports left, treemap right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div key={report._id} className="card p-4 flex flex-col justify-between">
                  <ReportFileCard
                    report={report}
                    loggedInUser={storedUser}
                    onRefresh={fetchReports}
                  />
                  <div className="mt-4">
                    <ReportProgressBar status={mapStatusForProgress(report)} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center mt-10 col-span-full">
                <p className="text-lg">You have no reports yet.</p>
                <a href="/reporter/report" className="btn-primary mt-4 inline-block">
                  Report Your First Domain
                </a>
              </div>
            )}
          </div>

          <aside className="lg:col-span-1 space-y-4">
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-3">Report Status Overview</h3>
              <ReportsTreemap data={treemapData} />
            </div>

            <div className="card p-4">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="text-sm text-[var] space-y-2">
                <div>
                  <strong>Total:</strong> {reports.length}
                </div>
                <div>
                  <strong>Pending:</strong> {reports.filter((r) => !r.investigatorDecision && r.analysisStatus === "pending").length}
                </div>
                <div>
                  <strong>In Progress:</strong> {reports.filter((r) => r.analysisStatus === "in-progress").length}
                </div>
                <div>
                  <strong>Resolved:</strong> {reports.filter((r) => r.investigatorDecision).length}
                </div>
                <div>
                  <strong>Average risk:</strong>{" "}
                  {reports.length > 0
                    ? Math.round(
                        reports.reduce((s, r) => s + (r.analysis?.riskScore || 0), 0) / reports.length
                      )
                    : 0}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {notification && (
          <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
        )}
      </div>
    </div>
  );
}
