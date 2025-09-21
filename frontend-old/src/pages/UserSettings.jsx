import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import '../styles/UserSettings.css';
import Navbar from '../components/ReporterNavbar';
import InvestigatorNavbar from '../components/InvestigatorNavbar';
import { updateUser } from '../api/auth';

const UserSettings = () => {
  const location = useLocation();
  const isInvestigator = location.pathname.includes('/investigator');

  const storedUser = JSON.parse(localStorage.getItem('user')) || {};

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = 'B.R.A.D | User Settings';
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedFields = {};
    for (const key in form) {
      if (form[key].trim() !== '') updatedFields[key] = form[key].trim();
    }
    if (Object.keys(updatedFields).length === 0) {
      setMessage('Please fill in at least one field to update.');
      return;
    }
    // Show password modal
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = async () => {
    try {
      const payload = { ...form, currentPassword };
      const response = await updateUser(payload); 
      setMessage('Profile updated successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setForm({ firstname: '', lastname: '', username: '', email: '' });
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="user-settings-container">
      {isInvestigator ? <InvestigatorNavbar /> : <Navbar />}

      <div className="settings-form-section">
        <div className="settings-box">
          <div className="profile-info">
            {storedUser.profileImage ? (
              <img src={storedUser.profileImage} alt="Profile" className="profile-image" />
            ) : (
              <FaUserCircle className="profile-icon" />
            )}
            <div className="profile-details">
              <h3>{storedUser.username || 'Unknown User'}</h3>
              <p>
                <strong>Name:</strong> {storedUser.firstname || 'N/A'} {storedUser.lastname || ''}
              </p>
              <p>
                <strong>Email:</strong> {storedUser.email || 'N/A'}
              </p>
            </div>
          </div>

          <h2>Update Your Information</h2>
          <form className="settings-form" onSubmit={handleSubmit}>
            <input type="text" name="firstname" placeholder="New First Name" value={form.firstname} onChange={handleChange} />
            <input type="text" name="lastname" placeholder="New Last Name" value={form.lastname} onChange={handleChange} />
            <input type="text" name="username" placeholder="New Username" value={form.username} onChange={handleChange} />
            <input type="email" name="email" placeholder="New Email" value={form.email} onChange={handleChange} />
            <button type="submit">Update Profile</button>
          </form>

          {message && <p className="success-message">{message}</p>}
        </div>
      </div>

      {showPasswordModal && (
        <div className="password-modal">
          <div className="modal-content">
            <h3>Confirm Your Password</h3>
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handlePasswordConfirm}>Confirm</button>
              <button onClick={() => setShowPasswordModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;
