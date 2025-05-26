const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');
const User = require('../models/users');

exports.addAdmin = async (req, res) => {
  const { firstname, lastname, email, username, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Email or username already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      firstname,
      lastname,
      email,
      username,
      password: hashedPassword,
    });

    await newAdmin.save();

    const { password: _, ...adminData } = newAdmin.toObject();
    res.status(201).json({ message: 'Admin created successfully', admin: adminData });
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.promoteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'investigator') {
      return res.status(400).json({ message: 'User is already an investigator' });
    }

    user.role = 'investigator';
    await user.save();

    res.status(200).json({ message: 'User promoted to investigator', user });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.demoteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'general') {
      return res.status(400).json({ message: 'User is already a general user' });
    }

    user.role = 'general';
    await user.save();

    res.status(200).json({ message: 'User demoted to general ', user });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
