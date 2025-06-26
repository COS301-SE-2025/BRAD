import React from 'react';
import '../styles/Landing.css';

const LandingNavbar = () => {
  return (
    <nav className="landing-navbar">
      <div className="logo">B.R.A.D</div>
      <div className="nav-links">
        <a href="/B.R.A.D-User-Manual.pdf" target="_blank" rel="noopener noreferrer">
          Help Menu
        </a>
        <a href="#contact">Contact</a>
        <a href="/register" className="register-button">Get started</a>
        <a href="/login" className="login-button">Login</a>
      </div>
    </nav>
  );
};

export default LandingNavbar;
