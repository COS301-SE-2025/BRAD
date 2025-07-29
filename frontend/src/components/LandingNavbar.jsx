import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

const LandingNavbar = () => {
  return (
    <nav className="landing-navbar">
      <div className="logo">B.R.A.D</div>
      <div className="nav-links">
        <Link to="/help/reporter">Help Menu</Link>
        <a href="#contact">Contact</a>
        <Link to="/register" className="register-button">Get started</Link>
        <Link to="/login" className="login-button">Login</Link>
      </div>
    </nav>
  );
};

export default LandingNavbar;
