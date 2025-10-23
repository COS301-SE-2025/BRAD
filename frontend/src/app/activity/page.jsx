"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import { FaHistory, FaSync, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa"
import API from "@/lib/api/axios"
import { useRouter } from "next/navigation"

export default function ActivityLogsPage() {
  const router = useRouter()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  useEffect(() => {
    document.title = "B.R.A.D | Activity Logs"
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await API.get("/activity/my-activities")
      setActivities(response.data)
    } catch (err) {
      console.error("Failed to fetch activities:", err)
      setError("Failed to load activity logs. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  const getActionIcon = (action) => {
    if (action.toLowerCase().includes('login')) return '🔐'
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) return '📝'
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) return '✏️'
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove')) return '🗑️'
    if (action.toLowerCase().includes('view') || action.toLowerCase().includes('read')) return '👁️'
    if (action.toLowerCase().includes('password')) return '🔑'
    return '📋'
  }

  const getActionColor = (action) => {
    if (action.toLowerCase().includes('login')) return 'text-green-600 bg-green-50 border-green-200'
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove')) return 'text-red-600 bg-red-50 border-red-200'
    if (action.toLowerCase().includes('view') || action.toLowerCase().includes('read')) return 'text-purple-600 bg-purple-50 border-purple-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const goBackToSettings = () => {
    router.push("/user-settings")
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
          {/* Header */}
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <button
                  onClick={goBackToSettings}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200 group"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:shadow-md transition-shadow">
                    <FaArrowLeft className="w-4 h-4" />
                  </div>
                  Back to Settings
                </button>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Logs</h1>
                <p className="text-gray-600 text-lg">
                  Track your recent activities and system interactions
                </p>
              </div>
              <button
                onClick={fetchActivities}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Stats Card - Only Total Activities */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8 max-w-xs">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Activities</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activities.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaHistory className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading activity logs...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center">
                  <FaExclamationTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600 text-lg font-medium mb-2">{error}</p>
                  <button
                    onClick={fetchActivities}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-12 text-center">
                  <FaHistory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No activity logs found</p>
                  <p className="text-gray-400">
                    Your activities will appear here once you start using the system
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activities.map((activity, index) => {
                    const { date, time } = formatDate(activity.createdAt)
                    return (
                      <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                            {getActionIcon(activity.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-gray-900 font-medium">{activity.action}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 ml-4">
                                <span>{date}</span>
                                <span>•</span>
                                <span>{time}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(activity.action)}`}>
                                {activity.action.split(' ')[0]}
                              </span>
                              <span className="text-sm text-gray-500">
                                {activity.details || 'No additional details'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Activity Count */}
            {activities.length > 0 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing {activities.length} activities
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}