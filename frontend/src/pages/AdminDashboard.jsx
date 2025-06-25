import React, { useEffect, useState } from 'react';
import '../styles/AdminDashboard.css';
import AdminNavbar from '../components/AdminNavbar';
import CreateUser from '../components/CreateUser';
import ManageUsers from '../components/ManageUsers';
import { getAllUsers,createUser, createAdmin,deleteUser, promoteUser, demoteUser } from '../api/admin';

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
    const res = await createUser(user);
    setUsers([...users, res.data]);
  } catch (err) {
    console.error('User creation failed:', err);
    alert('Failed to create user. Please check inputs or try again.');
  }
};

 const updateRole = async (userId, currentRole, newRole) => {
  try {
    const res =
      newRole === 'investigator'
        ? await promoteUser(userId)
        : newRole === 'reporter'
        ? await demoteUser(userId)
        : null;

    if (res) {
      setUsers(users.map((u) =>
        u._id === userId ? { ...u, role: res.data.role } : u
      ));
    }
  } catch (err) {
    console.error('Role update failed:', err);
  }
};

const removeUser = async (userId) => {
  try {
    await deleteUser(userId); 
    setUsers(users.filter((u) => u._id !== userId));
  } catch (err) {
    console.error('Failed to delete user:', err);
    alert('Failed to delete user. Please try again.');
  }
};

  return (
    <div className="admin-dashboard">
      <AdminNavbar setView={setView} />

      <div className="admin-content">
        <h2>Admin Dashboard</h2>
        {view === 'create' && <CreateUser addUser={addUser} />}
        {view === 'manage' && (
        <ManageUsers users={users} updateRole={updateRole} removeUser={removeUser} />

        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
