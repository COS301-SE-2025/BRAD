import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';


const LandingNavbar = () => {

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="landing-navbar">
      <div className="logo">B.R.A.D</div>

      <button
        className={`hamburger ${menuOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Nav links */}
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/help/reporter" onClick={() => setMenuOpen(false)}>
          Help Menu
        </Link>
        <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        <Link to="/register" className="register-button" onClick={() => setMenuOpen(false)}>
          Get started
        </Link>
        <Link to="/login" className="login-button" onClick={() => setMenuOpen(false)}>
          Login
        </Link>
      </div>
    </nav>
  );
};

export default LandingNavbar;
