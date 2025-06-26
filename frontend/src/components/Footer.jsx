import React from 'react';
import '../styles/Landing.css';

const Footer = () => {
  return (
    <div className="footer-section" id="contact">
      <div className="footer-content">
        <div className="footer-column">
          <h3>Contact Us</h3>
          <p>Email: cos301.cap2@gmail.com</p>
        </div>

        <div className="footer-column">
          <h3>Disclaimer</h3>
          <p>B.R.A.D is a research and demonstration system. It is not intended for commercial production use. All data submitted is used for academic purposes only.</p>
        </div>

        <div className="footer-column">
          <h3>Repository</h3>
          <a 
            href="https://github.com/COS301-SE-2025/BRAD" 
            target="_blank" 
            rel="noopener noreferrer"
            className="repo-link"
          >
            View on GitHub
          </a>
        </div>
      </div>
      <p className="footer-bottom">&copy; {new Date().getFullYear()} B.R.A.D. All rights reserved.</p>
    </div>
  );
};

export default Footer;
