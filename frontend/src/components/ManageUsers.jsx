import React, { useState } from 'react';

const ManageUsers = ({ users, updateRole, removeUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

const handleRoleChange = (userId, currentRole, newRole) => {
  if (newRole === currentRole) return;

  const confirmChange = window.confirm(
    `Are you sure you want to change this user's role from "${currentRole}" to "${newRole}"?`
  );

  if (confirmChange) {
    updateRole(userId, currentRole, newRole);
  }
};

  const handleRemove = (username) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently remove "${username}"?`
    );

    if (confirmDelete) {
      removeUser(username);
    }
  };

  // Filter based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-section">
      <h3>Manage Existing Users</h3>

      {/* Filters */}
      <div className="filter-section">
            <input
            type="text"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="user-search-input"
            />
            <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-filter-select"
            >
            <option value="all">All Roles</option>
            <option value="reporter">Reporter</option>
            <option value="investigator">Investigator</option>
            <option value="admin">Admin</option>
            </select>
      </div>

      {/* Table */}
      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Current Role</th>
            <th>Change Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
       {filteredUsers.map((user) => (
  <tr key={user._id}>
    <td>{user.username}</td>
    <td>{user.role}</td>
    <td>
      <select
        value={user.role}
        onChange={(e) =>
          handleRoleChange(user._id, user.role, e.target.value)
        }
      >
        <option value="reporter">Reporter</option>
        <option value="investigator">Investigator</option>
        <option value="admin">Admin</option>
      </select>
    </td>
    <td>
      <button
        className="remove-button"
        onClick={() => handleRemove(user._id)} 
      >
        Remove
      </button>
    </td>
  </tr>
))}

          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ManageUsers;
