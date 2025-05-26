const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/users');
const Admin = require('../models/admin');

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const identifierNormalized = identifier.toLowerCase().trim();

    // Try to find in Admin collection
    let user = await Admin.findOne({
      $or: [
        { email: identifierNormalized },
        { username: identifierNormalized }
      ]
    });

    let role = 'admin';

    // If not found in Admin, try User
    if (!user) {
      user = await User.findOne({
        $or: [
          { email: identifierNormalized },
          { username: identifierNormalized }
        ]
      });
      role = 'general';
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
      { expiresIn: '1h' }
    );

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      message: "Login successful",
      user: { ...userData, role },
      token
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
