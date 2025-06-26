//How to run:
// cd backend
//node scripts/seedReports.js

const mongoose = require('mongoose');
const Report = require('../src/models/Report');
const User = require('../src/models/users');

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/brad_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const user = await User.findOne({ email: 'investigator@example.com' });
  if (!user) {
    console.log('User investigator@example.com not found');
    process.exit(1);
  }

  const sampleReports = [
    { domain: 'http://threat-investigation.com', submittedBy: user._id },
    { domain: 'http://risky-site.org', submittedBy: user._id },
    {
      domain: 'http://flagged-example.net',
      submittedBy: user._id,
      analyzed: true,
      analysis: {
        domain: 'http://flagged-example.net',
        scannedAt: new Date().toISOString(),
        riskScore: 88,
        verdict: 'malicious',
        title: 'Fake login detected',
        malwareDetected: true,
        summary: 'Detected fake login form and suspicious scripts.',
        ip: '192.168.10.11',
        registrar: 'MockRegistrar Inc.',
        sslValid: false,
        whoisOwner: 'John Doe, Suspicious LLC'
      },
      investigatorDecision: 'malicious'
    },
  ];

  await Report.insertMany(sampleReports);
  console.log('Seeded reports for investigator@example.com');
  process.exit();
}

seed();
