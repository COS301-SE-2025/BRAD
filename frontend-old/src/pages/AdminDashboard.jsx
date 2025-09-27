import React, { useEffect, useState } from 'react';
import '../styles/AdminDashboard.css';
import AdminNavbar from '../components/AdminNavbar';
import CreateUser from '../components/CreateUser';
import ManageUsers from '../components/ManageUsers';
import Notification from '../components/Notification';
import {
  getAllUsers,
  createUser,
  deleteUser,
  promoteUser,
  demoteUser,
  changeRoleToAdmin
} from '../api/admin';

const AdminDashboard = () => {
  const [view, setView] = useState('create');
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    fetchUsers();
    document.title = 'B.R.A.D | Admin';
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch {
      showNotification('error', 'Failed to fetch users.');
    }
  };

  const addUser = async (user) => {
    try {
      const res = await createUser(user);
      setUsers([...users, res.data]);
      showNotification('success', 'User created successfully!');
    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;
        if (status === 409) showNotification('error', data.message || 'User already exists.');
        else if (status === 400) showNotification('error', data.message || 'Invalid input.');
        else if (status === 403) showNotification('error', data.message || 'Permission denied.');
        else showNotification('error', data.message || 'Unexpected error.');
      } else {
        showNotification('error', 'Network error. Please check your connection.');
      }
    }
  };

  const updateRole = async (userId, currentRole, newRole) => {
    try {
      let res;
      if (newRole === 'investigator') res = await promoteUser(userId);
      else if (newRole === 'reporter') res = await demoteUser(userId);
      else if (newRole === 'admin') res = await changeRoleToAdmin(userId);

      if (res) {
        setUsers(users.map((u) => u._id === userId ? { ...u, role: res.data.role } : u));
        showNotification('success', `Role updated to ${newRole}.`);
      }
    } catch {
      showNotification('error', 'Failed to update role.');
    }
  };

  const removeUser = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter((u) => u._id !== userId));
      showNotification('success', 'User deleted successfully.');
    } catch {
      showNotification('error', 'Failed to delete user.');
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminNavbar setView={setView} />

      <div className="admin-content">
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
        <h2>Admin Dashboard</h2>
        {view === 'create' && <CreateUser addUser={addUser} />}
        {view === 'manage' && (
          <ManageUsers
            users={users}
            updateRole={updateRole}
            removeUser={removeUser}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;