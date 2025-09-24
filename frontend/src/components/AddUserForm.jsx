"use client"
import { useState } from "react"

export default function AddUserForm({ onAddUser }) {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    role: "general",
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.username || !form.email) return
    onAddUser(form)
    setForm({ firstname: "", lastname: "", username: "", email: "", role: "general" })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="firstname"
        value={form.firstname}
        onChange={handleChange}
        placeholder="First Name"
        className="w-full input"
      />
      <input
        type="text"
        name="lastname"
        value={form.lastname}
        onChange={handleChange}
        placeholder="Last Name"
        className="w-full input"
      />
      <input
        type="text"
        name="username"
        value={form.username}
        onChange={handleChange}
        placeholder="Username"
        required
        className="w-full input"
      />
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        required
        className="w-full input"
      />
      <select
        name="role"
        value={form.role}
        onChange={handleChange}
        className="w-full input"
      >
        <option value="general">General</option>
        <option value="investigator">Investigator</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" className="btn w-full">
        Add User
      </button>
    </form>
  )
}
