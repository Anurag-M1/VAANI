const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_hi: String,
  code: {
    type: String,
    required: true,
    unique: true,
    enum: ['MCD', 'DJB', 'PWD', 'BSES', 'NDMC', 'DDA', 'DTC', 'DP', 'DFS', 'DPCC', 'DUSIB', 'CMO'],
  },
  helpline: String,
  categories: [String],
  districts_covered: [String],
  external_api: {
    base_url: String,
    is_active: { type: Boolean, default: false },
    auth_type: String,
  },
  sla_hours: {
    critical: { type: Number, default: 4 },
    high: { type: Number, default: 24 },
    standard: { type: Number, default: 168 },
    low: { type: Number, default: 336 },
  },
  nodal_officer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
