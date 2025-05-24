const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');  

const app = express();
app.use(cors());
app.use(express.json());

connectDB(); // Connect to MongoDB

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running with MongoDB' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const testRoutes = require('./routes/test');
app.use('/api', testRoutes);