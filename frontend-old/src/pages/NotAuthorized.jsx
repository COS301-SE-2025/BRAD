import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NotAuthorized.css";
import BRAD_robot from '../assets/BRAD_robot.png';

const NotAuthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="not-authorized-page">
      <img src={BRAD_robot} alt="BRAD Robot" className="brad-robot" />
      <h1>🚫 Access Denied</h1>
      <p>Sorry, you don’t have permission to view this page.</p>
      <button onClick={() => navigate('/login')} className="back-button">
        Go to Login
      </button>
    </div>
  );

};

export default NotAuthorized;
