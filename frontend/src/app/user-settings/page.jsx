"use client"
import { useEffect, useState } from "react"
import { FaUserCircle } from "react-icons/fa"
import { useRouter } from "next/navigation" // <-- Import router
import Sidebar from "@/components/Sidebar"
import ThemeToggle from "@/components/ThemeToggle"
import { updateUser } from "@/lib/api/auth"

export default function UserSettingsPage() {
  const router = useRouter() // <-- Initialize router
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
    router.push("/activity") // <-- Navigate to logs page
  }

  const goToUpdateInfo = () => {
    router.push("/update-info") // <-- Navigate to update info page
  }

  const goToChangePassword = () => {
    router.push("/update-password") // <-- Navigate to change password page
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Button to go to Activity Logs */}
    

      {/* Button to go to Update Info */}
      <button
        className="btn-primary mb-4"
        onClick={goToUpdateInfo}
      >
        Update My Information
      </button>

       <button
        className="btn-primary mb-4"
        onClick={goToChangePassword}
      >
        Change Password
      </button>

      <button
        className="btn-primary mb-4"
        onClick={goToActivityLogs}
      >
        View My Activity Logs
      </button>
    </div>
  )
}
