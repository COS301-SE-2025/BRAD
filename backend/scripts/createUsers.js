//How to run:
// cd backend
//node scripts/createUsers.js
//password123

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/users'); // adjust path if needed
const connectDB = require('../src/config/db'); // adjust if your DB file is different

const createUsers = async () => {
  await connectDB();

  const password = 'password123';
  const hashed = await bcrypt.hash(password, 10);

  const users = [
    {
      firstname: 'Alice',
      lastname: 'Admin',
      username: 'adminUser',
      email: 'admin@example.com',
      role: 'admin',
      password: hashed
    },
    {
      firstname: 'Gary',
      lastname: 'General',
      username: 'generalUser',
      email: 'general@example.com',
      role: 'general',
      password: hashed
    },
    {
      firstname: 'Ivan',
      lastname: 'Investigator',
      username: 'investigatorUser',
      email: 'investigator@example.com',
      role: 'investigator',
      password: hashed
    }
  ];

  try {
    await User.deleteMany({ username: { $in: users.map(u => u.username) } }); // optional cleanup
    const created = await User.insertMany(users);
    console.log('Users created:', created.map(u => u.username));
  } catch (err) {
    console.error('Error creating users:', err);
  } finally {
    mongoose.connection.close();
  }
};

createUsers();
