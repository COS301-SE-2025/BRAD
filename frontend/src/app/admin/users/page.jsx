"use client"

import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import AddUserForm from "@/components/AddUserForm"
import Notification from "@/components/Notification"
import ConfirmationModal from "@/components/ConfirmationModal"
import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"

// API imports
import {
  getAllUsers,
  createUser,
  deleteUser,
  promoteUser,
  demoteUser,
  changeRoleToAdmin,
} from "@/lib/api/admin"

export default function ManageUsersPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [users, setUsers] = useState([])
  const [notification, setNotification] = useState(null)

  // modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const showNotification = (type, message, customTitle) => {
    const title = customTitle || (type === "success" ? "Success" : type === "error" ? "Error" : "Info")
    setNotification({ type, title, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers()
      setUsers(res.data)
    } catch {
      showNotification("error", "Failed to fetch users.")
    }
  }

  // ---- user actions (wrapped with modal) ----
  const requestAddUser = (newUser) => {
    setPendingAction({
      type: "add",
      payload: newUser,
    })
    setModalOpen(true)
  }

  const requestUpdateRole = (userId, currentRole, newRole) => {
    setPendingAction({
      type: "update",
      payload: { userId, currentRole, newRole },
    })
    setModalOpen(true)
  }

  const requestRemoveUser = (userId) => {
    setPendingAction({
      type: "delete",
      payload: { userId },
    })
    setModalOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingAction) return

    try {
      if (pendingAction.type === "add") {
        const res = await createUser(pendingAction.payload)
        setUsers((prev) => [...prev, res.data])
        showNotification("success", "User created successfully!")

      } else if (pendingAction.type === "update") {
        const { userId, newRole } = pendingAction.payload
        let res
        if (newRole === "investigator") res = await promoteUser(userId)
        else if (newRole === "reporter") res = await demoteUser(userId)
        else if (newRole === "admin") res = await changeRoleToAdmin(userId)

        if (res) {
          setUsers((prev) =>
            prev.map((u) =>
              u._id === userId ? { ...u, role: res.data.role } : u
            )
          )
          showNotification("success", `Role updated to ${newRole}.`)
        }

      } else if (pendingAction.type === "delete") {
        const { userId } = pendingAction.payload
        await deleteUser(userId)
        setUsers((prev) => prev.filter((u) => u._id !== userId))
        showNotification("success", "User deleted successfully.")
      }
    } catch (err) {
      showNotification("error", "Action failed.")
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = filterRole === "all" || u.role === filterRole
    return matchesSearch && matchesRole
  })

  useEffect(() => {
        document.title = 'B.R.A.D | Admin Manage users';
      }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />

      <main
        className={`transition-all duration-300 w-full ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        <UserGreeting
          username="Admin"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 mt-10">
          {/* Add User Card */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Add User</h3>
            <AddUserForm onAddUser={requestAddUser} />
          </div>

          {/* User List Card */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Search by username/email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-1/2"
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="input w-40"
              >
                <option value="all">All Roles</option>
                <option value="reporter">Reporter</option>
                <option value="investigator">Investigator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Username</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="border-b last:border-0">
                    <td className="py-2">{u.username}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">
                      {u.role === "admin" ? (
                        u.role
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) =>
                            requestUpdateRole(u._id, u.role, e.target.value)
                          }
                          className="input"
                        >
                          <option value="reporter">Reporter</option>
                          <option value="investigator">Investigator</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="py-2">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => requestRemoveUser(u._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
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
        confirmText={
          pendingAction?.type === "add"
            ? "Add"
            : pendingAction?.type === "update"
            ? "Update"
            : "Delete"
        }
        confirmStyle={
          pendingAction?.type === "delete"
            ? "bg-red-600 hover:bg-red-700"
            : "bg-blue-600 hover:bg-blue-700"
        }
      />
    </div>
  )
}
