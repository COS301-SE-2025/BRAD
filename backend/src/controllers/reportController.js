const mongoose = require('mongoose');
const { performAnalysis } = require("../services/forensicService");
const Report = require('../models/report');

exports.submitReport = async (req, res) => {
  const { domain, submittedBy } = req.body;

  if (!domain || !submittedBy) {
    return res.status(400).json({ message: "Domain and submittedBy are required" });
  }

  try {
    const newReport = new Report({ domain, submittedBy });
    await newReport.save();
    res.status(201).json(newReport);
  } catch (err) {
    console.error('Error submitting report:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getReports = async (req, res) => {
  try {
    const { user } = req.query;

    const reports = user
      ? await Report.find({ submittedBy: user })
          .populate('submittedBy', 'username')
          .sort({ createdAt: -1 })
      : await Report.find()
          .populate('submittedBy', 'username')
          .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error('Failed to fetch reports:', err);
    res.status(500).json({ message: 'Could not fetch reports' });
  }
};


exports.analyzeReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Call your analysis logic
    const analysis = performAnalysis(report); // assuming it's synchronous
    res.json(analysis);
  } catch (err) {
    console.error('Error analyzing report:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//Bot gets one pending report
exports.getPendingReports = async (_req, res) => {
  try {
    const pending = await Report.find({ analyzed: false }).limit(1);

    if (pending.length === 0) return res.status(204).send();
    res.json(pending[0]);
  } catch (err) {
    console.error('Error getting pending reports:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//Bot submits fake analysis
exports.saveAnalysis = async (req, res) => {
  const { id, analysis } = req.body;

  if (!id || !analysis) return res.status(400).json({ message: 'Missing report id or analysis' });

  try {
    const updated = await Report.findByIdAndUpdate(
      id,
      { analysis, analyzed: true },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Report not found' });

    res.status(200).json({ message: 'Analysis saved', report: updated });
  } catch (err) {
    console.error('Error saving analysis:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateInvestigatorDecision = async (req, res) => {
  const { verdict } = req.body;

  if (!['malicious', 'benign'].includes(verdict)) {
    return res.status(400).json({ message: "Invalid verdict value." });
  }

  try {
    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { investigatorDecision: verdict },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating verdict:', err);
    res.status(500).json({ message: 'Error updating report verdict' });
  }
};


