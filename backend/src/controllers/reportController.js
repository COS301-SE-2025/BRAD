const { addReport, getAllReports, findReport, getPendingReports, saveAnalysis } = require("../models/reportStore");
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

//Bot gets one pending report
exports.getPendingReports = (req, res) => {
  const pending = getPendingReports();
  if (pending.length === 0) return res.status(204).send();
  res.json(pending[0]); // Send one report at a time
};

//Bot submits fake analysis
exports.saveAnalysis = (req, res) => {
  const { id, analysis } = req.body;
  if (!id || !analysis) return res.status(400).json({ message: "Missing report id or analysis" });

  const updated = saveAnalysis(id, analysis);
  if (!updated) return res.status(404).json({ message: "Report not found" });

  res.status(200).json({ message: "Analysis saved", report: updated });
};
