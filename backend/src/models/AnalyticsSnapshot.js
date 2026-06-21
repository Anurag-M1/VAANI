const mongoose = require('mongoose');

const analyticsSnapshotSchema = new mongoose.Schema({
  snapshot_type: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], required: true },
  date: { type: Date, required: true },
  data: {
    total_filed: Number,
    total_resolved: Number,
    total_pending: Number,
    sla_breached: Number,
    by_district: mongoose.Schema.Types.Mixed,
    by_category: mongoose.Schema.Types.Mixed,
    by_department: mongoose.Schema.Types.Mixed,
    defcon_counts: {
      red: Number,
      orange: Number,
      yellow: Number,
      green: Number,
    },
    avg_resolution_time_h: Number,
    citizen_satisfaction_avg: Number,
  },
}, { timestamps: true });

analyticsSnapshotSchema.index({ snapshot_type: 1, date: -1 });

module.exports = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
