const request = require("supertest");
const express = require("express");
const authRoutes = require("../src/routes/auth");

//  Mock the controller to isolate from DB
jest.mock("../src/controllers/authController", () => ({
  register: (req, res) => res.status(201).json({ message: "User registered successfully" }),
  login: (req, res) => res.status(200).json({ token: "mock-token", user: { id: 1, username: "testuser" } }),
}));

const app = express();
app.use(express.json());
app.use("/", authRoutes);

describe("Auth API Endpoints", () => {
  describe("POST /register", () => {
    it("should return 400 if required fields are missing", async () => {
      const res = await request(app).post("/register").send({
        username: "braduser"
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("should return 400 if passwords do not match", async () => {
      const res = await request(app).post("/register").send({
        firstname: "Brad",
        lastname: "Bot",
        username: "bradbot",
        email: "brad@example.com",
        password: "password123",
        confirmPassword: "password999", // mismatch
        role: "general"
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0]).toMatch(/Passwords do not match/);
    });

    it("should return 201 on successful registration", async () => {
      const res = await request(app).post("/register").send({
        firstname: "Brad",
        lastname: "Bot",
        username: "bradbot",
        email: "brad@example.com",
        password: "password123",
        confirmPassword: "password123",
        role: "general"
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("User registered successfully");
    });
  });

  describe("POST /login", () => {
    it("should return 400 if fields are missing", async () => {
      const res = await request(app).post("/login").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("should return 200 and a token on successful login", async () => {
      const res = await request(app).post("/login").send({
        identifier: "testuser",
        password: "password123"
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBe("mock-token");
      expect(res.body.user.username).toBe("testuser");
    });
  });
});
