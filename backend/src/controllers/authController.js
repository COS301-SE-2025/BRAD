const User = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // Ensure this is included

// LOGIN
exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const identifierNormalized = identifier.toLowerCase().trim();

    let user = await Admin.findOne({
      $or: [
        { email: identifierNormalized },
        { username: identifierNormalized },
      ],
    });

    let role = "admin";

    if (!user) {
      user = await User.findOne({
        $or: [
          { email: identifierNormalized },
          { username: identifierNormalized },
        ],
      });
      role = "general";
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      message: "Login successful",
      user: { ...userData, role },
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// REGISTER
exports.register = async (req, res) => {
  const { firstname, lastname, username, email, password } = req.body;

  try {
    const emailNormalized = email.toLowerCase().trim();
    const usernameNormalized = username.trim();

    const existingUser = await User.findOne({
      $or: [{ email: emailNormalized }, { username: usernameNormalized }],
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email or username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      lastname,
      username: usernameNormalized,
      email: emailNormalized,
      password: hashedPassword,
      role: "general",
    });

    await newUser.save();

    res.status(201).json({ userId: newUser._id });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
