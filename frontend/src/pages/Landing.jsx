import React from 'react';
import LandingHero from '../components/LandingHero';
import LandingNavbar from '../components/LandingNavbar';
import AboutBrad  from '../components/AboutBrad';
import HowItWorks from '../components/HowItWorks';
import Walkthrough from '../components/Walkthrough';
import Footer from '../components/Footer';
import '../styles/Landing.css';

const Landing = () => {
  return (
    <div className="landing-page">
      <LandingNavbar />
      <LandingHero />
      <AboutBrad />
      <HowItWorks />
      <Walkthrough />
      <Footer />
    </div>
  );
};

export default Landing;
