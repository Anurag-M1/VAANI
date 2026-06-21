const mongoose = require('mongoose');

const hotspotCacheSchema = new mongoose.Schema({
  district: { type: String, required: true },
  ward: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  category: { type: String, required: true },
  complaint_count: { type: Number, default: 0 },
  critical_count: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now },
}, { timestamps: true });

hotspotCacheSchema.index({ district: 1, category: 1 });

module.exports = mongoose.model('HotspotCache', hotspotCacheSchema);
