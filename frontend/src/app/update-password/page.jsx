"use client"
import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import { FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheck, FaTimes } from "react-icons/fa"
import API from "@/lib/api/axios"
import { useRouter } from "next/navigation"

export default function ChangePasswordPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [message, setMessage] = useState("")
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    setMessage("")
    
    // Check password strength when newPassword changes
    if (name === "newPassword") {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength("")
      return
    }
    
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    const mediumRegex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{6,}$/
    
    if (strongRegex.test(password)) {
      setPasswordStrength("strong")
    } else if (mediumRegex.test(password)) {
      setPasswordStrength("medium")
    } else {
      setPasswordStrength("weak")
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "strong": return "bg-green-500"
      case "medium": return "bg-yellow-500"
      case "weak": return "bg-red-500"
      default: return "bg-gray-300"
    }
  }

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case "strong": return "Strong password"
      case "medium": return "Medium strength"
      case "weak": return "Weak password"
      default: return "Enter a password"
    }
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

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long.")
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
      setPasswordStrength("")
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setMessage("")
        router.push("/user-settings")
      }, 3000)
    } catch (err) {
      console.error("Change password failed:", err)
      setMessage(err.response?.data?.message || "Failed to change password.")
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    router.back()
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900">
      {/* Sidebar */}
      <Sidebar onToggle={setSidebarExpanded} />

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Form */}
              <div className="lg:col-span-2">
                {/* Header */}
                <div className="max-w-2xl">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200 group"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:shadow-md transition-shadow">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </div>
                    Back to Settings
                  </button>

                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <FaShieldAlt className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Change Password</h1>
                    <p className="text-gray-600 text-lg">
                      Secure your account with a new password
                    </p>
                  </div>

                  {/* Main Form Card */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Old Password Field */}
                      <div>
                        <label htmlFor="oldPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showOldPassword ? "text" : "password"}
                            id="oldPassword"
                            name="oldPassword"
                            placeholder="Enter your current password"
                            value={form.oldPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showOldPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password Field */}
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            id="newPassword"
                            name="newPassword"
                            placeholder="Enter your new password"
                            value={form.newPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showNewPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                          </button>
                        </div>
                        
                        {/* Password Strength Indicator */}
                        {form.newPassword && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">Password strength</span>
                              <span className={`text-sm font-medium ${
                                passwordStrength === "strong" ? "text-green-600" :
                                passwordStrength === "medium" ? "text-yellow-600" :
                                passwordStrength === "weak" ? "text-red-600" : "text-gray-500"
                              }`}>
                                {getPasswordStrengthText()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  passwordStrength === "strong" ? "w-full bg-green-500" :
                                  passwordStrength === "medium" ? "w-2/3 bg-yellow-500" :
                                  passwordStrength === "weak" ? "w-1/3 bg-red-500" : "w-0"
                                }`}
                              />
                            </div>
                            
                            {/* Password Requirements */}
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className={`flex items-center gap-2 ${form.newPassword.length >= 6 ? 'text-green-600' : ''}`}>
                                {form.newPassword.length >= 6 ? <FaCheck className="w-3 h-3" /> : <FaTimes className="w-3 h-3" />}
                                At least 6 characters
                              </div>
                              <div className={`flex items-center gap-2 ${/[A-Z]/.test(form.newPassword) && /[a-z]/.test(form.newPassword) ? 'text-green-600' : ''}`}>
                                {/[A-Z]/.test(form.newPassword) && /[a-z]/.test(form.newPassword) ? <FaCheck className="w-3 h-3" /> : <FaTimes className="w-3 h-3" />}
                                Uppercase and lowercase letters
                              </div>
                              <div className={`flex items-center gap-2 ${/\d/.test(form.newPassword) ? 'text-green-600' : ''}`}>
                                {/\d/.test(form.newPassword) ? <FaCheck className="w-3 h-3" /> : <FaTimes className="w-3 h-3" />}
                                At least one number
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password Field */}
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm your new password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showConfirmPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                          </button>
                        </div>
                        
                        {/* Password Match Indicator */}
                        {form.confirmPassword && (
                          <div className="mt-2">
                            <span className={`text-sm font-medium flex items-center gap-2 ${
                              form.newPassword === form.confirmPassword ? "text-green-600" : "text-red-600"
                            }`}>
                              {form.newPassword === form.confirmPassword ? (
                                <>
                                  <FaCheck className="w-4 h-4" />
                                  Passwords match
                                </>
                              ) : (
                                <>
                                  <FaTimes className="w-4 h-4" />
                                  Passwords do not match
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        <FaLock className="w-5 h-5" />
                        {loading ? "Updating Password..." : "Change Password"}
                      </button>
                    </form>

                    {/* Message Display */}
                    {message && (
                      <div className={`mt-6 p-4 rounded-lg border text-center font-medium ${
                        message.includes("successfully") 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Security Tips */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <FaShieldAlt className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Password Security Tips</h3>
                  </div>
                  
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FaCheck className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>Use a mix of characters:</strong> Combine letters, numbers, and symbols for stronger security
                      </span>
                    </li>
                    
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FaCheck className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>Avoid personal info:</strong> Don't use names, birthdates, or common words
                      </span>
                    </li>
                    
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FaCheck className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>Unique passwords:</strong> Use different passwords for different accounts
                      </span>
                    </li>
                    
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FaCheck className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>Consider a manager:</strong> Password managers help create and store secure passwords
                      </span>
                    </li>
                    
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FaCheck className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>Regular updates:</strong> Change passwords periodically for better security
                      </span>
                    </li>
                  </ul>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 text-center">
                      <strong>Remember:</strong> Your password is the key to your account. Keep it safe and secure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}