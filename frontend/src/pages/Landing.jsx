import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Landing.css';
import BRAD_robot from '../assets/BRAD_robot.png';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Top-right Info Button */}
      <div className="info-section">
        <p>Want to know more about BRAD?</p>
        <button className="about-button" onClick={() => navigate('/about')}>
          Learn More
        </button>
      </div>

      {/* Left Robot Image */}
      <div className="robot-section">
        <img src={BRAD_robot} alt="BRAD Robot" className="brad-robot" />
      </div>

      {/* Center Text */}
      <div className="text-section">
        <h1>Welcome</h1>
        <h1>I'm B.R.A.D</h1>
        <p className="subtitle">Bot to Report Abusive Domains</p>
        <button className="login-button" onClick={() => navigate('/login')}>
          Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
