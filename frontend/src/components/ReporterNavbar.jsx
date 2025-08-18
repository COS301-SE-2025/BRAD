import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import BRAD_robot from '../assets/BRAD_robot.png';
import { FaChartPie, FaBug, FaQuestionCircle, FaUserCog, FaSignOutAlt } from 'react-icons/fa';

const ReporterNavbar = () => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', icon: <FaChartPie />, path: '/dashboard' },
    { label: 'Report', icon: <FaBug />, path: '/report' },
    { label: 'Help Menu', icon: <FaQuestionCircle />, path: '/help/reporter' },
    { label: 'User Settings', icon: <FaUserCog />, path: '/settings' },
    { label: 'Logout', icon: <FaSignOutAlt />, path: '/login', logout: true },
  ];

  const handleNavClick = (item) => {
    if (item.logout) {
      localStorage.removeItem('user');
    }
    navigate(item.path);
  };

  return (
    <div className="navbar collapsed">
      <div className="brand-section">
        <img src={BRAD_robot} alt="BRAD Robot" className="nav-logo" />
        <h1 className="nav-title">B.R.A.D</h1>
      </div>

      <ul className="nav-link">
        {navItems.map((item, idx) => (
          <li key={idx} onClick={() => handleNavClick(item)}>
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

export default ReporterNavbar;
