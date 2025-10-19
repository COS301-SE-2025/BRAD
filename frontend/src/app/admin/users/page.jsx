"use client"

import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import AddUserForm from "@/components/AddUserForm"
import Notification from "@/components/Notification"
import ConfirmationModal from "@/components/ConfirmationModal"
import { useState, useEffect, useMemo } from "react"
import { Trash2, RefreshCw, Search, ChevronUp, ChevronDown } from "lucide-react"
import {
  getAllUsers,
  createUser,
  deleteUser,
  promoteUser,
  demoteUser,
  changeRoleToAdmin,
} from "@/lib/api/admin"

const ROLE_LABEL = { general: "General", investigator: "Investigator", admin: "Admin" }

/* Segmented role picker (colors only changed) */
function RolePicker({ value, onChange, disabled }) {
  const is = (v) => value === v
  const base =
    "px-3 py-1.5 rounded-full text-xs font-medium transition border focus:outline-none focus:ring-2"
  const off =
    "border border-[var(--muted)] text-[var(--text)]/80 bg-[var(--input-bg)] hover:bg-[#1b82ff33] hover:text-[var(--text)] hover:border-[color:var(--primary)] transition-all duration-200"

  const styles = {
    general:
      "bg-emerald-100 text-emerald-800 border-emerald-200 focus:ring-emerald-300",
    investigator:
      "bg-indigo-100 text-indigo-800 border-indigo-200 focus:ring-indigo-300",
    admin:
      "bg-rose-100 text-rose-800 border-rose-200 focus:ring-rose-300",
  }

  const Btn = ({ role, label }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(role)}
      className={`${base} ${is(role) ? styles[role] : off}`}
      aria-pressed={is(role)}
    >
      {label}
    </button>
  )

  return (
    <div className="inline-flex items-center gap-1.5 p-1">
      <Btn role="general" label="General" />
      <Btn role="investigator" label="Investigator" />
      <Btn role="admin" label="Admin" />
    </div>
  )
}

/* Loading skeleton row (colors only) */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3 px-4"><div className="h-4 w-28 rounded bg-[var(--card-nested)]" /></td>
      <td className="py-3 px-4"><div className="h-4 w-56 rounded bg-[var(--card-nested)]" /></td>
      <td className="py-3 px-4"><div className="h-6 w-36 rounded-full bg-[var(--card-nested)]" /></td>
      <td className="py-3 px-4 text-right"><div className="h-8 w-8 rounded bg-[var(--card-nested)] ml-auto" /></td>
    </tr>
  )
}

export default function ManageUsersPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [users, setUsers] = useState([])
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: "username", direction: "asc" })
  const [storedUser, setStoredUser] = useState(null) // <- added

  // Load user from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user")
      if (userData) setStoredUser(JSON.parse(userData))
    } catch {}
  }, [])

  const showNotification = (type, message, customTitle) => {
    const title = customTitle || (type === "success" ? "Success" : type === "error" ? "Error" : "Info")
    setNotification({ type, title, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await getAllUsers()
      const list =
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res?.data?.users) ? res.data.users :
        Array.isArray(res?.data?.data) ? res.data.data :
        []
      setUsers(list)
    } catch {
      showNotification("error", "Failed to fetch users.")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const requestAddUser = (newUser) => {
    setPendingAction({ type: "add", payload: newUser })
    setModalOpen(true)
  }

  const requestUpdateRole = (userId, currentRole, newRole) => {
    if (currentRole === newRole) return
    setPendingAction({ type: "update", payload: { userId, currentRole, newRole } })
    setModalOpen(true)
  }

  const requestRemoveUser = (userId) => {
    setPendingAction({ type: "delete", payload: { userId } })
    setModalOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingAction) return
    try {
      if (pendingAction.type === "add") {
        const res = await createUser(pendingAction.payload)
        setUsers((prev) => [res?.data ?? res, ...prev])
        showNotification("success", "User created successfully!")
      } else if (pendingAction.type === "update") {
        const { userId, newRole } = pendingAction.payload
        let res
        if (newRole === "investigator") res = await promoteUser(userId)
        else if (newRole === "general") res = await demoteUser(userId)
        else if (newRole === "admin") res = await changeRoleToAdmin(userId)
        const updatedRole = res?.data?.role ?? newRole
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: updatedRole } : u))
        )
        showNotification("success", `Role updated to ${ROLE_LABEL[updatedRole] || updatedRole}.`)
      } else if (pendingAction.type === "delete") {
        const { userId } = pendingAction.payload
        await deleteUser(userId)
        setUsers((prev) => prev.filter((u) => u._id !== userId))
        showNotification("success", "User deleted successfully.")
      }
    } catch {
      showNotification("error", "Action failed.")
    } finally {
      setModalOpen(false)
      setPendingAction(null)
    }
  }

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim()
    let filtered = users.filter((u) => {
      const uname = (u.username || "").toLowerCase()
      const email = (u.email || "").toLowerCase()
      const matchesSearch = uname.includes(q) || email.includes(q)
      const matchesRole = filterRole === "all" || u.role === filterRole
      return matchesSearch && matchesRole
    })

    if (sortConfig?.key) {
      filtered.sort((a, b) => {
        const valA = (a[sortConfig.key] || "").toLowerCase()
        const valB = (b[sortConfig.key] || "").toLowerCase()
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return filtered
  }, [users, search, filterRole, sortConfig])

  useEffect(() => {
    document.title = "B.R.A.D | Admin Manage users"
    fetchUsers()
  }, [])

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />
      <main className={`transition-all duration-300 w-full ${sidebarExpanded ? "ml-56" : "ml-16"}`}>
        <UserGreeting
          username={storedUser?.username || "Admin"}
          title="Hello"
          subtitle="Manage all users."
          fullWidth
        />

        {notification && (
          <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
            <Notification
              type={notification.type}
              title={notification.title}
              onClose={() => setNotification(null)}
            >
              {notification.message}
            </Notification>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 mt-10 items-start">
          {/* Add User Card */}
          <div className="rounded-2xl shadow-sm p-6 self-start lg:sticky lg:top-6 max-h-[calc(100vh-8rem)] overflow-auto bg-[var(--card)] border border-[var(--muted)]">
            <h3 className="font-semibold mb-4">Add User</h3>
            <AddUserForm onAddUser={requestAddUser} />
          </div>

          {/* User List */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--muted)]">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b border-[var(--muted)]/40">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                  <input
                    type="text"
                    placeholder="Search by username or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border bg-[var(--input-bg)] border-[var(--muted)] text-[var(--text)] placeholder-[var(--muted)]
                               focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full md:w-48 py-2 px-3 rounded-lg border bg-[var(--input-bg)] border-[var(--muted)] text-[var(--text)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                >
                  <option value="all">All roles</option>
                  <option value="general">General</option>
                  <option value="investigator">Investigator</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={fetchUsers}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 bg-[var(--input-bg)] border-[var(--muted)] text-[var(--text)] hover:bg-[var(--card-nested)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {/* Table */}
              <div className="relative max-h-[520px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b bg-[var(--card-nested)] text-[var(--text)] border-[var(--muted)]/50">
                      <th
                        className="text-left py-3 px-5 font-semibold w-[25%] cursor-pointer select-none hover:text-[var(--primary)]"
                        onClick={() => handleSort("username")}
                      >
                        <div className="flex items-center gap-1">
                          Username
                          {sortConfig.key === "username" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-4 w-4 opacity-70" />
                            ) : (
                              <ChevronDown className="h-4 w-4 opacity-70" />
                            ))}
                        </div>
                      </th>

                      <th
                        className="text-left py-3 px-5 font-semibold w-[35%] cursor-pointer select-none hover:text-[var(--primary)]"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center gap-1">
                          Email
                          {sortConfig.key === "email" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-4 w-4 opacity-70" />
                            ) : (
                              <ChevronDown className="h-4 w-4 opacity-70" />
                            ))}
                        </div>
                      </th>

                      <th className="text-left py-3 px-5 font-semibold w-[25%]">Role</th>
                      <th className="text-right py-3 px-5 font-semibold w-[80px]">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--muted)]/30 text-[var(--text)]">
                    {loading && (<><SkeletonRow /><SkeletonRow /><SkeletonRow /></>)}

                    {!loading && filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-[var(--card-nested)]/70 bg-[var(--card-nested)]/40 transition-colors">
                        <td className="py-3 px-5 font-medium">{u.username}</td>
                        <td className="py-3 px-5 truncate max-w-[260px]" title={u.email}>{u.email}</td>
                        <td className="py-3 px-5">
                          {u.role === "admin" ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
                                             bg-rose-100 text-rose-800 border border-rose-200">
                              Admin
                            </span>
                          ) : (
                            <RolePicker
                              value={u.role}
                              onChange={(newRole) => requestUpdateRole(u._id, u.role, newRole)}
                            />
                          )}
                        </td>
                        <td className="py-3 px-5 text-right align-middle w-[80px]">
                          {u.role !== "admin" && (
                            <button
                              onClick={() => requestRemoveUser(u._id)}
                              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-white bg-red-500/90 hover:bg-red-500"
                              title="Delete"
                              aria-label={`Delete ${u.username}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {!loading && filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-10 px-5 text-center text-[var(--muted)]">
                          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[var(--card-nested)] grid place-items-center">
                            <Search className="h-5 w-5" />
                          </div>
                          <p className="font-medium">No users found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 text-xs text-[var(--muted)] border-t border-[var(--muted)]/40 bg-[var(--card-nested)]">
                <span>
                  Showing <span className="font-semibold text-[var(--text)]">{filteredUsers.length}</span> of{" "}
                  <span className="font-semibold text-[var(--text)]">{users.length}</span> users
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setPendingAction(null) }}
        onConfirm={executePendingAction}
        title={
          pendingAction?.type === "add"
            ? "Confirm Add User"
            : pendingAction?.type === "update"
            ? "Confirm Update Role"
            : "Confirm Delete User"
        }
        message={
          pendingAction?.type === "add"
            ? "Are you sure you want to add this user?"
          : pendingAction?.type === "update"
            ? "Are you sure you want to update this role?"
          : "Are you sure you want to delete this user? This action cannot be undone."
        }
        confirmText={pendingAction?.type === "add" ? "Add" : pendingAction?.type === "update" ? "Update" : "Delete"}
        confirmStyle="btn-primary"
      />
    </div>
  )
}
