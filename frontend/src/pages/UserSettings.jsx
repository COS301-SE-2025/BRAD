import React, { useState,useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/UserSettings.css';
import Navbar from '../components/Navbar';
import InvestigatorNavbar from '../components/InvestigatorNavbar';

const UserSettings = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = 'B.R.A.D | User Settings';
  }, []);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Filter out empty fields
    const updatedFields = {};
    for (const key in form) {
      if (form[key].trim() !== '') {
        updatedFields[key] = form[key].trim();
      }
    }

    if (Object.keys(updatedFields).length === 0) {
      setMessage('Please fill in at least one field to update.');
      return;
    }

    // Simulate saving
    console.log('Fields to update:', updatedFields);
    setMessage('Your changes have been saved.');
  };

  const isInvestigator = location.pathname.includes('/investigator');

  return (
    <div className="user-settings-container">
      {isInvestigator ? <InvestigatorNavbar /> : <Navbar />}

      <div className="settings-form-section">
        <h2>User Settings</h2>
        <form className="settings-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstName"
            placeholder="New First Name"
            value={form.firstName}
            onChange={handleChange}
          />
          <input
            type="text"
            name="lastName"
            placeholder="New Last Name"
            value={form.lastName}
            onChange={handleChange}
          />
          <input
            type="text"
            name="username"
            placeholder="New Username"
            value={form.username}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="New Email"
            value={form.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="New Password"
            value={form.password}
            onChange={handleChange}
          />
          <button type="submit">Update Profile</button>
        </form>

        {message && <p className="success-message">{message}</p>}
      </div>
    </div>
  );
};

export default UserSettings;
