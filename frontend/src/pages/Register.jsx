import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';
import BRAD_robot from '../assets/BRAD_robot.png';
import API from '../api/axios';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'general', 
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const userData = { ...form };
      const response = await API.post('/register', userData);
      setSuccess(response.data.message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="register-page">
    <button className="back-button" onClick={() => navigate(-1)}>
      ← Back
    </button>
      <div className="robot-section">
        <div className="robot-content">
          <img src={BRAD_robot} alt="BRAD Robot" className="brad-robot" />
          <h2 className="welcome-message">
            Welcome new user, create an account with B.R.A.D to get started
          </h2>
        </div>
      </div>
      

      <div className="form-section">
        <h2>Create an Account</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstname"
            placeholder="First Name"
            value={form.firstname}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lastname"
            placeholder="Last Name"
            value={form.lastname}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          <button type="submit">Register</button>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </form>

        <p className="login-link">
          Already have an account?{' '}
          <button className="link-button" onClick={() => navigate('/login')}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
