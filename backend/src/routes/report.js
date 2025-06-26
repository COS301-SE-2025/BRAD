const express = require("express");
const {
  submitReport,
  getReports,
  analyzeReport,
  getPendingReports,
  saveAnalysis,
  updateInvestigatorDecision
} = require("../controllers/reportController");

const router = express.Router();

router.post("/report", submitReport);
router.get("/reports", getReports);
router.get("/forensics/:id", analyzeReport);

//routes for bot
router.get("/pending-reports", getPendingReports);
router.post("/analyzed-report", saveAnalysis);

router.patch('/report/:id/decision', updateInvestigatorDecision);

module.exports = router;
