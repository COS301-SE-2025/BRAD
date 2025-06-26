import React, { useState } from 'react';

const CreateUser = ({ addUser }) => {
  const [newUser, setNewUser] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    role: 'general',
  });

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.email) return;

    addUser(newUser);
    setNewUser({ firstname: '', lastname: '', username: '', email: '', role: 'reporter' });
  };

  return (
    <div className="admin-section">
      <h3>Create New User</h3>
      <form className="admin-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstname"
          placeholder="First Name"
          value={newUser.firstname}
          onChange={handleChange}
        />
        <input
          type="text"
          name="lastname"
          placeholder="Last Name"
          value={newUser.lastname}
          onChange={handleChange}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={newUser.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={newUser.email}
          onChange={handleChange}
          required
        />
        <select name="role" value={newUser.role} onChange={handleChange}>
          <option value="general">General</option>
          <option value="investigator">Investigator</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Create User</button>
      </form>
    </div>
  );
};

export default CreateUser;
