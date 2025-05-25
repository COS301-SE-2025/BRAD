require('dotenv').config();
const axios = require('axios');

const API = process.env.API_URL || 'http://localhost:3000';
const POLL_INTERVAL = 10000;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//Simulate scraping (page title, malware scan)
function performScraping(domain) {
  return {
    title: `Mock title for ${domain}`,
    malwareDetected: Math.random() > 0.85,
    summary: "Mocked page scan complete. No malicious scripts detected."
  };
}

//Simulate forensics (IP, registrar, SSL, WHOIS)
function gatherForensics(domain) {
  return {
    ip: `192.168.0.${Math.floor(Math.random() * 255)}`,
    registrar: "MockRegistrar Inc.",
    sslValid: Math.random() > 0.3,
    whoisOwner: "John Doe, MockOrg Ltd."
  };
}

//Perform full fake analysis
function generateAnalysis(domain) {
  const scraping = performScraping(domain);
  const forensics = gatherForensics(domain);

  return {
    domain,
    scannedAt: new Date().toISOString(),  
    riskScore: Math.floor(Math.random() * 100),
    ...scraping,
    ...forensics
  };
}

async function scanOnce() {
  try {
    const res = await axios.get(`${API}/pending-reports`);
    if (res.status === 204) {
      console.log("No pending reports. Waiting...");
      return;
    }

    const report = res.data;
    console.log(`Analyzing domain: ${report.domain} (ID: ${report.id})`);

    const analysis = generateAnalysis(report.domain);

    await axios.post(`${API}/analyzed-report`, {
      id: report.id,
      analysis
    });

    console.log(`Report: ${report.domain} | Risk: ${analysis.riskScore} | Malware: ${analysis.malwareDetected}`);
  } catch (err) {
    console.error("Bot error:", err.message);
  }
}

async function runBotForever() {
  console.log(`BRAD Bot running. Polling every ${POLL_INTERVAL / 1000} seconds...\n`);
  while (true) {
    await scanOnce();
    await wait(POLL_INTERVAL);
  }
}

if (require.main === module) {
  runBotForever();
}

module.exports = {
  performScraping,
  gatherForensics,
  generateAnalysis
};
