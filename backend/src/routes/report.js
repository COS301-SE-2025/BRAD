const express = require("express");
const { submitReport, getReports, analyzeReport } = require("../controllers/reportController");

const router = express.Router();

router.post("/report", submitReport);
router.get("/reports", getReports);
router.get("/forensics/:id", analyzeReport);

module.exports = router;
