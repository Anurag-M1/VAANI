const mongoose = require('mongoose');

const officerScoreSchema = new mongoose.Schema({
  officer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // e.g. "2026-06"
  resolved_count: { type: Number, default: 0 },
  assigned_count: { type: Number, default: 0 },
  disputed_count: { type: Number, default: 0 },
  credibility_score: { type: Number, default: 100 },
  anomaly_flags: { type: Number, default: 0 },
}, { timestamps: true });

officerScoreSchema.index({ officer_id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('OfficerScore', officerScoreSchema);
