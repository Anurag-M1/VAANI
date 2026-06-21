const mongoose = require('mongoose');

const visitLogSchema = new mongoose.Schema({
  visitor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visitor_role: String,
  location: {
    lat: Number,
    lng: Number,
    address: String,
    district: String,
    ward: String,
  },
  visit_date: { type: Date, required: true },
  purpose: String,
  complaints_in_radius: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
  actions_taken: String,
  photos: [String],
}, { timestamps: true });

module.exports = mongoose.model('VisitLog', visitLogSchema);
