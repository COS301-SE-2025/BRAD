"use client"
import { useEffect, useState } from "react"
import { FaUserCircle, FaUserEdit, FaSave } from "react-icons/fa"
import Sidebar from "@/components/Sidebar"
import { updateUser } from "@/lib/api/auth"
import { useRouter } from "next/navigation"
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
 const goToChangePassword = () => {
    router.push("/update-password")
  }
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
      const storedUser = JSON.parse(localStorage.getItem("user"))
      const token = storedUser?.token

      if (!token) {
        setMessage("You must be logged in to update your profile.")
        return
      }

      const response = await updateUser(updatedFields)

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
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <Sidebar onToggle={setSidebarExpanded} />

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">User Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    {storedUser?.profileImage ? (
                      <img
                        src={storedUser.profileImage}
                        alt="Profile"
                        className="w-22 h-22 rounded-full object-cover border-4 border-white"
                      />
                    ) : (
                      <FaUserCircle className="w-20 h-20 text-white" />
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {storedUser?.username || "Unknown User"}
                  </h2>
                  <p className="text-gray-600 mt-1 capitalize">{storedUser?.role || "User"}</p>
                  
                  <div className="w-full mt-6 space-y-3">
                    <div className="text-left">
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-gray-900">
                        {storedUser?.firstname || "N/A"} {storedUser?.lastname || ""}
                      </p>
                    </div>
                    <div className="text-left">
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{storedUser?.email || "N/A"}</p>
                    </div>
                    <div className="text-left">
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Update Form Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaUserEdit className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Update Profile Information</h2>
                    <p className="text-gray-600 text-sm">Fill in the fields you want to update</p>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstname"
                        name="firstname"
                        placeholder="Enter new first name"
                        value={form.firstname}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastname"
                        name="lastname"
                        placeholder="Enter new last name"
                        value={form.lastname}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Enter new username"
                      value={form.username}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter new email address"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <FaSave className="w-4 h-4" />
                    Update Profile
                  </button>
                </form>

                {message && (
                  <div className={`mt-4 p-3 rounded-lg text-center font-medium ${
                    message.includes("successfully") 
                      ? "bg-green-100 text-green-700 border border-green-200" 
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {message}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow" onClick={goToChangePassword}>
                  <h3 className="font-semibold text-gray-900 mb-2">Security</h3>
                  <p className="text-sm text-gray-600 mb-3">Change your password and manage security settings</p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Change Password →
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow" onClick={goToActivityLogs}>
                  <h3 className="font-semibold text-gray-900 mb-2">Activity</h3>
                  <p className="text-sm text-gray-600 mb-3">View your recent activity and access logs</p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View Activity Logs →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}