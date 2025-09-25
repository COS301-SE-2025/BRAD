import React, { useState } from 'react';
import ConfirmationModal from '../components/ConfirmationModal'; 

const ManageUsers = ({ users, updateRole, removeUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [modalData, setModalData] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  const openModal = (message, onConfirm) => {
    setModalData({ isOpen: true, message, onConfirm });
  };

  const closeModal = () => {
    setModalData({ isOpen: false, message: '', onConfirm: null });
  };

  const handleRoleChange = (userId, currentRole, newRole, username) => {
    if (newRole === currentRole) return;
    openModal(
      `Are you sure you want to change "${username}"'s role from "${currentRole}" to "${newRole}"?`,
      () => updateRole(userId, currentRole, newRole)
    );
  };

  const handleRemove = (userId, username) => {
    openModal(
      `Are you sure you want to permanently remove "${username}"?`,
      () => removeUser(userId)
    );
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
          <option value="general">General</option>
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
                  className="role-change"
                  value={user.role}
                  onChange={(e) =>
                    handleRoleChange(user._id, user.role, e.target.value, user.username)
                  }
                  disabled={user.role === 'admin'}
                >
                  <option value="general">General</option>
                  <option value="investigator">Investigator</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <button
                  className="remove-button"
                  disabled={user.role === 'admin'}
                  onClick={() => handleRemove(user._id, user.username)}
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

      {/* Confirmation Modal */}
      {modalData.isOpen && (
        <ConfirmationModal
          message={modalData.message}
          onConfirm={() => {
            modalData.onConfirm();
            closeModal();
          }}
          onCancel={closeModal}
        />
      )}
    </div>
  );
};

export default ManageUsers;
