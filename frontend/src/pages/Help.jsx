import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import FAQ from '../components/FAQ';
import '../styles/Help.css';
import userManual from '../assets/B.R.A.D-User-Manual.pdf';

const Help = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { role } = useParams();

  return (
    <div className="help-page">
      <div className="help-header">
        <h1>Hi, how can we help?</h1>
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="help-description">
        <p>
          This page is here to help you understand how to use B.R.A.D., submit reports, and troubleshoot any issues.
          Use the search bar above to filter questions or scroll through our frequently asked topics.
        </p>

        <div className='contact-section'>
          <div className="contact-item">
              📧 <a href="cos301.cap2@gmail.com">cos301.cap2@gmail.com</a>
            </div>
            <div className="contact-item">
              🔗 <a href="https://github.com/COS301-SE-2025/BRAD" target="_blank" rel="noopener noreferrer">
                View GitHub Repo
              </a>
            </div>
            <div className="contact-item">
              📄 <a href={userManual} target="_blank" rel="noopener noreferrer">
                Open User Manual
              </a>
            </div>
          </div>
        </div>
        </div>
      <FAQ searchTerm={searchTerm} role={role} />
    </div>
  );
};

export default Help;
