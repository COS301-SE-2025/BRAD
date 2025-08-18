import React, { useEffect,useState } from 'react';
import '../styles/InvestigatorStats.css';
import InvestigatorNavbar from '../components/InvestigatorNavbar';
import { FaUserCircle } from 'react-icons/fa';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

import { getTotalReports,getMaliciousReports
  ,getSafeReports,getRepeatedDomains,getPendingReportsCount,
  getInProgressReportsCount,getResolvedReportsCount ,getReportsByYear,getReportsByWeek
  ,getReportsByDay
 } from '../api/stats';

const InvestigatorStats = () => {
  const [timeFrame, setTimeFrame] = useState('Monthly');
  const user = JSON.parse(localStorage.getItem('user')) || { username: 'Reporter' };

 const [summary, setSummary] = useState({
    total: 0,
    malicious: 0,
    safe: 0,
    topDomains: [],
    open: 0,
    closed: 0,
    pendingEvidence: 0,
  });
  const [barData, setBarData] = useState([]);

  
    useEffect(() => {

       const fetchBarData = async () => {
    try {
      let data;
      if(timeFrame==='Weekly') data=await getReportsByWeek();
      else if(timeFrame==='Daily') data = await getReportsByDay();
      else data = await getReportsByYear();
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

      let formatted ;
if(timeFrame === 'Monthly') {
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        formatted = data.map(d => ({ month: months[d.month - 1], cases: d.count }));
      } else if(timeFrame === 'Weekly') {
        formatted = data.map(d => ({ month: `Week ${d.week}`, cases: d.count }));
      } else {
        formatted = data.map(d => ({ month: `${d.day}`, cases: d.count }));
      }

      setBarData(formatted);
    } catch (err) {
      console.error("Error fetching reports by year:", err);
    }
  };
    const fetchStats = async () => {
      try {
        const [total, malicious, safe, domains,open,closed,pending] = await Promise.all([
          getTotalReports(),
          getMaliciousReports(),
          getSafeReports(),
          getRepeatedDomains(),
          getPendingReportsCount(),
          getInProgressReportsCount(),
          getResolvedReportsCount(),
        ]);


        setSummary({
         total: total || 0,
          malicious: malicious || 0,
          safe: safe || 0,
          topDomains: domains || [],
          open: open||0,
          closed: closed||0,
          pendingEvidence: pending||0,
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStats();
    fetchBarData();
  }, [timeFrame, user._id, user.role]);
const pieData = [
  { name: 'Pending reports', value: summary.open },
  { name: 'Reports in progress', value: summary.closed },
  { name: 'Resolved reports', value: summary.pendingEvidence },
];
const COLORS = ['#460279ff', '#4dabf7', '#d39430ff'];


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
          <div className="card"><h3>Top Domains</h3>
        <ul>
  {summary.topDomains.map((d, i) => (
    <li key={i}>{d.domain} ({d.count})</li>
  ))}
</ul>
          </div>
          <div className="card"><h3>Report Distribution</h3>
            <p>
              Malicious: {summary.total ? Math.round((summary.malicious / summary.total) * 100) : 0}% <br />
              Safe: {summary.total ? Math.round((summary.safe / summary.total) * 100) : 0}%
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
