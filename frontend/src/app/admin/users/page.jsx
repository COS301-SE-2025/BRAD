"use client"

import Sidebar from "@/components/Sidebar"
import UserGreeting from "@/components/UserGreeting"
import AddUserForm from "@/components/AddUserForm"
import { useState } from "react"
import { Trash2 } from "lucide-react"

export default function ManageUsersPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("all")

  // Mock user list
  const [users, setUsers] = useState([
    { name: "John Doe", role: "Investigator", email: "john@example.com" },
    { name: "Jane Smith", role: "Reporter", email: "jane@example.com" },
    { name: "Alice Admin", role: "Admin", email: "alice@example.com" },
  ])

  // Filter + search
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = filterRole === "all" || u.role.toLowerCase() === filterRole
    return matchesSearch && matchesRole
  })

  const handleRoleChange = (index, newRole) => {
    setUsers((prev) =>
      prev.map((u, i) =>
        i === index && u.role !== "Admin" ? { ...u, role: newRole } : u
      )
    )
  }

  const handleRemove = (index) => {
    setUsers((prev) =>
      prev.filter((_, i) => i !== index || prev[i].role === "Admin")
    )
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />

      <main
        className={`transition-all duration-300 w-full ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        {/* Greeting */}
        <UserGreeting
          username="Admin"
          title="Hello"
          subtitle="Manage all users."
          fullWidth
        />

        {/* Layout: Add User + User List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 mt-10">
          {/* Add User Card */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Add User</h3>
            <AddUserForm />
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
                <option value="investigator">Investigator</option>
                <option value="reporter">Reporter</option>
              </select>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{u.name}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">
                      {u.role === "Admin" ? (
                        u.role
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(i, e.target.value)}
                          className="input"
                        >
                          <option value="Investigator">Investigator</option>
                          <option value="Reporter">Reporter</option>
                        </select>
                      )}
                    </td>
                    <td className="py-2">
                      {u.role !== "Admin" && (
                        <button
                          onClick={() => handleRemove(i)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
