const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const { classifyComplaint, detectDefconLevel, findBestOfficer, generateComplaintId } = require('../services/classifier');
const { sendComplaintConfirmation, sendDefconAlert, sendCitizenVerification } = require('../services/sms');
const { notifyNewComplaint, notifyDefconAlert, notifyComplaintUpdate } = require('../services/notifications');
const mongoose = require('mongoose');

function getQueryByIdOrComplaintId(id) {
  if (!id) return { complaint_id: '' };
  const idStr = String(id);
  if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
    return { _id: idStr };
  }
  return { complaint_id: idStr };
}

function checkComplaintAccess(complaint, user) {
  if (!complaint) return true;
  if (['cm', 'cm_staff', 'super_admin'].includes(user.role)) return true;

  if (user.role === 'district_officer') {
    const userDistrict = user.district ? user.district.toLowerCase().replace(/\s+/g, '_') : '';
    const complaintDistrict = complaint.location?.district ? complaint.location.district.toLowerCase().replace(/\s+/g, '_') : '';
    return userDistrict === complaintDistrict;
  }

  if (['department_manager', 'nodal_officer', 'commissioner'].includes(user.role)) {
    const deptId = complaint.department_id?._id || complaint.department_id;
    return String(deptId) === String(user.department);
  }

  if (user.role === 'officer') {
    const officerId = complaint.assigned_officer_id?._id || complaint.assigned_officer_id;
    return String(officerId) === String(user._id);
  }

  if (user.role === 'citizen') {
    const citizenId = complaint.citizen_id?._id || complaint.citizen_id;
    return String(citizenId) === String(user._id);
  }

  return false;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}


// File a new complaint
exports.fileComplaint = async (req, res) => {
  try {
    const { complaint_text, category, location, media_urls, source } = req.body;
    if (!complaint_text) return res.status(400).json({ error: 'Complaint text is required' });

    // 1. Generate unique ID
    const complaint_id = generateComplaintId();

    // 2. Classify complaint — determine department
    const classification = classifyComplaint(complaint_text, category || '');
    const dept = await Department.findOne({ code: classification.department_code });

    // 3. Detect DEFCON priority
    const defcon = detectDefconLevel(complaint_text);

    // 4. Find best officer
    const officer = await findBestOfficer(classification.department_code, location?.district);

    // 5. Calculate SLA deadline
    const slaHours = defcon.sla_hours.resolution;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000);

    // 6. Create complaint
    const complaint = await Complaint.create({
      complaint_id,
      citizen_id: req.user._id,
      complaint_text,
      media_urls: media_urls || [],
      location: location || {},
      category: category || classification.department_code.toLowerCase(),
      department_id: dept?._id,
      routing_confidence: classification.confidence,
      routing_method: classification.routing_method,
      assigned_officer_id: officer?._id,
      assigned_at: officer ? new Date() : undefined,
      priority: defcon.priority,
      sla_deadline: slaDeadline,
      status: officer ? 'ASSIGNED' : 'FILED',
      source: source || 'web',
      timeline: [
        {
          event: 'Complaint filed',
          actor_id: req.user._id,
          actor_role: req.user.role,
          note: `Filed via ${source || 'web'}`,
          timestamp: new Date(),
        },
        ...(officer ? [{
          event: `Auto-assigned to ${officer.name}`,
          actor_role: 'system',
          note: `Department: ${dept?.code || 'N/A'}, Confidence: ${classification.confidence}%`,
          timestamp: new Date(),
        }] : []),
      ],
    });

    // 7. Update officer's active complaint count
    if (officer) {
      await User.findByIdAndUpdate(officer._id, {
        $inc: { 'officer_profile.active_complaints_count': 1, 'officer_profile.scorecard.total_assigned': 1 },
      });
    }

    // 8. Send SMS confirmation
    await sendComplaintConfirmation(req.user.mobile, complaint_id);

    // 9. DEFCON alerts
    if (defcon.priority === 'DEFCON_RED' || defcon.priority === 'DEFCON_ORANGE') {
      // Notify CM + DM + relevant officers
      const alertRecipients = await User.find({
        $or: [
          { role: 'cm' },
          { role: 'cmo_supervisor' },
          { role: 'dm', district: location?.district },
        ],
      });
      await notifyDefconAlert(complaint, alertRecipients);
    }

    // 10. Emit real-time event
    await notifyNewComplaint(complaint);

    // 11. Log audit event
    const AuditEvent = require('../models/AuditEvent');
    await AuditEvent.create({
      actor_id: req.user._id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'FILE_COMPLAINT',
      target_id: complaint._id,
      target_type: 'Complaint',
      details: `Grievance ID: ${complaint.complaint_id}, Category: ${category || classification.department_code.toLowerCase()}, Priority: ${defcon.priority}`,
    }).catch(err => console.error('Audit log failed:', err.message));

    res.status(201).json({
      success: true,
      complaint: {
        complaint_id: complaint.complaint_id,
        status: complaint.status,
        priority: complaint.priority,
        department: dept?.code,
        routing_confidence: classification.confidence,
        assigned_officer: officer?.name,
        sla_deadline: complaint.sla_deadline,
      },
    });
  } catch (err) {
    console.error('File complaint error:', err);
    res.status(500).json({ error: 'Failed to file complaint' });
  }
};

// List complaints (role-filtered)
exports.listComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, district, category, department, search, sort = '-createdAt' } = req.query;
    const filter = {};

    // Role-based filtering
    switch (req.user.role) {
      case 'citizen':
        filter.citizen_id = req.user._id;
        break;
      case 'officer':
        filter.assigned_officer_id = req.user._id;
        break;
      case 'department_manager':
      case 'nodal_officer':
      case 'commissioner':
        if (req.user.department) filter.department_id = req.user.department;
        break;
      case 'district_officer':
        if (req.user.district) {
          filter['location.district'] = req.user.district.toLowerCase().replace(/\s+/g, '_');
        }
        break;
      // cm, cm_staff, super_admin see all
    }

    // Additional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (district) filter['location.district'] = district.toLowerCase().replace(/\s+/g, '_');
    if (category) filter.category = category;
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        filter.department_id = department;
      } else {
        const dept = await Department.findOne({ code: { $regex: new RegExp('^' + department + '$', 'i') } });
        if (dept) {
          filter.department_id = dept._id;
        }
      }
    }
    if (search) {
      filter.$or = [
        { complaint_id: { $regex: search, $options: 'i' } },
        { complaint_text: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const complaints = await Complaint.find(filter)
      .populate('citizen_id', 'name mobile')
      .populate('assigned_officer_id', 'name officer_profile.designation')
      .populate('department_id', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('List complaints error:', err);
    res.status(500).json({ error: 'Failed to list complaints' });
  }
};

// Get complaint detail
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id))
      .populate('citizen_id', 'name mobile')
      .populate('assigned_officer_id', 'name mobile officer_profile')
      .populate('department_id', 'name code helpline sla_hours')
      .populate('escalated_to', 'name role')
      .populate({ path: 'timeline.actor_id', select: 'name' });

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to view this complaint.' });
    }
    res.json({ complaint });
  } catch (err) {
    console.error('Get complaint error:', err);
    res.status(500).json({ error: 'Failed to get complaint' });
  }
};

// Update complaint status
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id));
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to modify this complaint.' });
    }

    // Validate lifecycle transitions
    const validTransitions = {
      'FILED': ['ASSIGNED', 'ESCALATED', 'DEFCON_ALERT'],
      'PENDING_ASSIGN': ['ASSIGNED', 'ESCALATED'],
      'ASSIGNED': ['IN_PROGRESS', 'ESCALATED', 'PENDING_CLOSURE'],
      'IN_PROGRESS': ['PENDING_CLOSURE', 'ESCALATED'],
      'PENDING_CLOSURE': ['PROVISIONALLY_CLOSED', 'CLOSED', 'DISPUTED'],
      'PROVISIONALLY_CLOSED': ['DEPT_VERIFIED', 'CLOSED', 'DISPUTED'],
      'DEPT_VERIFIED': ['DM_VERIFIED', 'CLOSED'],
      'DM_VERIFIED': ['CLOSED'],
      'DISPUTED': ['ASSIGNED', 'IN_PROGRESS', 'ESCALATED'],
      'PROVISIONALLY_CLOSED': ['CLOSED'],
      'CLOSED': [],
      'ESCALATED': ['ASSIGNED', 'IN_PROGRESS', 'CLOSED'],
      'DEFCON_ALERT': ['ASSIGNED', 'CLOSED', 'ESCALATED']
    };

    const currentStatus = complaint.status || 'FILED';
    const targetStatus = status.toUpperCase();

    if (currentStatus !== targetStatus) {
      const allowed = validTransitions[currentStatus] || [];
      if (!allowed.includes(targetStatus)) {
        return res.status(400).json({
          error: 'Invalid status transition',
          message: `Cannot transition from '${currentStatus}' to '${targetStatus}'. Allowed: ${allowed.join(', ') || 'None'}`
        });
      }
    }

    complaint.status = targetStatus;
    complaint.timeline.push({
      event: `Status changed to ${targetStatus}`,
      actor_id: req.user._id,
      actor_role: req.user.role,
      note,
      timestamp: new Date(),
    });
    await complaint.save();
    await notifyComplaintUpdate(complaint);

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// Add timeline entry
exports.addTimeline = async (req, res) => {
  try {
    const { event, note, media_urls } = req.body;
    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id));
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to comment on this complaint.' });
    }

    const actorName = req.user.name || req.user.role;
    const dynamicEvent = (event && !event.startsWith('Administrator')) ? event : `Note added by ${actorName} (${req.user.role})`;

    complaint.timeline.push({
      event: dynamicEvent,
      actor_id: req.user._id,
      actor_role: req.user.role,
      note,
      media_urls,
      timestamp: new Date(),
    });
    await complaint.save();
    await notifyComplaintUpdate(complaint);

    res.json({ success: true, timeline: complaint.timeline });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add timeline entry' });
  }
};

// Officer initiates closure (Anti-False-Closure Engine)
exports.resolveComplaint = async (req, res) => {
  try {
    const { speaking_order, resolution_photos, resolution_type } = req.body;

    // HARD BLOCK: Speaking order minimum 80 characters
    if (!speaking_order || speaking_order.length < 80) {
      return res.status(400).json({
        error: 'Speaking order must be at least 80 characters',
        message: 'You must describe: what was found + what was done + evidence. This is a mandatory requirement.',
        current_length: speaking_order?.length || 0,
        required: 80,
      });
    }

    // HARD BLOCK: At least 1 resolution photo
    if (!resolution_photos || resolution_photos.length === 0) {
      return res.status(400).json({
        error: 'At least 1 resolution photo is required',
        message: 'Resolution photo with watermark is mandatory for closure. No photo = cannot close.',
      });
    }

    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id)).populate('citizen_id', 'mobile name');

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to resolve this complaint.' });
    }

    // Set closure data
    const anti_false_closure_flags = [];
    const compCoords = complaint.location?.coords;
    if (compCoords && compCoords.lat && compCoords.lng) {
      for (const photo of resolution_photos) {
        if (photo.gps && photo.gps.lat && photo.gps.lng) {
          const dist = calculateDistance(compCoords.lat, compCoords.lng, photo.gps.lat, photo.gps.lng);
          if (dist > 200) {
            anti_false_closure_flags.push(`GPS Mismatch: Photo uploaded ${Math.round(dist)}m away from complaint site`);
            // Penalize officer credibility score for false closure attempt
            await User.findByIdAndUpdate(req.user._id, {
              $inc: { 'officer_profile.scorecard.credibility_score': -5 }
            });
          }
        }
      }
    }

    complaint.closure = {
      speaking_order,
      resolution_photos: resolution_photos.map(p => ({
        url: p.url || p,
        watermarked: true,
        gps: p.gps,
        uploaded_at: new Date(),
      })),
      resolution_type: resolution_type || 'fixed',
      citizen_verification: {
        sms_sent_at: new Date(),
        response: null,
      },
      officer_closed_at: new Date(),
      anti_false_closure_flags,
    };

    complaint.status = 'PENDING_CLOSURE';
    complaint.timeline.push({
      event: 'Field Officer Solved and Closed',
      actor_id: req.user._id,
      actor_role: 'officer',
      note: `Speaking order: ${speaking_order.substring(0, 100)}...${anti_false_closure_flags.length > 0 ? ' [FLAGGED: ' + anti_false_closure_flags.join(', ') + ']' : ''}`,
      timestamp: new Date(),
    });
    await complaint.save();

    // Log audit event
    const AuditEvent = require('../models/AuditEvent');
    await AuditEvent.create({
      actor_id: req.user._id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'RESOLVE_COMPLAINT',
      target_id: complaint._id,
      target_type: 'Complaint',
      details: `Resolution type: ${resolution_type || 'fixed'}, speaking order length: ${speaking_order.length}. Flags: ${anti_false_closure_flags.join(', ') || 'None'}`,
    }).catch(err => console.error('Audit log failed:', err.message));

    // Send citizen verification SMS
    if (complaint.citizen_id?.mobile) {
      await sendCitizenVerification(
        complaint.citizen_id.mobile,
        complaint.complaint_id,
        req.user.name
      );
    }
    // Trigger citizen portal verification notification
    const { createNotification } = require('../services/notifications');
    await createNotification({
      recipientId: complaint.citizen_id._id || complaint.citizen_id,
      type: 'in_app',
      event: 'pending-closure',
      message: `Verification Required: Resolution proposed for complaint ${complaint.complaint_id} by ${req.user.name}. Please verify.`,
      complaintId: complaint._id,
    });

    await notifyComplaintUpdate(complaint);

    res.json({
      success: true,
      message: 'Closure initiated. Awaiting citizen verification (72h window).',
      complaint_id: complaint.complaint_id,
      status: 'PENDING_CLOSURE',
    });
  } catch (err) {
    console.error('Resolve complaint error:', err);
    res.status(500).json({ error: 'Failed to initiate closure' });
  }
};

// Citizen confirms or disputes resolution
exports.citizenVerify = async (req, res) => {
  try {
    const { response } = req.body; // 'confirmed' or 'disputed'
    if (!['confirmed', 'disputed'].includes(response)) {
      return res.status(400).json({ error: 'Response must be "confirmed" or "disputed"' });
    }

    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id)).populate('assigned_officer_id');

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to verify this complaint.' });
    }

    complaint.closure.citizen_verification.response = response;
    complaint.closure.citizen_verification.responded_at = new Date();

    if (response === 'confirmed') {
      complaint.status = 'PROVISIONALLY_CLOSED';
      complaint.closure.final_closed_at = new Date();
      complaint.timeline.push({
        event: 'Citizen confirmed resolution',
        actor_id: req.user._id,
        actor_role: 'citizen',
        timestamp: new Date(),
      });

      // Update officer scorecard positively
      if (complaint.assigned_officer_id) {
        await User.findByIdAndUpdate(complaint.assigned_officer_id._id, {
          $inc: {
            'officer_profile.scorecard.total_resolved': 1,
            'officer_profile.active_complaints_count': -1,
            'officer_profile.scorecard.credibility_score': 2, // +2 for on-time
          },
        });
      }
    } else {
      // DISPUTED — auto-escalate
      complaint.status = 'DISPUTED';
      complaint.closure.anti_false_closure_flags.push('Citizen disputed resolution');
      complaint.timeline.push({
        event: '⚠️ Citizen DISPUTED resolution — Auto-escalated to Nodal Officer',
        actor_id: req.user._id,
        actor_role: 'citizen',
        timestamp: new Date(),
      });

      // Penalize officer: -5 credibility
      if (complaint.assigned_officer_id) {
        await User.findByIdAndUpdate(complaint.assigned_officer_id._id, {
          $inc: {
            'officer_profile.scorecard.total_disputed': 1,
            'officer_profile.scorecard.credibility_score': -5,
          },
        });
      }
    }

    await complaint.save();
    await notifyComplaintUpdate(complaint);

    // Log audit event
    const AuditEvent = require('../models/AuditEvent');
    await AuditEvent.create({
      actor_id: req.user._id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'CITIZEN_VERIFY',
      target_id: complaint._id,
      target_type: 'Complaint',
      details: `Citizen verification response: ${response}`,
    }).catch(err => console.error('Audit log failed:', err.message));

    res.json({ success: true, status: complaint.status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process verification' });
  }
};

// Escalate complaint
exports.escalateComplaint = async (req, res) => {
  try {
    const { reason, escalate_to_id } = req.body;
    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id));
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to escalate this complaint.' });
    }

    complaint.status = 'ESCALATED';
    if (escalate_to_id) complaint.escalated_to = escalate_to_id;
    complaint.timeline.push({
      event: 'Complaint escalated',
      actor_id: req.user._id,
      actor_role: req.user.role,
      note: reason,
      timestamp: new Date(),
    });
    await complaint.save();
    await notifyComplaintUpdate(complaint);

    // Log audit event
    const AuditEvent = require('../models/AuditEvent');
    await AuditEvent.create({
      actor_id: req.user._id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'ESCALATE_COMPLAINT',
      target_id: complaint._id,
      target_type: 'Complaint',
      details: `Reason: ${reason}`,
    }).catch(err => console.error('Audit log failed:', err.message));

    res.json({ success: true, status: 'ESCALATED' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to escalate' });
  }
};

// CM flags complaint
exports.cmFlag = async (req, res) => {
  try {
    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id));
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to manage this complaint.' });
    }

    complaint.cm_flagged = true;
    complaint.timeline.push({
      event: '🏛️ CM flagged for attention',
      actor_id: req.user._id,
      actor_role: 'cm',
      timestamp: new Date(),
    });
    await complaint.save();
    await notifyComplaintUpdate(complaint);

    // Log audit event
    const AuditEvent = require('../models/AuditEvent');
    await AuditEvent.create({
      actor_id: req.user._id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'CM_FLAG',
      target_id: complaint._id,
      target_type: 'Complaint',
      details: `CM flagged complaint`,
    }).catch(err => console.error('Audit log failed:', err.message));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to flag' });
  }
};

// CM adds directive
exports.cmDirective = async (req, res) => {
  try {
    const { directive } = req.body;
    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id));
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to issue directives for this complaint.' });
    }

    complaint.cm_directive = directive;
    complaint.cm_flagged = true;
    complaint.timeline.push({
      event: '🏛️ CM Directive added',
      actor_id: req.user._id,
      actor_role: 'cm',
      note: directive,
      timestamp: new Date(),
    });
    await complaint.save();
    await notifyComplaintUpdate(complaint);

    // Log audit event
    const AuditEvent = require('../models/AuditEvent');
    await AuditEvent.create({
      actor_id: req.user._id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'CM_DIRECTIVE',
      target_id: complaint._id,
      target_type: 'Complaint',
      details: `Directive: ${directive}`,
    }).catch(err => console.error('Audit log failed:', err.message));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add directive' });
  }
};

// Duplicate check
exports.duplicateCheck = async (req, res) => {
  try {
    const { lat, lng, category } = req.query;
    if (!lat || !lng) return res.json({ duplicates: [] });

    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);

    const nearby = await Complaint.find({
      'location.coords': {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 200, // 200 meters
        },
      },
      category: category || { $exists: true },
      createdAt: { $gte: fourteenDaysAgo },
      status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] },
    }).limit(5);

    res.json({ duplicates: nearby });
  } catch (err) {
    // Graceful fallback if 2dsphere index doesn't exist yet
    res.json({ duplicates: [] });
  }
};

// Get officer queue
exports.officerQueue = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      assigned_officer_id: req.user._id,
      status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] },
    })
      .populate('citizen_id', 'name mobile')
      .populate('department_id', 'name code')
      .sort({ priority: 1, sla_deadline: 1 }); // DEFCON_RED first

    res.json({ complaints, total: complaints.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get queue' });
  }
};

// Get citizen's own complaints
exports.myComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizen_id: req.user._id })
      .populate('department_id', 'name code')
      .populate('assigned_officer_id', 'name')
      .sort('-createdAt');

    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get complaints' });
  }
};

// Extend SLA Deadline
exports.extendSla = async (req, res) => {
  try {
    const { hours, reason } = req.body;
    if (!hours || isNaN(hours)) {
      return res.status(400).json({ error: 'Valid hours value is required' });
    }

    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id));
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to extend the SLA of this complaint.' });
    }

    const additionalMs = parseInt(hours) * 60 * 60 * 1000;
    complaint.sla_deadline = new Date(new Date(complaint.sla_deadline).getTime() + additionalMs);
    complaint.sla_breached = false; // Reset breach flag

    const actorName = req.user.name || req.user.role;
    complaint.timeline.push({
      event: 'SLA Deadline Extended',
      actor_id: req.user._id,
      actor_role: req.user.role,
      note: `Extended by ${hours} hours. Reason: ${reason || 'None provided'}`,
      timestamp: new Date()
    });

    await complaint.save();
    await notifyComplaintUpdate(complaint);

    res.json({ success: true, complaint });
  } catch (err) {
    console.error('Extend SLA error:', err);
    res.status(500).json({ error: 'Failed to extend SLA deadline' });
  }
};

// Department Manager verifies resolution (after citizen confirms)
exports.deptVerify = async (req, res) => {
  try {
    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id))
      .populate('citizen_id', 'name mobile');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (complaint.status !== 'PROVISIONALLY_CLOSED') {
      return res.status(400).json({ error: 'Complaint must be in PROVISIONALLY_CLOSED status for department verification' });
    }

    complaint.status = 'DEPT_VERIFIED';
    complaint.timeline.push({
      event: 'Department Verified and Closed',
      actor_id: req.user._id,
      actor_role: req.user.role,
      note: req.body.note || 'Department has verified the resolution is satisfactory.',
      timestamp: new Date(),
    });
    await complaint.save();

    const { createNotification } = require('../services/notifications');
    await createNotification({
      recipientId: complaint.citizen_id._id || complaint.citizen_id,
      type: 'in_app',
      event: 'dept-verified',
      message: `Your complaint ${complaint.complaint_id} has been verified by the department. Awaiting DM verification.`,
      complaintId: complaint._id,
    });

    await notifyComplaintUpdate(complaint);

    const AuditEvent = require('../models/AuditEvent');
    await AuditEvent.create({
      actor_id: req.user._id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'DEPT_VERIFY',
      target_id: complaint._id,
      target_type: 'Complaint',
      details: 'Department manager verified closure',
    }).catch(err => console.error('Audit log failed:', err.message));

    res.json({ success: true, status: complaint.status });
  } catch (err) {
    console.error('Dept verify error:', err);
    res.status(500).json({ error: 'Failed to verify' });
  }
};

// District Magistrate verifies resolution (after dept verifies)
exports.dmVerify = async (req, res) => {
  try {
    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id))
      .populate('citizen_id', 'name mobile');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!checkComplaintAccess(complaint, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (complaint.status !== 'DEPT_VERIFIED') {
      return res.status(400).json({ error: 'Complaint must be in DEPT_VERIFIED status for DM verification' });
    }

    complaint.status = 'DM_VERIFIED';
    complaint.timeline.push({
      event: 'District Magistrate Verified and Closed',
      actor_id: req.user._id,
      actor_role: req.user.role,
      note: req.body.note || 'DM has verified the resolution.',
      timestamp: new Date(),
    });
    await complaint.save();

    const { createNotification } = require('../services/notifications');
    await createNotification({
      recipientId: complaint.citizen_id._id || complaint.citizen_id,
      type: 'in_app',
      event: 'dm-verified',
      message: `Your complaint ${complaint.complaint_id} has been verified by the District Magistrate. Please rate your experience.`,
      complaintId: complaint._id,
    });

    await notifyComplaintUpdate(complaint);

    const AuditEvent = require('../models/AuditEvent');
    await AuditEvent.create({
      actor_id: req.user._id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'DM_VERIFY',
      target_id: complaint._id,
      target_type: 'Complaint',
      details: 'District Magistrate verified closure',
    }).catch(err => console.error('Audit log failed:', err.message));

    res.json({ success: true, status: complaint.status });
  } catch (err) {
    console.error('DM verify error:', err);
    res.status(500).json({ error: 'Failed to verify' });
  }
};

// Citizen rates complaint after closure
exports.citizenRate = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const complaint = await Complaint.findOne(getQueryByIdOrComplaintId(req.params.id));
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (!['DM_VERIFIED', 'PROVISIONALLY_CLOSED', 'DEPT_VERIFIED'].includes(complaint.status)) {
      return res.status(400).json({ error: 'Complaint must be verified before rating' });
    }

    complaint.citizen_rating = rating;
    complaint.citizen_feedback_text = feedback || '';
    complaint.status = 'CLOSED';
    complaint.closure = complaint.closure || {};
    complaint.closure.final_closed_at = new Date();

    const stars = '⭐'.repeat(rating);
    complaint.timeline.push({
      event: `User Review: ${stars} (${rating}/5)`,
      actor_id: req.user._id,
      actor_role: 'citizen',
      note: feedback || 'No feedback provided',
      timestamp: new Date(),
    });
    await complaint.save();
    await notifyComplaintUpdate(complaint);

    // Update officer scorecard with citizen rating
    if (complaint.assigned_officer_id) {
      const officerId = complaint.assigned_officer_id._id || complaint.assigned_officer_id;
      await User.findByIdAndUpdate(officerId, {
        $inc: { 'officer_profile.scorecard.credibility_score': rating >= 4 ? 3 : (rating >= 3 ? 1 : -2) }
      });
    }

    const AuditEvent = require('../models/AuditEvent');
    await AuditEvent.create({
      actor_id: req.user._id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'CITIZEN_RATE',
      target_id: complaint._id,
      target_type: 'Complaint',
      details: `Rating: ${rating}/5, Feedback: ${feedback || 'None'}`,
    }).catch(err => console.error('Audit log failed:', err.message));

    res.json({ success: true, status: 'CLOSED', rating });
  } catch (err) {
    console.error('Citizen rate error:', err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

