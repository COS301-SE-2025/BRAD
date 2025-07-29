import React, { useState } from 'react';
import FAQ from '../components/FAQ';
import '../styles/Help.css';

const Help = () => {
  const [searchTerm, setSearchTerm] = useState('');

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
      </div>
      
      </div>

      

      <FAQ searchTerm={searchTerm} />
    </div>
  );
};

export default Help;
