import React from 'react';
import '../styles/Navbar.css';
import { useNavigate } from 'react-router-dom';
import BRAD_robot from '../assets/BRAD_robot.png';

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
        <li><button onClick={() => navigate('/about')}>About</button></li>
        <li><button onClick={() => navigate('/settings')}>User Settings</button></li>
        <li>
          <button
            onClick={() => {
              localStorage.removeItem('user');
              navigate('/login');             
            }}
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
