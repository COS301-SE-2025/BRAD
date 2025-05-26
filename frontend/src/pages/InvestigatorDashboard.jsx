import React from 'react';
import '../styles/InvestigatorDashboard.css';
import InvestigatorNavbar from '../components/InvestigatorNavbar';

const InvestigatorDashboard = () => {
  const pendingReports = ['PhishingSite.com', 'Malware123.net', 'Suspicious.io'];
  const inProgressReports = ['FakeBank.org', 'StealerTools.net'];
  const finalisedReports = ['Spamlink.biz', 'Hackerhub.com'];

  return (
    <div className="investigator-dashboard">
      <InvestigatorNavbar />

      <div className="dashboard-main">
        <h2>Welcome Investigator_Name</h2>

        <div className="dashboard-columns">
          {/* Pending Reports */}
          <div className="report-column">
            <h3>Reports Pending</h3>
            {pendingReports.map((name, idx) => (
              <div className="report-card" key={`pending-${idx}`}>
                <p>{name}</p>
                <button className="start-button">Start Analysis</button>
              </div>
            ))}
          </div>

          {/* In Progress Reports */}
          <div className="report-column">
            <h3>Reports In Progress</h3>
            {inProgressReports.map((name, idx) => (
              <div className="report-card" key={`progress-${idx}`}>
                <p>{name}</p>
                <button className="continue-button">Continue Analysis</button>
              </div>
            ))}
          </div>

          {/* Finalised Reports */}
          <div className="report-column">
            <h3>Reports Finalised</h3>
            {finalisedReports.map((name, idx) => (
              <div className="report-card" key={`final-${idx}`}>
                <p>{name}</p>
                <button className="view-button">View Analysis</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigatorDashboard;
