const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const TestModel = mongoose.model('Test', testSchema);

router.get('/test-db', async (req, res) => {
  try {
    const test = await TestModel.create({ message: 'MongoDB is working!' });
    res.status(200).json({ message: 'MongoDB connected', inserted: test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
