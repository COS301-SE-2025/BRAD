"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import StatCard from "@/components/StatCard";
import ReportDistributionChart from "@/components/ReportDistributionChart";
import ReportStepsCarousel from "@/components/ReportStepsCarousel";
import { Timer, Search, Globe, FileText } from "lucide-react";

import {
  getAvgBotAnalysisTime,
  getAvgInvestigatorTime,
  getAvgResolutionTime,
  getTotalReports,
  getMaliciousReports,
  getSafeReports,
} from "@/lib/api/stats";

export default function LandingPage() {
  const [stats, setStats] = useState({
    avgBot: "N/A",
    avgInvestigator: "N/A",
    avgResolution: "N/A",
    totalReports: 0,
    malicious: 0,
    safe: 0,
  });

  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const fetchLandingStats = async () => {
      try {
        const [
          avgBot,
          avgInvestigator,
          avgResolution,
          total,
          malicious,
          safe,
        ] = await Promise.all([
          getAvgBotAnalysisTime(),
          getAvgInvestigatorTime(),
          getAvgResolutionTime(),
          getTotalReports(),
          getMaliciousReports(),
          getSafeReports(),
        ]);

        setStats({
          avgBot: avgBot || "N/A",
          avgInvestigator: avgInvestigator || "N/A",
          avgResolution: avgResolution || "N/A",
          totalReports: total || 0,
          malicious: malicious || 0,
          safe: safe || 0,
        });
      } catch (err) {
        console.error("Error fetching landing stats:", err);
      }
    };

    fetchLandingStats();
  }, []);

  return (
    <div className="flex flex-col min-h-screen landing-bg text-[var(--text)]">
      {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md">
          <div className="flex flex-wrap items-center justify-between max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            {/* Left side (logo + title) */}
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-8" />
              <span className="font-bold text-lg">B.R.A.D.</span>
            </div>

            {/* Right side (links + theme toggle) */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/help" className="hover:underline text-sm">
                Help
              </Link>
              <Link href="/login" className="hover:underline text-sm">
                Login
              </Link>
              <Link href="/register" className="hover:underline text-sm">
                Register
              </Link>
              <ThemeToggle />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() =>
                  setShowMenu((prev) => !prev)
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {showMenu && (
            <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3">
              <Link href="/help" className="block text-sm hover:underline">
                Help
              </Link>
              <Link href="/login" className="block text-sm hover:underline">
                Login
              </Link>
              <Link href="/register" className="block text-sm hover:underline">
                Register
              </Link>
              <ThemeToggle />
            </div>
          )}
        </nav>


      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-12 py-16">
        <div className="md:w-1/2">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Welcome to B.R.A.D.
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Protecting users from malicious websites through intelligent URL
            inspection and risk assessment.
          </p>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
        <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
          <img
            src="/BRAD_robot.png"
            alt="BRAD Robot"
            className="max-w-xs md:max-w-md"
          />
        </div>
      </section>

      {/* Performance Stats */}
      <section className="px-12 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Performance Insights
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Bot Avg. Time"
            value={stats.avgBot}
            color="text-blue-600"
            icon={Timer}
          />
          <StatCard
            title="Investigator Avg. Time"
            value={stats.avgInvestigator}
            color="text-green-600"
            icon={Search}
          />
          <StatCard
            title="Overall Avg. Time"
            value={stats.avgResolution}
            color="text-purple-600"
            icon={Globe}
          />
          <StatCard
            title="Reports Submitted"
            value={stats.totalReports.toLocaleString()}
            color="text-orange-600"
            icon={FileText}
          />
        </div>

        {/* Distribution Chart */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <ReportDistributionChart
              data={[
                { name: "Malicious", value: stats.malicious },
                { name: "Safe", value: stats.safe },
              ]}
            />
          </div>
        </div>
      </section>

      {/* About BRAD */}
      <section className="px-12 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">About B.R.A.D.</h2>
        <p className="max-w-3xl mx-auto text-gray-700 dark:text-gray-300">
          <strong>B.R.A.D.</strong> (Bot to Report Abusive Domains) is a tool
          designed to identify and analyze malicious websites. Our mission is to
          protect users from online threats through intelligent URL inspection
          and risk assessment.
        </p>
      </section>

      {/* How it Works */}
      <section className="px-12 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">How it Works</h2>
        <ReportStepsCarousel />
      </section>

      {/* Walkthrough Video */}
      <section className="px-12 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">Walkthrough Video</h2>
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
          <img
            src="/video_frame.png"
            alt="Walkthrough Video"
            className="mx-auto rounded-lg"
          />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Watch our quick demo to see how B.R.A.D. protects you online!
          </p>
          <a
            href="https://youtu.be/gMIGbNoeGXE"
            target="_blank"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Watch Video
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-12 py-8 bg-gray-100 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div>
            <h3 className="font-semibold mb-2">Contact Us</h3>
            <p>Email: cos301.cap2@gmail.com</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Disclaimer</h3>
            <p>
              B.R.A.D is a research and demonstration system. It is not intended
              for commercial production use. All data submitted is used for
              academic purposes only.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Repository</h3>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              View on GitHub
            </a>
          </div>
        </div>
        <div className="text-center mt-6">
          © 2025 B.R.A.D. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
