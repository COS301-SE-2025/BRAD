import React, { useState } from 'react';
import '../styles/Landing.css';
import fileupload from '../assets/file-upload.png'
import analysing from '../assets/analysing.png'
import magnifyingglass from '../assets/magnifying-glass.png'

const HowItWorks = () => {

  const [popupContent, setPopupContent] = useState(null);

  const handleOpen = (title, details) => {
    setPopupContent({ title, details });
  };

  const handleClose = () => {
    setPopupContent(null);
  };

  return (
    <div className="how-it-works-section" id="features">
      <h2>How It Works</h2>
      <div className="how-it-works-cards">
        <div className="how-card" onClick={() => handleOpen(
            "Steps to report a suspicious domain",
            `1. Login into BRAD with an already created account
          2. Enter URL
          3. Add optional screenshot and document evidence to support report and help our investigators with their analysis.
          4. Click submit and that's it!
          5. Your report will be added to your report history and you'll be able to view its status
          6. Our investigators will be on it ASAP and you'll be notified when resolved.
          As easy as that!`
        )}>
          <img src={fileupload} alt="Submit Icon" />
          <h3>Submit a URL</h3>
          <p>Enter any suspicious URL you come across into B.R.A.D. and add optional evidence screenshots and documents</p>
        </div>

        <div className="how-card" onClick={() => handleOpen(
          "Bot Evaluation",
          `B.R.A.D.'s AI engine automatically analyzes the submitted URL using advanced scanning algorithms to detect threats and assign risk scores.
           B.R.A.D's response it sent to and investigator who will use it to analyse your report.`
        )}>
          <img src={magnifyingglass} alt="Analysis Icon" />
          <h3>Bot Evaluation</h3>
          <p>B.R.A.D. evaluates the URL for potential threats and malicious activity.</p>
        </div>

        <div className="how-card" onClick={() => handleOpen(
          "Investigator Analysis",
          "Human investigators review the bot’s findings, analyze provided evidence, and finalize a verdict to ensure accurate reporting."
        )}>
          <img src={analysing} alt="Report Icon" />
          <h3>Investigator Analysis</h3>
          <p>Investigator create an analysis by using Bot's response and the reporter's added evidence</p>
        </div>
      </div>

      {popupContent && (
        <div className="popup-overlay" onClick={handleClose}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>{popupContent.title}</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{popupContent.details}</p>
            <button onClick={handleClose}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HowItWorks;