const mongoose = require('mongoose');

const governanceScoreSchema = new mongoose.Schema({
  district: { type: String, required: true },
  month: { type: String, required: true }, // e.g. "2026-06"
  resolution_rate: { type: Number, default: 0 },
  on_time_rate: { type: Number, default: 0 },
  false_closure_rate: { type: Number, default: 0 },
  score: { type: Number, default: 0 }, // 0 to 100
  total_complaints: { type: Number, default: 0 },
  resolved_complaints: { type: Number, default: 0 },
  disputed_complaints: { type: Number, default: 0 },
  sla_breached_complaints: { type: Number, default: 0 },
}, { timestamps: true });

governanceScoreSchema.index({ district: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('GovernanceScore', governanceScoreSchema);
