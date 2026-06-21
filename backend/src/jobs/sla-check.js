/**
 * SLA Breach Check — Runs every 30 minutes
 */
const Complaint = require('../models/Complaint');
const { notifySLABreach } = require('../services/notifications');

async function checkSLABreaches() {
  console.log('⏰ [SLA Check] Running SLA breach check...');
  const now = new Date();

  // Find complaints past SLA deadline that aren't already breached or closed
  const breached = await Complaint.find({
    sla_deadline: { $lt: now },
    sla_breached: false,
    status: { $nin: ['CLOSED', 'PROVISIONALLY_CLOSED'] },
  });

  let count = 0;
  for (const complaint of breached) {
    complaint.sla_breached = true;
    complaint.timeline.push({
      event: '⏰ SLA BREACHED — Resolution deadline exceeded',
      actor_role: 'system',
      timestamp: now,
    });

    // Auto-escalate if not already escalated
    if (complaint.status !== 'ESCALATED') {
      // Only escalate GREEN/YELLOW to higher priority
      if (complaint.priority === 'DEFCON_GREEN') {
        complaint.priority = 'DEFCON_YELLOW';
      }
    }

    await complaint.save();
    await notifySLABreach(complaint);
    count++;
  }

  if (count > 0) {
    console.log(`⏰ [SLA Check] ${count} complaints marked as SLA breached`);
  }

  // Check pending closures >72h → auto set PROVISIONALLY_CLOSED
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 3600000);
  const pendingClosures = await Complaint.find({
    status: 'PENDING_CLOSURE',
    'closure.citizen_verification.sms_sent_at': { $lt: seventyTwoHoursAgo },
    'closure.citizen_verification.response': null,
  });

  for (const complaint of pendingClosures) {
    complaint.status = 'PROVISIONALLY_CLOSED';
    complaint.closure.citizen_verification.response = 'no_response';
    complaint.closure.final_closed_at = now;
    complaint.timeline.push({
      event: 'Auto-closed after 72h — No citizen response',
      actor_role: 'system',
      timestamp: now,
    });
    await complaint.save();
    console.log(`✅ [Auto-Close] ${complaint.complaint_id} — No response after 72h`);
  }

  return { breached: count, autoClosed: pendingClosures.length };
}

module.exports = { checkSLABreaches };
