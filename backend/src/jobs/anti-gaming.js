/**
 * Anti-Gaming Cron Jobs — Prevents false closures
 */
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// RULE 1: Speed anomaly — Officer closes >15 complaints in 1 hour
async function checkSpeedAnomaly() {
  console.log('🔍 [Anti-Gaming] Checking speed anomalies...');
  const oneHourAgo = new Date(Date.now() - 3600000);

  const pipeline = [
    { $match: { 'closure.officer_closed_at': { $gte: oneHourAgo }, status: { $in: ['PENDING_CLOSURE', 'PROVISIONALLY_CLOSED', 'CLOSED'] } } },
    { $group: { _id: '$assigned_officer_id', count: { $sum: 1 } } },
    { $match: { count: { $gt: 15 } } },
  ];

  const anomalies = await Complaint.aggregate(pipeline);
  for (const a of anomalies) {
    console.log(`🚨 [SPEED ANOMALY] Officer ${a._id} closed ${a.count} complaints in 1 hour!`);
    await User.findByIdAndUpdate(a._id, {
      $inc: { 'officer_profile.scorecard.anomaly_flag_count': 1 },
    });
  }
  return anomalies;
}

// RULE 2: After-hours closure (10 PM–6 AM)
async function checkAfterHoursClosure() {
  console.log('🔍 [Anti-Gaming] Checking after-hours closures...');
  const today = new Date(); today.setHours(0,0,0,0);
  const closures = await Complaint.find({
    'closure.officer_closed_at': { $gte: today },
    status: { $in: ['PENDING_CLOSURE', 'PROVISIONALLY_CLOSED', 'CLOSED'] },
  }).select('complaint_id closure.officer_closed_at assigned_officer_id');

  const flagged = [];
  for (const c of closures) {
    const hour = new Date(c.closure.officer_closed_at).getHours();
    if (hour >= 22 || hour < 6) {
      flagged.push(c.complaint_id);
      console.log(`⚠️ [AFTER-HOURS] ${c.complaint_id} closed at ${hour}:00 by ${c.assigned_officer_id}`);
    }
  }
  return flagged;
}

// RULE 3: Copy-paste speaking order (Jaccard similarity >85%)
function jaccardSimilarity(a, b) {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

async function checkCopyPasteSpeakingOrders() {
  console.log('🔍 [Anti-Gaming] Checking copy-paste speaking orders...');
  const officers = await User.find({ role: 'officer' }).select('_id name');
  const flagged = [];

  for (const officer of officers) {
    const recentClosures = await Complaint.find({
      assigned_officer_id: officer._id,
      'closure.speaking_order': { $exists: true },
    }).sort('-closure.officer_closed_at').limit(6).select('complaint_id closure.speaking_order');

    for (let i = 0; i < recentClosures.length; i++) {
      for (let j = i + 1; j < recentClosures.length; j++) {
        const sim = jaccardSimilarity(
          recentClosures[i].closure.speaking_order,
          recentClosures[j].closure.speaking_order
        );
        if (sim > 0.85) {
          flagged.push({ officer: officer.name, complaints: [recentClosures[i].complaint_id, recentClosures[j].complaint_id], similarity: Math.round(sim * 100) });
          console.log(`⚠️ [COPY-PASTE] Officer ${officer.name}: ${recentClosures[i].complaint_id} & ${recentClosures[j].complaint_id} — ${Math.round(sim * 100)}% similar`);
        }
      }
    }
  }
  return flagged;
}

// RULE 5: Recurrence check — same GPS + category within 30 days of closure
async function checkRecurrence() {
  console.log('🔍 [Anti-Gaming] Checking recurrence (daily 2 AM)...');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const recentComplaints = await Complaint.find({
    status: 'FILED',
    createdAt: { $gte: thirtyDaysAgo },
  });

  const flagged = [];
  for (const complaint of recentComplaints) {
    if (!complaint.location?.coords?.lat) continue;

    const previousClosed = await Complaint.find({
      _id: { $ne: complaint._id },
      category: complaint.category,
      status: { $in: ['CLOSED', 'PROVISIONALLY_CLOSED'] },
      'closure.final_closed_at': { $gte: thirtyDaysAgo },
      'location.coords.lat': { $gte: complaint.location.coords.lat - 0.002, $lte: complaint.location.coords.lat + 0.002 },
      'location.coords.lng': { $gte: complaint.location.coords.lng - 0.002, $lte: complaint.location.coords.lng + 0.002 },
    });

    for (const prev of previousClosed) {
      flagged.push({ new_complaint: complaint.complaint_id, previous: prev.complaint_id });
      prev.closure.anti_false_closure_flags = prev.closure.anti_false_closure_flags || [];
      prev.closure.anti_false_closure_flags.push(`Recurrence detected: ${complaint.complaint_id} filed at same location`);
      await prev.save();

      // Penalize officer: -3 credibility
      if (prev.assigned_officer_id) {
        await User.findByIdAndUpdate(prev.assigned_officer_id, {
          $inc: { 'officer_profile.scorecard.credibility_score': -3 },
        });
      }
      console.log(`🚩 [RECURRENCE] ${complaint.complaint_id} matches closed ${prev.complaint_id} — officer penalized`);
    }
  }
  return flagged;
}

module.exports = {
  checkSpeedAnomaly,
  checkAfterHoursClosure,
  checkCopyPasteSpeakingOrders,
  checkRecurrence,
};
