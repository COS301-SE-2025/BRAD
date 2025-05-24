import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import BRAD_robot from '../assets/BRAD_robot.png';

const LoginPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    // Simulate login success
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <div className="robot-section">
        <img src={BRAD_robot} alt="BRAD Robot" className="brad-robot" />
      </div>

      <div className="form-section">
        <h2>Login to B.R.A.D</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
          />
          <button type="submit">Login</button>
          {error && <div className="error">{error}</div>}
        </form>

        <p className="register-link">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')}>Register here</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
