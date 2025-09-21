"use client"

export default function AddUserForm() {
  return (
    <div className="w-full max-w-md mx-auto mt-6 card p-6">
      <form className="space-y-4">
        <input type="text" placeholder="Name" className="w-full input" />
        <input type="text" placeholder="Surname" className="w-full input" />
        <input type="text" placeholder="Username" className="w-full input" />
        <input type="email" placeholder="Email" className="w-full input" />
        <select className="w-full input">
          <option value="investigator">Investigator</option>
          <option value="reporter">Reporter</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="btn w-full">
          Add User
        </button>
      </form>
    </div>
  )
}
