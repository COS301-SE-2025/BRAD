"use client"
import { useState } from "react"

/* Segmented role picker (token-based, dark-mode friendly) */
function RolePicker({ value, onChange }) {
  const is = (v) => value === v
  const base =
    "px-3 py-1.5 rounded-full text-xs font-medium transition border focus:outline-none focus:ring-2"
  const off =
    "border border-[var(--muted)] text-[var(--text)]/80 bg-[var(--input-bg)] hover:bg-[#1b82ff33] hover:text-[var(--text)] hover:border-[color:var(--primary)] transition-all duration-200"



  // Keep semantic colors for the active choice
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
      onClick={() => onChange(role)}
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

export default function AddUserForm({ onAddUser }) {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    role: "general",
  })

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleRoleChange = (role) => setForm({ ...form, role })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.username || !form.email) return
    onAddUser(form)
    setForm({
      firstname: "",
      lastname: "",
      username: "",
      email: "",
      role: "general",
    })
  }

  const allFilled =
    form.firstname.trim() &&
    form.lastname.trim() &&
    form.username.trim() &&
    form.email.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Inputs use your .input utility (token-based) */}
      <input
        type="text"
        name="firstname"
        value={form.firstname}
        onChange={handleChange}
        placeholder="First Name"
        className="input"
      />
      <input
        type="text"
        name="lastname"
        value={form.lastname}
        onChange={handleChange}
        placeholder="Last Name"
        className="input"
      />
      <input
        type="text"
        name="username"
        value={form.username}
        onChange={handleChange}
        placeholder="Username"
        required
        className="input"
      />
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        required
        className="input"
      />

      {/* Role Picker inline with label */}
      <div className="pt-1 flex items-center gap-3">
        <label className="text-sm font-medium text-[var(--text)] whitespace-nowrap">
          Pick the user’s role:
        </label>
        <RolePicker value={form.role} onChange={handleRoleChange} />
      </div>

      {/* Submit Button (token-based) */}
      <button
        type="submit"
        disabled={!allFilled}
        className={`w-full py-2.5 rounded-md btn-primary ${
          allFilled ? "" : "disabled:opacity-60 cursor-not-allowed"
        }`}
      >
        Add User
      </button>
    </form>
  )
}
