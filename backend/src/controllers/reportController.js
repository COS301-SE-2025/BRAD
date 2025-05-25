const { addReport, getAllReports, findReport } = require("../models/reportStore");
const { performAnalysis } = require("../services/forensicService");

exports.submitReport = (req, res) => {
  const { domain, reason } = req.body;
  if (!domain) return res.status(400).json({ message: "Domain is required" });
  const report = addReport({ domain, reason });
  res.status(201).json(report);
};

exports.getReports = (_req, res) => {
  res.json(getAllReports());
};

exports.analyzeReport = (req, res) => {
  const report = findReport(req.params.id);
  if (!report) return res.status(404).json({ message: "Report not found" });
  const analysis = performAnalysis(report);
  res.json(analysis);
};
