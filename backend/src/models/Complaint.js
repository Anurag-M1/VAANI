const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema({
  event: { type: String, required: true },
  actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actor_role: String,
  note: String,
  media_urls: [String],
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const closureSchema = new mongoose.Schema({
  speaking_order: { type: String, minlength: 80 },
  resolution_photos: [{ url: String, watermarked: Boolean, gps: { lat: Number, lng: Number }, uploaded_at: Date }],
  resolution_type: { type: String, enum: ['fixed', 'forwarded', 'not_applicable', 'rejected'] },
  citizen_verification: {
    sms_sent_at: Date,
    response: { type: String, enum: ['confirmed', 'disputed', 'no_response'] },
    responded_at: Date,
  },
  officer_closed_at: Date,
  final_closed_at: Date,
  anti_false_closure_flags: [String],
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  complaint_id: { type: String, required: true, unique: true }, // VAANI-YYYYMMDD-XXXXX
  citizen_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  complaint_text: { type: String, required: true },
  media_urls: [{
    url: String,
    type: { type: String, enum: ['photo', 'video'] },
    uploaded_at: Date,
    gps: { lat: Number, lng: Number },
  }],
  location: {
    coords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    address: String,
    ward: String,
    zone: String,
    district: String,
    pincode: String,
  },
  category: { type: String, required: true },
  sub_category: String,
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  routing_confidence: Number,
  routing_method: { type: String, enum: ['auto_nlp', 'manual', 'citizen_confirmed'] },
  external_refs: [{
    system: { type: String, enum: ['mcd311', 'pgms', 'djb', 'pwd'] },
    external_id: String,
    sync_status: { type: String, enum: ['pending', 'synced', 'failed'] },
    synced_at: Date,
  }],
  assigned_officer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_at: Date,
  priority: {
    type: String,
    enum: ['DEFCON_RED', 'DEFCON_ORANGE', 'DEFCON_YELLOW', 'DEFCON_GREEN'],
    default: 'DEFCON_GREEN',
  },
  sla_deadline: Date,
  sla_breached: { type: Boolean, default: false },
  status: {
    type: String,
    enum: [
      'FILED', 'PENDING_ASSIGN', 'ASSIGNED', 'IN_PROGRESS',
      'PENDING_CLOSURE', 'DEPT_VERIFIED', 'DM_VERIFIED',
      'DISPUTED', 'PROVISIONALLY_CLOSED',
      'CLOSED', 'ESCALATED', 'DEFCON_ALERT',
    ],
    default: 'FILED',
  },
  timeline: [timelineEntrySchema],
  closure: closureSchema,
  citizen_rating: { type: Number, min: 1, max: 5 },
  citizen_feedback_text: String,
  source: {
    type: String,
    enum: ['web', 'whatsapp', 'ivr', 'twitter', 'manual'],
    default: 'web',
  },
  duplicate_of: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  linked_complaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
  escalated_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cm_flagged: { type: Boolean, default: false },
  cm_directive: String,
  visit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitLog' },
  ai_analysis: {
    is_fake: { type: Boolean, default: false },
    fraud_probability: { type: Number, default: 0 },
    evidence_authentic: { type: Boolean, default: true },
    authenticity_score: { type: Number, default: 100 },
    flags: [String],
    verdict: { type: String, enum: ['PASSED', 'WARNING', 'FAILED'], default: 'PASSED' },
    checked_at: { type: Date, default: Date.now }
  }
}, { timestamps: true });

// Indexes per spec
complaintSchema.index({ 'location.district': 1, status: 1, createdAt: -1 });
complaintSchema.index({ 'location.coords': '2dsphere' });
complaintSchema.index({ assigned_officer_id: 1, status: 1 });
complaintSchema.index({ priority: 1, sla_deadline: 1 });
complaintSchema.index({ cm_flagged: 1 });
complaintSchema.index({ complaint_id: 1 }, { unique: true });
complaintSchema.index({ citizen_id: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
