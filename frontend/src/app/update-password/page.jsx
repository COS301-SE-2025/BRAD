"use client"
import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import ThemeToggle from "@/components/ThemeToggle"
import API from "@/lib/api/axios"

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [message, setMessage] = useState("")
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setMessage("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { oldPassword, newPassword, confirmPassword } = form

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage("All fields are required.")
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match.")
      return
    }

    try {
      setLoading(true)
      const response = await API.patch("/auth/change-password-logged-in", {
        oldPassword,
        newPassword,
      })

      setMessage(response.data.message || "Password changed successfully!")
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      console.error("Change password failed:", err)
      setMessage(err.response?.data?.message || "Failed to change password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />

      <div
        className={`flex-1 p-8 transition-all duration-300 ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>

        <div className="card p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="password"
              name="oldPassword"
              placeholder="Old Password"
              value={form.oldPassword}
              onChange={handleChange}
              className="input"
            />
            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={form.newPassword}
              onChange={handleChange}
              className="input"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="input"
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>

          {message && <p className="mt-4 text-brad-500">{message}</p>}
        </div>
      </div>
    </div>
  )
}
