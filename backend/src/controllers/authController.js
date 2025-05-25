const User = require('../models/users');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const identifierNormalized = identifier.toLowerCase().trim();

    const user = await User.findOne({
      $or: [
        { email: identifierNormalized },
        { username: identifierNormalized }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({ message: "Login successful", user: userData });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

