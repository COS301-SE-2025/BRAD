const jwt = require('jsonwebtoken');
const User = require('../models/users');
const Admin = require('../models/admin');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: 'Access token missing' });

  try {
   const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with env var

    let user = await Admin.findById(decoded.id);
    if (!user) user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
