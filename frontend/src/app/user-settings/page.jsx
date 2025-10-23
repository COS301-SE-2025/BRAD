"use client"
import { useEffect, useState } from "react"
import { FaUserCircle } from "react-icons/fa"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import ThemeToggle from "@/components/ThemeToggle"
import { updateUser } from "@/lib/api/auth"

export default function UserSettingsPage() {
  const router = useRouter()
  const [storedUser, setStoredUser] = useState(
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user")) || {}
      : {}
  )

  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
  })

  const [message, setMessage] = useState("")
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  useEffect(() => {
    document.title = "B.R.A.D | User Settings"
  }, [])

  const goToActivityLogs = () => {
    router.push("/activity")
  }

  const goToUpdateInfo = () => {
    router.push("/update-info")
  }

  const goToChangePassword = () => {
    router.push("/update-password")
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />

      <main
        className={`transition-all duration-300 w-full ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text)]">User Settings</h1>
            <p className="text-[var(--text-secondary)]">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Settings Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Update Information Card */}
            <div className="card p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                  <FaUserCircle className="text-blue-600 dark:text-blue-400 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </div>
              <p className="text-[var(--text-secondary)] mb-4 text-sm">
                Update your personal details like name, username, and email address.
              </p>
              <button
                className="btn-primary w-full"
                onClick={goToUpdateInfo}
              >
                Update Information
              </button>
            </div>

            {/* Change Password Card */}
            <div className="card p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Security</h3>
              </div>
              <p className="text-[var(--text-secondary)] mb-4 text-sm">
                Change your password to keep your account secure and protected.
              </p>
              <button
                className="btn-primary w-full"
                onClick={goToChangePassword}
              >
                Change Password
              </button>
            </div>

            {/* Activity Logs Card */}
            <div className="card p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Activity</h3>
              </div>
              <p className="text-[var(--text-secondary)] mb-4 text-sm">
                View your activity logs and track your recent actions within the system.
              </p>
              <button
                className="btn-primary w-full"
                onClick={goToActivityLogs}
              >
                View Activity Logs
              </button>
            </div>
          </div>

          {/* Current User Info Section */}
          <div className="mt-8 card p-6">
            <h3 className="text-lg font-semibold mb-4">Current Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Username
                </label>
                <p className="text-[var(--text)]">{storedUser.username || "Not set"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Email
                </label>
                <p className="text-[var(--text)]">{storedUser.email || "Not set"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Role
                </label>
                <p className="text-[var(--text)] capitalize">{storedUser.role || "Not set"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Account Status
                </label>
                <p className="text-green-600 dark:text-green-400">Active</p>
              </div>
            </div>
          </div>

          {/* Theme Toggle Section */}
          <div className="mt-6 card p-6">
            <h3 className="text-lg font-semibold mb-4">Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text)] font-medium">Theme</p>
                <p className="text-[var(--text-secondary)] text-sm">
                  Choose between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}