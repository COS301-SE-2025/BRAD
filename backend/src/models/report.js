const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    trim: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analyzed: {
    type: Boolean,
    default: false
  },
  analysis: {
    type: Object,
    default: null
  },
  investigatorDecision: {
    type: String,
    enum: ['malicious', 'benign', null],
    default: null,
    }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
