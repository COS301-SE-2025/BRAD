import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/About.css';
import BRAD_robot from '../assets/BRAD_robot.png';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>
      
      <div className="logo-header">
        <img src={BRAD_robot} alt="BRAD Robot" className="about-robot" />
        <h1>About B.R.A.D</h1>
        <p className="tagline"><strong>B.R.A.D</strong> – Bot to Report Abusive Domains</p>
      </div>

      <section>
        <h2>What is B.R.A.D?</h2>
        <p>
          B.R.A.D is an intelligent, user-friendly cybersecurity tool designed to empower users
          to report and monitor suspicious or malicious domain activity. Whether you're a concerned
          user, IT professional, or threat analyst, B.R.A.D simplifies the reporting process and enhances
          investigation through automation and expert validation.
        </p>
      </section>

      <section>
        <h2>How It Works</h2>
        <ol>
          <li>
            <strong>Submit a Report:</strong> Users enter a suspicious domain and optionally upload evidence
            like screenshots, emails, or files.
          </li>
          <li>
            <strong>Automated Bot Analysis:</strong> B.R.A.D’s internal bot gathers intelligence on the domain—
            such as DNS records, threat databases, and SSL info.
          </li>
          <li>
            <strong>Investigator Review:</strong> Cybersecurity experts verify the findings, interpret the results,
            and finalize a report with a risk score.
          </li>
          <li>
            <strong>View Analysis:</strong> Users can log back in to view their submitted reports, track statuses
             and download final analysis.
          </li>
        </ol>
      </section>

      <section>
        <h2>Why Use B.R.A.D?</h2>
        <ul>
          <li> Simplifies domain reporting</li>
          <li> Uses automation to speed up analysis</li>
          <li> Combines AI + human validation for accuracy</li>
          <li> Helps improve digital safety and awareness</li>
        </ul>
      </section>

      <section>
        <h2>Meet the Team</h2>
      </section>

      <section>
        <h2>Contact Us</h2>
        <p>If you have any questions, suggestions, or would like to collaborate:</p>
      </section>

      {/* Placeholder for future animation or timeline */}
      {/* <section>
        <h2>Timeline (Coming Soon)</h2>
        <p>A visual journey of how B.R.A.D processes each report.</p>
      </section> */}

    </div>
  );
};

export default AboutPage;
