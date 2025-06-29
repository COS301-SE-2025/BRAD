import React from 'react';
import '../styles/Landing.css';
import robotImage from '../assets/BRAD_robot.png';
import { useNavigate } from 'react-router-dom';

const LandingHero = () => {
  const navigate = useNavigate();
  return (
    <div className="landing-hero">
      <div className="hero-content">
        <h1>Protect Yourself Online</h1>
        <p>Report suspicious URLs and help make the web safer for everyone.</p>
        <button className="cta-button" onClick={() => navigate('/register')} >Get Started</button>
      </div>
      <div className="hero-image">
        <img src={robotImage} alt="BRAD Robot" />
      </div>
    </div>
  );
};

export default LandingHero;
