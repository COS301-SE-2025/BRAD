import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import BRAD_robot from '../assets/BRAD_robot.png';
import UserManual from '../assets/B.R.A.D-User-Manual.pdf'

const InvestigatorNavbar = () => {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      {/* Logo and Title */}
      <div className="brand-section">
        <img src={BRAD_robot} alt="BRAD Robot" className="nav-logo" />
        <h1 className="nav-title">B.R.A.D</h1>
      </div>

      {/* Investigator Navigation Links */}
      <ul className="nav-link">
        <li>
          <button onClick={() => navigate('/investigator')}>Reports</button>
        </li>
        <li><button onClick={() => navigate('/help/investigator')}>Help menu</button></li>
        <li>
          <button onClick={() => navigate('/investigator/settings')}>Investigator Settings</button>
        </li>
        <li>
          <button onClick={() => navigate('/login')}>Logout</button>
        </li>
      </ul>
    </div>
  );
};

export default InvestigatorNavbar;
