const mongoose = require('mongoose');

const officerProfileSchema = new mongoose.Schema({
  employee_id: String,
  designation: String,
  active_complaints_count: { type: Number, default: 0 },
  max_capacity: { type: Number, default: 20 },
  is_available: { type: Boolean, default: true },
  contact_phone: String,
  scorecard: {
    total_assigned: { type: Number, default: 0 },
    total_resolved: { type: Number, default: 0 },
    total_disputed: { type: Number, default: 0 },
    false_closure_rate: { type: Number, default: 0 },
    avg_resolution_time_hours: { type: Number, default: 0 },
    citizen_satisfaction_avg: { type: Number, default: 0 },
    on_time_rate: { type: Number, default: 0 },
    anomaly_flag_count: { type: Number, default: 0 },
    credibility_score: { type: Number, default: 100 },
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  email: String,
  role: {
    type: String,
    required: true,
    enum: ['citizen', 'officer', 'department_manager', 'district_officer', 'nodal_officer', 'commissioner', 'cm_staff', 'cm', 'super_admin'],
    default: 'citizen',
  },
  district: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  ward: String,
  language_preference: { type: String, enum: ['en', 'hi'], default: 'en' },
  officer_profile: officerProfileSchema,
  otp: String,
  otp_expires: Date,
  refresh_token: String,
  is_active: { type: Boolean, default: true },
  last_login: Date,
}, { timestamps: true });

userSchema.index({ mobile: 1 }, { unique: true });
userSchema.index({ role: 1, district: 1 });
userSchema.index({ department: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
