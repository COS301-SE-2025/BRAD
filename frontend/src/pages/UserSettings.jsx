import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import '../styles/UserSettings.css';
import Navbar from '../components/ReporterNavbar';
import InvestigatorNavbar from '../components/InvestigatorNavbar';

const UserSettings = () => {
  const location = useLocation();
  const isInvestigator = location.pathname.includes('/investigator');
  
  const storedUser = JSON.parse(localStorage.getItem('user')) || {};
  
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

    console.log('Fields to update:', updatedFields);
    setMessage('Your changes have been saved.');
  };

  return (
    <div className="user-settings-container">
      {isInvestigator ? <InvestigatorNavbar /> : <Navbar />}

      <div className="settings-form-section">
        <div className="settings-box">
          <div className="profile-info">
            {storedUser.profileImage ? (
              <img
                src={storedUser.profileImage}
                alt="Profile"
                className="profile-image"
              />
            ) : (
              <FaUserCircle className="profile-icon" />
            )}

            <div className="profile-details">
              <h3>{storedUser.username || 'Unknown User'}</h3>
              <p><strong>Name:</strong> {storedUser.firstname || 'N/A'} {storedUser.lastname || ''}</p>
              <p><strong>Email:</strong> {storedUser.email || 'N/A'}</p>
              
            </div>
          </div>

          <h2>Update Your Information</h2>
          <form className="settings-form" onSubmit={handleSubmit}>
            <input type="text" name="firstName" placeholder="New First Name" value={form.firstName} onChange={handleChange} />
            <input type="text" name="lastName" placeholder="New Last Name" value={form.lastName} onChange={handleChange} />
            <input type="text" name="username" placeholder="New Username" value={form.username} onChange={handleChange} />
            <input type="email" name="email" placeholder="New Email" value={form.email} onChange={handleChange} />
            <input type="password" name="password" placeholder="New Password" value={form.password} onChange={handleChange} />
            <button type="submit">Update Profile</button>
          </form>

          {message && <p className="success-message">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
