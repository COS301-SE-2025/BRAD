const User = require('../models/users');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  const { firstname, lastname, username, email, password } = req.body;

  try {
    const emailNormalized = email.toLowerCase().trim();
    const usernameNormalized = username.trim();

    const existingUser = await User.findOne({
      $or: [{ email: emailNormalized }, { username: usernameNormalized }],
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email or username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      lastname,
      username: usernameNormalized,
      email: emailNormalized,
      password: hashedPassword,
      role: 'general', // optional, but explicit
    });

    await newUser.save();

    res.status(201).json({ userId: newUser._id });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

