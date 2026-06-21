const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const DistrictWard = require('../models/DistrictWard');

// === ANALYTICS ROUTES ===

// Dashboard KPIs
router.get('/dashboard', auth, authorize('cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin'), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const filter = {};
    switch (req.user.role) {
      case 'department_manager':
      case 'nodal_officer':
      case 'commissioner':
        if (req.user.department) filter.department_id = req.user.department;
        break;
      case 'district_officer':
        if (req.user.district) filter['location.district'] = req.user.district.toLowerCase().replace(/\s+/g, '_');
        break;
    }

    const [total, todayFiled, todayResolved, pending, defconRed, defconOrange, slaBreach, disputed] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.countDocuments({ ...filter, createdAt: { $gte: today } }),
      Complaint.countDocuments({ ...filter, status: { $in: ['CLOSED', 'PROVISIONALLY_CLOSED'] }, 'closure.final_closed_at': { $gte: today } }),
      Complaint.countDocuments({ ...filter, status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] } }),
      Complaint.countDocuments({ ...filter, priority: 'DEFCON_RED', status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] } }),
      Complaint.countDocuments({ ...filter, priority: 'DEFCON_ORANGE', status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] } }),
      Complaint.countDocuments({ ...filter, sla_breached: true, status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] } }),
      Complaint.countDocuments({ ...filter, status: 'DISPUTED' }),
    ]);

    res.json({
      total, todayFiled, todayResolved, pending,
      defconRed, defconOrange, slaBreach, disputed,
      criticalAlerts: defconRed + defconOrange,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Heatmap data — geo-aggregated by district
router.get('/heatmap', auth, async (req, res) => {
  try {
    const pipeline = [
      { $match: { status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] } } },
      { $group: {
        _id: '$location.district',
        total: { $sum: 1 },
        defcon_red: { $sum: { $cond: [{ $eq: ['$priority', 'DEFCON_RED'] }, 1, 0] } },
        defcon_orange: { $sum: { $cond: [{ $eq: ['$priority', 'DEFCON_ORANGE'] }, 1, 0] } },
        sla_breached: { $sum: { $cond: ['$sla_breached', 1, 0] } },
        avg_lat: { $avg: '$location.coords.lat' },
        avg_lng: { $avg: '$location.coords.lng' },
      }},
      { $sort: { total: -1 } },
    ];
    const heatmap = await Complaint.aggregate(pipeline);
    res.json({ heatmap });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get heatmap data' });
  }
});

// District leaderboard
router.get('/leaderboard/districts', auth, async (req, res) => {
  try {
    const districts = await DistrictWard.find().lean();
    const leaderboard = [];

    const GovernanceScore = require('../models/GovernanceScore');
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-06"

    for (const d of districts) {
      const [total, resolved, pending, disputed, slaBreached, resolvedSLABreached] = await Promise.all([
        Complaint.countDocuments({ 'location.district': d.code }),
        Complaint.countDocuments({ 'location.district': d.code, status: { $in: ['CLOSED', 'PROVISIONALLY_CLOSED'] } }),
        Complaint.countDocuments({ 'location.district': d.code, status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] } }),
        Complaint.countDocuments({ 'location.district': d.code, status: 'DISPUTED' }),
        Complaint.countDocuments({ 'location.district': d.code, sla_breached: true }),
        Complaint.countDocuments({ 'location.district': d.code, status: { $in: ['CLOSED', 'PROVISIONALLY_CLOSED'] }, sla_breached: true }),
      ]);

      const dm = d.dm_id ? await User.findById(d.dm_id).select('name') : null;

      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      const onTimeResolved = resolved - resolvedSLABreached;
      const onTimeRate = resolved > 0 ? Math.round((onTimeResolved / resolved) * 100) : 100;
      const falseClosureRate = resolved > 0 ? Math.round((disputed / resolved) * 100) : 0;

      // Governance score: 50% Resolution Rate, 30% On-time Rate, 20% (100 - False Closure Rate)
      const score = Math.round((resolutionRate * 0.5) + (onTimeRate * 0.3) + ((100 - falseClosureRate) * 0.2));

      await GovernanceScore.findOneAndUpdate(
        { district: d.code, month: currentMonth },
        {
          resolution_rate: resolutionRate,
          on_time_rate: onTimeRate,
          false_closure_rate: falseClosureRate,
          score,
          total_complaints: total,
          resolved_complaints: resolved,
          disputed_complaints: disputed,
          sla_breached_complaints: slaBreached,
        },
        { upsert: true, new: true }
      ).catch(e => console.error('GovernanceScore upsert failed:', e.message));

      leaderboard.push({
        district: d.district_name,
        code: d.code,
        dm_name: dm?.name || 'Unassigned',
        total, resolved, pending, disputed, slaBreached,
        resolution_rate: resolutionRate,
        false_closure_rate: falseClosureRate,
        on_time_rate: onTimeRate,
        score,
      });
    }

    leaderboard.sort((a, b) => b.score - a.score);
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Officer leaderboard
router.get('/leaderboard/officers', auth, async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer', is_active: true })
      .populate('department', 'name code')
      .sort('-officer_profile.scorecard.credibility_score')
      .limit(20);

    res.json({ officers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get officer leaderboard' });
  }
});

// DEFCON alerts
router.get('/defcon', auth, async (req, res) => {
  try {
    const alerts = await Complaint.find({
      priority: { $in: ['DEFCON_RED', 'DEFCON_ORANGE'] },
      status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] },
    })
      .populate('citizen_id', 'name mobile')
      .populate('assigned_officer_id', 'name')
      .sort({ priority: 1, createdAt: -1 })
      .limit(50);

    res.json({ alerts, total: alerts.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get DEFCON alerts' });
  }
});

// Trends
router.get('/trends', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - i); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const [filed, resolved] = await Promise.all([
        Complaint.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        Complaint.countDocuments({ 'closure.final_closed_at': { $gte: start, $lt: end } }),
      ]);
      trends.push({ date: start.toISOString().slice(0, 10), filed, resolved });
    }
    res.json({ trends });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

// === DETAILED ANALYTICS ===
router.get('/analytics/detailed', auth, async (req, res) => {
  try {
    const filter = {};
    if (['department_manager', 'nodal_officer', 'commissioner'].includes(req.user.role)) {
      if (req.user.department) filter.department_id = req.user.department;
    } else if (req.user.role === 'district_officer') {
      if (req.user.district) filter['location.district'] = req.user.district.toLowerCase().replace(/\s+/g, '_');
    }

    const allComplaints = await Complaint.find(filter).lean();
    const totalComplaints = allComplaints.length;

    // Status distribution
    const statusDist = {};
    allComplaints.forEach(c => {
      const s = c.status || 'FILED';
      statusDist[s] = (statusDist[s] || 0) + 1;
    });

    // Category distribution
    const catDist = {};
    allComplaints.forEach(c => {
      const cat = c.category || 'other';
      catDist[cat] = (catDist[cat] || 0) + 1;
    });

    // Calculate General KPI Stats
    const resolvedComplaints = allComplaints.filter(c => ['CLOSED', 'PROVISIONALLY_CLOSED'].includes(c.status));
    const resolvedCount = resolvedComplaints.length;
    const pendingCount = totalComplaints - resolvedCount;
    const disputedCount = allComplaints.filter(c => c.status === 'DISPUTED').length;

    const onTimeResolved = resolvedComplaints.filter(c => !c.sla_breached).length;
    const slaCompliance = resolvedCount > 0 ? Math.round((onTimeResolved / resolvedCount) * 100) : 100;
    const falseClosure = resolvedCount > 0 ? Math.round((disputedCount / resolvedCount) * 100) : 0;

    // Calculate Average Resolution Time
    let totalResolutionMs = 0;
    let countWithTime = 0;
    resolvedComplaints.forEach(c => {
      const closedAt = c.closure?.final_closed_at || c.closure?.officer_closed_at || c.updatedAt;
      if (closedAt) {
        const timeDiff = new Date(closedAt) - new Date(c.createdAt);
        if (timeDiff > 0) {
          totalResolutionMs += timeDiff;
          countWithTime++;
        }
      }
    });
    const avgResolutionDays = countWithTime > 0 ? parseFloat((totalResolutionMs / (1000 * 60 * 60 * 24 * countWithTime)).toFixed(1)) : 4.2;

    // Monthly Trend (last 6 months)
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();

      const startOfMonth = new Date(year, now.getMonth() - i, 1);
      const endOfMonth = new Date(year, now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const complaintsInMonth = allComplaints.filter(c => c.createdAt >= startOfMonth && c.createdAt <= endOfMonth).length;
      const resolvedInMonth = resolvedComplaints.filter(c => {
        const closedAt = c.closure?.final_closed_at || c.closure?.officer_closed_at || c.updatedAt;
        return closedAt && new Date(closedAt) >= startOfMonth && new Date(closedAt) <= endOfMonth;
      }).length;

      monthlyTrend.push({
        month: monthLabel,
        complaints: complaintsInMonth,
        resolved: resolvedInMonth
      });
    }

    // Department Performance Wise
    const departments = await Department.find().lean();
    const deptColorMap = {
      MCD: '#e74c3c',
      DJB: '#3498db',
      PWD: '#e67e22',
      BSES: '#f1c40f',
      NDMC: '#8E24AA',
      DDA: '#FF7043',
      DTC: '#1abc9c',
      DP: '#2c3e50',
      DFS: '#e74c3c',
      DPCC: '#27ae60',
      DUSIB: '#d35400',
      CMO: '#2980b9'
    };

    const departmentWise = [];
    for (const dept of departments) {
      const deptComplaints = allComplaints.filter(c => String(c.department_id) === String(dept._id));
      const totalDept = deptComplaints.length;
      const resolvedDept = deptComplaints.filter(c => ['CLOSED', 'PROVISIONALLY_CLOSED'].includes(c.status));
      const resolvedDeptCount = resolvedDept.length;
      const disputedDeptCount = deptComplaints.filter(c => c.status === 'DISPUTED').length;

      const onTimeResolvedDept = resolvedDept.filter(c => !c.sla_breached).length;
      const deptSla = resolvedDeptCount > 0 ? Math.round((onTimeResolvedDept / resolvedDeptCount) * 100) : 100;

      // Avg resolution days
      let deptResolutionMs = 0;
      let deptCountWithTime = 0;
      resolvedDept.forEach(c => {
        const closedAt = c.closure?.final_closed_at || c.closure?.officer_closed_at || c.updatedAt;
        if (closedAt) {
          const timeDiff = new Date(closedAt) - new Date(c.createdAt);
          if (timeDiff > 0) {
            deptResolutionMs += timeDiff;
            deptCountWithTime++;
          }
        }
      });
      const deptAvgDays = deptCountWithTime > 0 ? parseFloat((deptResolutionMs / (1000 * 60 * 60 * 24 * deptCountWithTime)).toFixed(1)) : 3.0;

      // Satisfaction score based on ratings
      const ratings = deptComplaints.filter(c => c.citizen_rating).map(c => c.citizen_rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.0;
      const satisfaction = Math.round(avgRating * 20); // 4.0 becomes 80%

      departmentWise.push({
        id: dept.code.toLowerCase(),
        name: dept.name,
        shortName: dept.code,
        color: deptColorMap[dept.code] || '#95a5a6',
        complaints: totalDept,
        resolved: resolvedDeptCount,
        slaCompliance: deptSla,
        avgResolutionDays: deptAvgDays,
        satisfaction
      });
    }

    // District Performance Wise
    const DistrictWard = require('../models/DistrictWard');
    const districts = await DistrictWard.find().lean();
    const districtWise = [];
    districts.forEach(d => {
      const distComplaints = allComplaints.filter(c => c.location?.district === d.code);
      const totalDist = distComplaints.length;
      const resolvedDist = distComplaints.filter(c => ['CLOSED', 'PROVISIONALLY_CLOSED'].includes(c.status)).length;
      const pendingDist = totalDist - resolvedDist;
      const criticalDist = distComplaints.filter(c => ['DEFCON_RED', 'DEFCON_ORANGE'].includes(c.priority)).length;

      districtWise.push({
        id: d.code,
        name: d.district_name,
        totalComplaints: totalDist,
        resolved: resolvedDist,
        pending: pendingDist,
        critical: criticalDist
      });
    });

    res.json({
      totalComplaints,
      resolvedComplaints: resolvedCount,
      pendingComplaints: pendingCount,
      slaCompliance,
      avgResolutionDays,
      falseClosure,
      statusDist,
      catDist,
      monthlyTrend,
      departmentWise,
      districtWise
    });
  } catch (err) {
    console.error('Detailed analytics error:', err);
    res.status(500).json({ error: 'Failed to retrieve detailed analytics' });
  }
});

// === USER ROUTES ===

router.get('/officers', auth, authorize('department_manager', 'district_officer', 'nodal_officer', 'commissioner', 'cm_staff', 'cm', 'super_admin'), async (req, res) => {
  try {
    const filter = { role: 'officer', is_active: true };
    if (['department_manager', 'nodal_officer', 'commissioner'].includes(req.user.role) && req.user.department) {
      filter.department = req.user.department;
    } else if (req.user.role === 'district_officer' && req.user.district) {
      filter.district = req.user.district;
    } else {
      if (req.query.department) filter.department = req.query.department;
      if (req.query.district) filter.district = req.query.district;
    }

    const officers = await User.find(filter)
      .populate('department', 'name code')
      .sort('-officer_profile.scorecard.credibility_score');

    res.json({ officers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get officers' });
  }
});

router.get('/officers/:id/scorecard', auth, async (req, res) => {
  try {
    const officer = await User.findById(req.params.id).populate('department', 'name code');
    if (!officer || officer.role !== 'officer') return res.status(404).json({ error: 'Officer not found' });

    const complaints = await Complaint.find({ assigned_officer_id: officer._id })
      .sort('-createdAt').limit(20).select('complaint_id status priority createdAt sla_breached category');

    res.json({ officer, recentComplaints: complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get scorecard' });
  }
});

// === DEPARTMENT ROUTES ===

router.get('/departments', auth, async (req, res) => {
  try {
    const departments = await Department.find().populate('nodal_officer_id', 'name');
    res.json({ departments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get departments' });
  }
});

router.get('/departments/:id', auth, async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id).populate('nodal_officer_id', 'name');
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    const stats = {
      total: await Complaint.countDocuments({ department_id: dept._id }),
      pending: await Complaint.countDocuments({ department_id: dept._id, status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] } }),
      resolved: await Complaint.countDocuments({ department_id: dept._id, status: { $in: ['CLOSED', 'PROVISIONALLY_CLOSED'] } }),
      sla_breached: await Complaint.countDocuments({ department_id: dept._id, sla_breached: true }),
    };

    res.json({ department: dept, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get department' });
  }
});

// === DISTRICTS ===

router.get('/districts', auth, async (req, res) => {
  try {
    const districts = await DistrictWard.find().populate('dm_id', 'name');
    res.json({ districts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get districts' });
  }
});

// === NOTIFICATIONS ===

router.get('/notifications', auth, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notifications = await Notification.find({ recipient_id: req.user._id })
      .sort('-sent_at').limit(50);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

router.patch('/notifications/:id/read', auth, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient_id: req.user._id },
      { is_read: true },
      { new: true }
    );
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.post('/notifications/read-all', auth, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.updateMany(
      { recipient_id: req.user._id, is_read: false },
      { is_read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// === VISIT LOGS ===

const VisitLog = require('../models/VisitLog');


router.post('/visits', auth, authorize('cm', 'cm_staff', 'district_officer', 'super_admin'), async (req, res) => {
  try {
    const { location, visit_date, purpose, notes } = req.body;
    if (!location || !visit_date || !purpose) {
      return res.status(400).json({ error: 'Location, date, and purpose are required' });
    }

    // Extract district from location string (case insensitive match)
    const districtLower = location.toLowerCase();
    const knownDistricts = ['central', 'east', 'new delhi', 'north', 'north east', 'north west', 'shahdara', 'south', 'south east', 'south west', 'west'];
    const matchedDistrict = knownDistricts.find(d => districtLower.includes(d));

    // Find active complaints in that district
    let complaintsInDistrict = [];
    if (matchedDistrict) {
      const districtCode = matchedDistrict === 'new delhi' ? 'new_delhi' : matchedDistrict.replace(' ', '_');
      complaintsInDistrict = await Complaint.find({
        'location.district': { $regex: new RegExp(`^${districtCode}$`, 'i') },
        status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] }
      }).select('_id');
    }

    const complaintIds = complaintsInDistrict.map(c => c._id);

    const visit = await VisitLog.create({
      visitor_id: req.user._id,
      visitor_role: req.user.role,
      location: {
        address: location,
        district: matchedDistrict || 'Central'
      },
      visit_date,
      purpose,
      actions_taken: notes,
      complaints_in_radius: complaintIds
    });

    // Create AuditEvent log
    const AuditEvent = require('../models/AuditEvent');
    await AuditEvent.create({
      actor_id: req.user._id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'PLAN_VISIT',
      target_id: visit._id,
      target_type: 'VisitLog',
      details: `Planned inspection visit to ${location}. Associated ${complaintIds.length} complaints.`,
    }).catch(e => console.error('Audit log failed:', e.message));

    res.status(201).json({ visit });
  } catch (err) {
    console.error('Create visit error:', err);
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

router.get('/visits', auth, async (req, res) => {
  try {
    const visits = await VisitLog.find()
      .populate('visitor_id', 'name role')
      .populate('complaints_in_radius', 'status complaint_id location')
      .sort('-visit_date')
      .limit(50);

    const formattedVisits = visits.map(v => {
      const totalNearby = v.complaints_in_radius?.length || 0;
      const resolved = v.complaints_in_radius?.filter(c => ['CLOSED', 'PROVISIONALLY_CLOSED'].includes(c.status))?.length || 0;
      return {
        _id: v._id,
        location: v.location?.address || 'Delhi',
        visit_date: v.visit_date,
        purpose: v.purpose,
        notes: v.actions_taken,
        visitor_id: v.visitor_id,
        complaints_nearby: totalNearby,
        resolved_count: resolved,
        complaints_list: v.complaints_in_radius || []
      };
    });

    res.json({ visits: formattedVisits });
  } catch (err) {
    console.error('Get visits error:', err);
    res.status(500).json({ error: 'Failed to get visits' });
  }
});

// === CORRUPTION RISK ===

router.get('/corruption-risk', auth, authorize('cm', 'cm_staff', 'super_admin'), async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer', is_active: true }).populate('department', 'name code');
    const riskScores = [];

    for (const officer of officers) {
      const [total, resolved, disputed, speedAnomalies, afterHours, copyPaste, recurrence] = await Promise.all([
        Complaint.countDocuments({ assigned_officer_id: officer._id }),
        Complaint.countDocuments({ assigned_officer_id: officer._id, status: { $in: ['CLOSED', 'PROVISIONALLY_CLOSED'] } }),
        Complaint.countDocuments({ assigned_officer_id: officer._id, status: 'DISPUTED' }),
        Promise.resolve(officer.officer_profile?.scorecard?.anomaly_flag_count || 0),
        Complaint.countDocuments({
          assigned_officer_id: officer._id,
          'closure.officer_closed_at': { $exists: true },
          $expr: {
            $or: [
              { $gte: [{ $hour: '$closure.officer_closed_at' }, 22] },
              { $lt: [{ $hour: '$closure.officer_closed_at' }, 6] },
            ]
          }
        }),
        Complaint.countDocuments({
          assigned_officer_id: officer._id,
          'closure.anti_false_closure_flags': { $regex: 'Copy-paste', $options: 'i' }
        }),
        Complaint.countDocuments({
          assigned_officer_id: officer._id,
          'closure.anti_false_closure_flags': { $regex: 'Recurrence', $options: 'i' }
        }),
      ]);

      const falseClosureRate = resolved > 0 ? Math.round((disputed / resolved) * 100) : 0;
      
      let riskScore = 0;
      riskScore += falseClosureRate * 2;
      riskScore += speedAnomalies * 10;
      riskScore += afterHours * 5;
      riskScore += copyPaste * 15;
      riskScore += recurrence * 10;

      riskScore = Math.min(Math.round(riskScore), 100);

      const riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';

      // Upsert RiskScore model
      const RiskScore = require('../models/RiskScore');
      await RiskScore.findOneAndUpdate(
        { officer_id: officer._id },
        {
          district: officer.district,
          false_closure_rate: falseClosureRate,
          speed_anomaly_count: speedAnomalies,
          after_hours_closure_count: afterHours,
          copy_paste_count: copyPaste,
          recurrence_count: recurrence,
          score: riskScore,
          risk_level: riskLevel,
        },
        { upsert: true, new: true }
      ).catch(e => console.error('RiskScore upsert failed:', e.message));

      riskScores.push({
        officer_name: officer.name,
        officer_id: officer._id,
        role: officer.officer_profile?.designation || 'Field Officer',
        department: officer.department?.code || 'N/A',
        district: officer.district,
        falseClosureRate,
        speedAnomalies,
        afterHours,
        copyPaste,
        recurrence,
        score: riskScore,
        riskLevel,
      });
    }

    riskScores.sort((a, b) => b.score - a.score);
    res.json({ riskScores });
  } catch (err) {
    console.error('Corruption risk error:', err);
    res.status(500).json({ error: 'Failed to get corruption risk leaderboard' });
  }
});

// === HOTSPOTS ===

router.get('/hotspots', auth, async (req, res) => {
  try {
    const activeComplaints = await Complaint.find({ status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] } });
    const clusters = {};

    activeComplaints.forEach(c => {
      const area = c.location?.address?.split(',')[0]?.trim() || 'Delhi';
      const district = c.location?.district || 'Central';
      const key = `${district}:${area}`;

      if (!clusters[key]) {
        clusters[key] = {
          district,
          area,
          count: 0,
          critical_count: 0,
          categories: {},
          coords: c.location?.coords || { lat: 28.61, lng: 77.23 }
        };
      }

      clusters[key].count++;
      if (['DEFCON_RED', 'DEFCON_ORANGE'].includes(c.priority)) {
        clusters[key].critical_count++;
      }

      clusters[key].categories[c.category] = (clusters[key].categories[c.category] || 0) + 1;
    });

    const hotspots = Object.values(clusters)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Cache to HotspotCache
    const HotspotCache = require('../models/HotspotCache');
    await HotspotCache.deleteMany({});
    for (const h of hotspots) {
      await HotspotCache.create({
        district: h.district,
        ward: h.area,
        coordinates: h.coords,
        category: Object.keys(h.categories).sort((x, y) => h.categories[y] - h.categories[x])[0] || 'general',
        complaint_count: h.count,
        critical_count: h.critical_count
      }).catch(e => console.error('HotspotCache create failed:', e.message));
    }

    res.json({ hotspots });
  } catch (err) {
    console.error('Hotspots error:', err);
    res.status(500).json({ error: 'Failed to get hotspots' });
  }
});

// === AUDIT LOGS ===

router.get('/audit-logs', auth, authorize('cm', 'cm_staff', 'super_admin'), async (req, res) => {
  try {
    const AuditEvent = require('../models/AuditEvent');
    const logs = await AuditEvent.find()
      .populate('actor_id', 'name role')
      .sort('-createdAt')
      .limit(100);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

module.exports = router;
