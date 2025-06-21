import React, { useEffect, useState } from 'react';
import '../styles/AdminDashboard.css';
import AdminNavbar from '../components/AdminNavbar';
import CreateUser from '../components/CreateUser';
import ManageUsers from '../components/ManageUsers';
import { getAllUsers, createAdmin, promoteUser, demoteUser } from '../api/admin';

const AdminDashboard = () => {
  const [view, setView] = useState('create');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const addUser = async (user) => {
    try {
      const res = await createAdmin(user);
      setUsers([...users, res.data]);
    } catch (err) {
      console.error('Add admin failed:', err);
    }
  };

  const updateRole = async () => {
    try {
      const res = currentRole === 'general'
        ? await promoteUser(userId)
        : await demoteUser(userId);

      setUsers(users.map((u) =>
        u._id === userId ? { ...u, role: res.data.role } : u
      ));
    } catch (err) {
      console.error('Role update failed:', err);
    }
  };

  const removeUser = (userId) => {
    setUsers(users.filter((u) => u._id !== userId));
  };

  return (
    <div className="admin-dashboard">
      <AdminNavbar setView={setView} />

      <div className="admin-content">
        <h2>Admin Dashboard</h2>
        {view === 'create' && <CreateUser addUser={addUser} />}
        {view === 'manage' && (
          <ManageUsers
            users={users}
            updateRole={(users._id, users.role)}
            removeUser={removeUser}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
