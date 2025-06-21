import React from 'react';
import LandingHero from '../components/LandingHero';
import LandingNavbar from '../components/LandingNavbar';
import AboutBrad  from '../components/AboutBrad';
import HowItWorks from '../components/HowItWorks';
import '../styles/Landing.css';

const Landing = () => {
  return (
    <div className="landing-page">
      <LandingNavbar />
      <LandingHero />
      <AboutBrad />
      <HowItWorks />
    </div>
  );
};

export default Landing;
