const mongoose = require('mongoose');

const riskScoreSchema = new mongoose.Schema({
  officer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  district: { type: String, required: true },
  false_closure_rate: { type: Number, default: 0 },
  speed_anomaly_count: { type: Number, default: 0 },
  after_hours_closure_count: { type: Number, default: 0 },
  copy_paste_count: { type: Number, default: 0 },
  recurrence_count: { type: Number, default: 0 },
  score: { type: Number, default: 0 }, // 0 to 100 (high = high risk)
  risk_level: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' }
}, { timestamps: true });

riskScoreSchema.index({ officer_id: 1 }, { unique: true });
riskScoreSchema.index({ district: 1 });

module.exports = mongoose.model('RiskScore', riskScoreSchema);
