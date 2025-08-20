import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';
import BRAD_robot from '../assets/BRAD_robot.png';
import API from '../api/axios';
import BackButton from '../components/BackButton';

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

  const [displayedText, setDisplayedText] = useState([]);
  const lines = [
    "Hey there!",
    "Ready to join the B.R.A.D family?",
    "Create your account and start your journey with us!"
  ];

  useEffect(() => {
    let currentLine = 0;
    let currentChar = 0;
    let tempText = [];

    const type = () => {
      if (currentChar < lines[currentLine].length) {
        tempText[currentLine] = (tempText[currentLine] || "") + lines[currentLine][currentChar];
        setDisplayedText([...tempText]);
        currentChar++;
        setTimeout(type, 50);
      } else {
        currentLine++;
        if (currentLine < lines.length) {
          currentChar = 0;
          tempText.push("");
          setTimeout(type, 500); 
        }
      }
    };

    tempText.push("");
    type();
  }, []);

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
      const response = await API.post('/auth/register', userData);
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

  useEffect(() => {
    document.title = 'B.R.A.D | Register';
  }, []);

  return (
    <div className="register-page">
      <BackButton />
      <div className="robot-section">
          <img src={BRAD_robot} alt="BRAD Robot" className="brad-robot" />
          <h2 className="welcome-message">
            {displayedText.map((line, idx) => (
              <div key={idx}>
                {line}
                {idx === displayedText.length - 1 && <span className="cursor">|</span>}
              </div>
            ))}
          </h2>
      </div>

      <div className="form-section">
        <h2>Create an Account</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          <input type="text" name="firstname" placeholder="First Name" value={form.firstname} onChange={handleChange} required />
          <input type="text" name="lastname" placeholder="Last Name" value={form.lastname} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />

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
