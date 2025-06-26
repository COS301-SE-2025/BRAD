import React from 'react';
import '../styles/Navbar.css';
import { useNavigate } from 'react-router-dom';
import BRAD_robot from '../assets/BRAD_robot.png';
import UserManual from '../assets/B.R.A.D-User-Manual.pdf'

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <div className="brand-section">
        <img src={BRAD_robot} alt="BRAD Robot" className="nav-logo" />
        <h1 className="nav-title">B.R.A.D</h1>
      </div>

      <ul className="nav-link">
        <li><button onClick={() => navigate('/dashboard')}>Report</button></li>
        <li>
          <a href={UserManual} target="_blank" rel="noopener noreferrer">
            <button>Help Menu</button>
          </a>
        </li>
        <li><button onClick={() => navigate('/settings')}>User Settings</button></li>
        <li><button onClick={() => navigate('/login')}>Logout</button></li>
      </ul>
    </div>
  );
};

export default Navbar;
