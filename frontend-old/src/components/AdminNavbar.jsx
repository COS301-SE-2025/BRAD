import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import BRAD_robot from '../assets/BRAD_robot.png';
import { FaUserPlus, FaUsersCog, FaQuestionCircle, FaUserCog, FaSignOutAlt } from 'react-icons/fa';

const AdminNavbar = ({ setView }) => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Create User', icon: <FaUserPlus />, onClick: () => setView('create') },
    { label: 'Manage User Roles', icon: <FaUsersCog />, onClick: () => setView('manage') },
    { label: 'Help Menu', icon: <FaQuestionCircle />, onClick: () => navigate('/help/admin') },
    { label: 'Logout', icon: <FaSignOutAlt />, onClick: () => navigate('/login'), logout: true },
  ];

  return (
    <div className="navbar collapsed">
      <div className="brand-section">
        <img src={BRAD_robot} alt="BRAD Robot" className="nav-logo" />
        <h1 className="nav-title">B.R.A.D</h1>
      </div>

      <ul className="nav-link">
        {navItems.map((item, idx) => (
          <li key={idx} onClick={item.onClick}>
            <div className="nav-item">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminNavbar;