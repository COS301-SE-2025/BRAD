import React, { useState } from 'react';
import '../styles/InvestigatorStats.css';
import InvestigatorNavbar from '../components/InvestigatorNavbar';
import { FaUserCircle } from 'react-icons/fa';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const InvestigatorStats = () => {
  const [timeFrame, setTimeFrame] = useState('Monthly');
  const user = JSON.parse(localStorage.getItem('user')) || { username: 'Reporter' };

  const summary = {
    total: 112,
    malicious: 45,
    safe: 67,
    topDomains: ['phishy.com', 'scamalert.net', 'dodgy.biz'],
    open: 26,
    closed: 72,
    pendingEvidence: 14,
  };

  const pieData = [
    { name: 'Pending reports', value: summary.open },
    { name: 'Reports in progress', value: summary.closed },
    { name: 'Resolved reports', value: summary.pendingEvidence },
  ];

  const COLORS = ['#460279ff', '#4dabf7', '#d39430ff'];

  const barData = [
    { month: 'Jan', cases: 80 },
    { month: 'Feb', cases: 90 },
    { month: 'Mar', cases: 75 },
    { month: 'Apr', cases: 85 },
    { month: 'May', cases: 95 },
    { month: 'Jun', cases: 100 },
    { month: 'Jul', cases: 105 },
    { month: 'Aug', cases: 80 },
    { month: 'Sep', cases: 80 },
    { month: 'Oct', cases: 50 },
    { month: 'Nov', cases: 65 },
    { month: 'Dec', cases: 70 },
  ];

  return (
    <div className="investigator-stats">
      <InvestigatorNavbar />
      <div className="stats-container">
        <div className="welcome-box">
          <FaUserCircle className="user-icon" />
          <h1 className="welcome-text">
            Welcome, {user.username} <span className="wave">👋</span>
          </h1>
        </div>

        <div className="summary-cards five-cards">
          <div className="card"><h3>Total Reports</h3><p>{summary.total}</p></div>
          <div className="card"><h3>Malicious Reports</h3><p>{summary.malicious}</p></div>
          <div className="card"><h3>Safe Reports</h3><p>{summary.safe}</p></div>
          <div className="card"><h3>Top Domains</h3><ul>{summary.topDomains.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
          <div className="card"><h3>Report Distribution</h3>
            <p>
              Malicious: {Math.round((summary.malicious / summary.total) * 100)}% <br />
              Safe: {Math.round((summary.safe / summary.total) * 100)}%
            </p>
          </div>
        </div>

        <div className="charts">
          <div className="bar-chart-box">
            <label>View by: </label>
            <select value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>

            <BarChart width={500} height={300} data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cases" fill="#4dabf7" />
            </BarChart>
          </div>

          <div className="pie-chart-box">
            <PieChart width={400} height={300}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigatorStats;
