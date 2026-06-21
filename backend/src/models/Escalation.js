const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema({
  complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  escalated_from_role: String,
  escalated_to_role: String,
  escalated_by_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  escalated_to_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, required: true },
  is_resolved: { type: Boolean, default: false },
  resolved_at: Date,
}, { timestamps: true });

module.exports = mongoose.model('Escalation', escalationSchema);
