import React, { useEffect, useState } from 'react';
import '../styles/AdminDashboard.css';
import AdminNavbar from '../components/AdminNavbar';
import CreateUser from '../components/CreateUser';
import ManageUsers from '../components/ManageUsers';
import { getAllUsers,createUser, createAdmin,deleteUser, promoteUser, demoteUser,changeRoleToAdmin } from '../api/admin';

const AdminDashboard = () => {
  const [view, setView] = useState('create');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    document.title = 'B.R.A.D | Admin';
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
    setSuccessMessage('User created successfully!');
  } catch (err) {
    console.error('User creation failed:', err);

    if (err.response) {
      const { status, data } = err.response;

      if (status === 409) {
        alert(data.message || 'User already exists. Please use a different username or email.');
      } else if (status === 400) {
        alert(data.message || 'Invalid input. Please review the user details.');
      } else if (status === 403) {
        alert(data.message || 'You do not have permission to perform this action.');
      } else {
        alert(data.message || 'An unexpected error occurred. Please try again.');
      }
    } else {
      alert('Network error or server is unreachable. Please check your connection.');
    }
  }
};

const updateRole = async (userId, currentRole, newRole) => {
  try {
    let res;

    if (newRole === 'investigator') {
      res = await promoteUser(userId);
    } else if (newRole === 'reporter') {
      res = await demoteUser(userId);
    } else if (newRole === 'admin') {
      res = await changeRoleToAdmin(userId);
    }

    if (res) {
      setUsers(users.map((u) =>
        u._id === userId ? { ...u, role: res.data.role } : u
      ));
    }
  } catch (err) {
    console.error('Role update failed:', err);
    alert('Failed to change role. Make sure you have permissions.');
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
