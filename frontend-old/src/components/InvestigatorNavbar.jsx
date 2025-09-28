import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import BRAD_robot from '../assets/BRAD_robot.png';
import { FaChartPie, FaClock, FaCheckCircle, FaQuestionCircle, FaUserCog, FaSignOutAlt } from 'react-icons/fa';

const InvestigatorNavbar = () => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', icon: <FaChartPie />, path: '/investigator/stats' },
    { label: 'Pending Reports', icon: <FaClock />, path: '/investigator/pending' },
    { label: 'In-Progress Reports', icon: <FaClock />, path: '/investigator/in_progress' },
    { label: 'Reviewed Reports', icon: <FaCheckCircle />, path: '/investigator/reviewed' },
    { label: 'Help Menu', icon: <FaQuestionCircle />, path: '/help/investigator' },
    { label: 'Settings', icon: <FaUserCog />, path: '/investigator/settings' },
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

export default InvestigatorNavbar;
