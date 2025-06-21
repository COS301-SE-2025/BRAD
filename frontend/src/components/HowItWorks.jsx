import React from 'react';
import '../styles/Landing.css';
import fileupload from '../assets/file-upload.png'
import analysing from '../assets/analysing.png'
import magnifyingglass from '../assets/magnifying-glass.png'

const HowItWorks = () => {
  return (
    <div className="how-it-works-section" id="features">
      <h2>How It Works</h2>
      <div className="how-it-works-cards">
        <div className="how-card">
          <img src={fileupload} alt="Submit Icon" />
          <h3>Submit a URL</h3>
          <p>Enter any suspicious URL you come across into B.R.A.D. and add optional evidence screenshots and documents</p>
        </div>
        <div className="how-card">
          <img src={magnifyingglass } alt="Analysis Icon" />
          <h3>Bot Evaluation</h3>
          <p>B.R.A.D. evaluates the URL for potential threats and malicious activity.</p>
        </div>
        <div className="how-card">
          <img src={analysing} alt="Report Icon" />
          <h3>Investigator Analysis</h3>
          <p>Investigator create an analysis by using Bot's response and the reporter's added evidence</p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
