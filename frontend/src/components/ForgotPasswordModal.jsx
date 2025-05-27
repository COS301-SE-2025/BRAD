import React, { useState } from 'react';
import '../styles/ForgotPasswordModal.css';

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulate sending reset email
    setMessage('If an account with this email exists, a reset link will be sent.');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h3>Reset Password</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage('');
            }}
            required
          />
          <button type="submit">Send Reset Link</button>
        </form>
        {message && <p className="success-message">{message}</p>}
        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
