import React from 'react';
import FAQ from '../components/FAQ';

const Help = () => {
  return (
    <div className="help-container">
      <h1>Help Menu</h1>
      <section className="introduction">
        <p>
          Welcome to the B.R.A.D help center. This section provides support resources including Frequently Asked Questions,
          contact details, and a brief walkthrough of how to use B.R.A.D.
        </p>
      </section>

      <FAQ />

      <section className="contact-info">
        <h2>Contact Us</h2>
        <p>Email: <a href="mailto:cos301.cap2@gmail.com">cos301.cap2@gmail.com</a></p>
        <p>Repository: <a href="https://github.com/COS301-SE-2025/BRAD" target="_blank" rel="noreferrer">View on GitHub</a></p>
      </section>

      <section className="user-guide">
        <h2>User Guide</h2>
        <p>
          For a detailed explanation of system features and how to use B.R.A.D, download our <a href="/B.R.A.D-User-Manual.pdf" target="_blank" rel="noreferrer">User Manual</a>.
        </p>
      </section>
    </div>
  );
};

export default Help;
