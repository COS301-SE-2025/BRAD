import React from 'react';
import '../styles/Landing.css';
import robotImage from '../assets/BRAD_robot.png';

const LandingNavbar = () => {
  return (
    <nav className="landing-navbar">
      <div className="logo">B.R.A.D</div>
      <div className="nav-links">
        <a href="/about">About</a>
        <a href="features">Features</a>
        <a href="contact">Contact</a>
        <a href="/login" className="login-button">Login</a>
      </div>
    </nav>
  );
};

export default LandingNavbar;
