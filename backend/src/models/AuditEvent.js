const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema({
  actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actor_name: String,
  actor_role: String,
  action: { type: String, required: true }, // e.g. 'FILE_COMPLAINT', 'RESOLVE_COMPLAINT', 'CM_DIRECTIVE'
  target_id: mongoose.Schema.Types.ObjectId,
  target_type: String, // e.g. 'Complaint', 'VisitLog'
  details: String,
  ip_address: String,
}, { timestamps: true });

auditEventSchema.index({ actor_id: 1, action: 1 });
auditEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
