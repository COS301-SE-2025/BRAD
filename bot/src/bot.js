require('dotenv').config();
const axios = require('axios');

const API = process.env.API_URL || 'http://localhost:3000';
const POLL_INTERVAL = 5000; // Runs every 5 seconds 

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scanOnce() {
  try {
    const res = await axios.get(`${API}/pending-reports`);
    
    if (res.status === 204) {
      console.log("No pending reports. Waiting...");
      return;
    }

    const report = res.data;
    console.log(`Analyzing domain: ${report.domain} (ID: ${report.id})`);

    // Simulate analysis
    const fakeAnalysis = {
      domain: report.domain,
      riskScore: Math.floor(Math.random() * 100),
      summary: "Simulated keyword scan. No threats found."
    };

    await axios.post(`${API}/analyzed-report`, {
      id: report.id,
      analysis: fakeAnalysis
    });

    console.log(`Report ID ${report.id} analyzed. Risk score: ${fakeAnalysis.riskScore}/100`);
  } catch (err) {
    console.error("Bot error:", err.message || err);
  }
}

async function runBotForever() {
  console.log(`BRAD Bot started. Polling every ${POLL_INTERVAL / 1000} seconds...\n`);

  while (true) {
    await scanOnce();
    await wait(POLL_INTERVAL); // wait between each cycle
  }
}

runBotForever();
