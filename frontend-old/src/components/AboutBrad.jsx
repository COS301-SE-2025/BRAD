import React from 'react';
import '../styles/Landing.css';

const AboutBrad = () => {
  return (
    <section id="about" className="about-section">
      <h2>About <span className="highlight">B.R.A.D.</span></h2>
      <p>
        B.R.A.D. (Bot to Report Abusive Domains) is a tool designed to identify and analyze malicious websites.
        Our mission is to protect users from online threats through intelligent URL inspection and risk assessment.
      </p>
    </section>
  );
};

export default AboutBrad;