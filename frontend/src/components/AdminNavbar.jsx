import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import BRAD_robot from '../assets/BRAD_robot.png';
import UserManual from '../assets/B.R.A.D-User-Manual.pdf'

const AdminNavbar = ({ setView }) => {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <div className="brand-section">
        <img src={BRAD_robot} alt="BRAD Robot" className="nav-logo" />
        <h1 className="nav-title">B.R.A.D</h1>
      </div>

      <ul className="nav-link">
        <li><button onClick={() => setView('create')}>Create User</button></li>
        <li><button onClick={() => setView('manage')}>Manage User Roles</button></li>
        <li>
                  <a href={UserManual} target="_blank" rel="noopener noreferrer">
                    <button>Help Menu</button>
                  </a>
                </li>
        <li><button onClick={() => navigate('/login')}>Logout</button></li>
      </ul>
    </div>
  );
};

export default AdminNavbar;
