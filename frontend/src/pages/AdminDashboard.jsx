import React, { useState } from 'react';
import '../styles/AdminDashboard.css';
import AdminNavbar from '../components/AdminNavbar';
import CreateUser from '../components/CreateUser';
import ManageUsers from '../components/ManageUsers';

const AdminDashboard = () => {
  const [view, setView] = useState('create');

  const [users, setUsers] = useState([
    { username: 'john_doe', role: 'reporter' },
    { username: 'i_anna', role: 'investigator' },
    { username: 'admin1', role: 'admin' },
  ]);

  const addUser = (user) => {
    setUsers([...users, { username: user.username, role: user.role }]);
  };

  const updateRole = (username, newRole) => {
    const updated = users.map((u) =>
      u.username === username ? { ...u, role: newRole } : u
    );
    setUsers(updated);
  };

  const removeUser = (username) => {
   const updated = users.filter((u) => u.username !== username);
   setUsers(updated);
  };
  return (
    <div className="admin-dashboard">
      <AdminNavbar setView={setView} />

      <div className="admin-content">
        <h2>Admin Dashboard</h2>
        {view === 'create' && <CreateUser addUser={addUser} />}
        {view === 'manage' && <ManageUsers users={users} updateRole={updateRole} removeUser={removeUser} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
