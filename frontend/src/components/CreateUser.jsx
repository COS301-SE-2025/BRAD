import React, { useState } from 'react';

const CreateUser = ({ addUser }) => {
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    role: 'reporter',
  });

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.email) return;

    addUser(newUser);
    setNewUser({ firstName: '', lastName: '', username: '', email: '', role: 'reporter' });
  };

  return (
    <div className="admin-section">
      <h3>Create New User</h3>
      <form className="admin-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={newUser.firstName}
          onChange={handleChange}
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={newUser.lastName}
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
          <option value="reporter">Reporter</option>
          <option value="investigator">Investigator</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Create User</button>
      </form>
    </div>
  );
};

export default CreateUser;
