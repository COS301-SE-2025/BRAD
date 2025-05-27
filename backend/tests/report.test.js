const request = require("supertest");
const express = require("express");
const reportRoutes = require("../src/routes/report");

// Mock controller functions
jest.mock("../src/controllers/reportController", () => ({
  submitReport: (req, res) => res.status(201).json({ message: "Report submitted" }),
  getReports: (req, res) => res.status(200).json([{ id: 1, domain: "example.com" }]),
  analyzeReport: (req, res) => res.status(200).json({ result: "Forensics complete" }),
  getPendingReports: (req, res) => res.status(204).send(), // no content
  saveAnalysis: (req, res) => res.status(200).json({ message: "Analysis saved" }),
  updateInvestigatorDecision: (req, res) => res.status(200).json({ message: "Decision updated" }),
}));

const app = express();
app.use(express.json());
app.use("/", reportRoutes);

describe("Report Routes", () => {
  test("POST /report - submit a domain", async () => {
    const res = await request(app)
      .post("/report")
      .send({ domain: "http://test.com", submittedBy: "user123" });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Report submitted");
  });

  test("GET /reports - get all reports", async () => {
    const res = await request(app).get("/reports");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].domain).toBe("example.com");
  });

  test("GET /forensics/:id - analyze report by ID", async () => {
    const res = await request(app).get("/forensics/123");
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe("Forensics complete");
  });

  test("GET /pending-reports - should return 204 when none", async () => {
    const res = await request(app).get("/pending-reports");
    expect(res.statusCode).toBe(204);
  });

  test("POST /analyzed-report - save analysis", async () => {
    const res = await request(app)
      .post("/analyzed-report")
      .send({ id: "abc123", analysis: { riskScore: 50 } });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Analysis saved");
  });

  test("PATCH /report/:id/decision - update decision", async () => {
    const res = await request(app)
      .patch("/report/123/decision")
      .send({ decision: "benign" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Decision updated");
  });
});
