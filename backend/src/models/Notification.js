const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['sms', 'push', 'in_app'], default: 'in_app' },
  event: { type: String, required: true },
  message: { type: String, required: true },
  complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  is_read: { type: Boolean, default: false },
  sent_at: { type: Date, default: Date.now },
  delivery_status: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' },
}, { timestamps: true });

notificationSchema.index({ recipient_id: 1, is_read: 1, sent_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
