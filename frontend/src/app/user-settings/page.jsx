"use client"
import { useEffect, useState } from "react"
import { FaUserCircle } from "react-icons/fa"
import Sidebar from "@/components/Sidebar"
import ThemeToggle from "@/components/ThemeToggle"
import { updateUser } from "@/lib/api/auth"

export default function UserSettingsPage() {
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setMessage("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Collect only non-empty fields
    const updatedFields = {}
    for (const key in form) {
      if (form[key].trim() !== "") updatedFields[key] = form[key].trim()
    }

    if (Object.keys(updatedFields).length === 0) {
      setMessage("Please fill in at least one field to update.")
      return
    }

    try {
      // ✅ Get token correctly
      const storedUser = JSON.parse(localStorage.getItem("user"))
      const token = storedUser?.token

      if (!token) {
        setMessage("You must be logged in to update your profile.")
        return
      }

      // ✅ Send update request (the interceptor already attaches token)
      const response = await updateUser(updatedFields)

      // ✅ Update local storage with new user info
      const updatedUser = { ...storedUser, ...updatedFields }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setStoredUser(updatedUser)

      setMessage("Profile updated successfully!")
      setForm({ firstname: "", lastname: "", username: "", email: "" })
    } catch (err) {
      console.error("Update failed:", err)
      setMessage(err.response?.data?.message || "Update failed.")
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar */}
      <Sidebar onToggle={setSidebarExpanded} />

      {/* Main content */}
      <div
        className={`flex-1 p-8 transition-all duration-300 ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        {/* Top bar */}
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>

        {/* Profile Card */}
        <div className="card p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            {storedUser?.profileImage ? (
              <img
                src={storedUser.profileImage}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <FaUserCircle className="w-16 h-16 text-brad-500" />
            )}
            <div>
              <h3 className="text-xl font-semibold">
                {storedUser?.username || "Unknown User"}
              </h3>
              <p>
                <strong>Name:</strong>{" "}
                {storedUser?.firstname || "N/A"} {storedUser?.lastname || ""}
              </p>
              <p>
                <strong>Email:</strong> {storedUser?.email || "N/A"}
              </p>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4">Update Your Information</h2>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="firstname"
              placeholder="New First Name"
              value={form.firstname}
              onChange={handleChange}
              className="input"
            />
            <input
              type="text"
              name="lastname"
              placeholder="New Last Name"
              value={form.lastname}
              onChange={handleChange}
              className="input"
            />
            <input
              type="text"
              name="username"
              placeholder="New Username"
              value={form.username}
              onChange={handleChange}
              className="input"
            />
            <input
              type="email"
              name="email"
              placeholder="New Email"
              value={form.email}
              onChange={handleChange}
              className="input"
            />
            <button type="submit" className="btn-primary">
              Update Profile
            </button>
          </form>

          {message && <p className="mt-4 text-brad-500">{message}</p>}
        </div>
      </div>
    </div>
  )
}
