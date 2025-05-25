const { addUser, findUser } = require("../models/userStore");

exports.register = (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: "Missing fields" });
  }
  if (findUser(username)) {
    return res.status(409).json({ message: "User already exists" });
  }
  addUser({ username, password, role });
  res.status(201).json({ message: "User registered" });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  const user = findUser(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  res.status(200).json({ message: "Login successful", role: user.role });
};

exports.logout = (_req, res) => {
  res.status(200).json({ message: "Logout successful" });
};
