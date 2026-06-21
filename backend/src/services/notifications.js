/**
 * Notification Service — Creates in-app notifications and triggers SMS/push
 */
const Notification = require('../models/Notification');
const { sendSMS } = require('./sms');

let io = null;

function setSocketIO(socketIO) {
  io = socketIO;
}

async function createNotification({ recipientId, type = 'in_app', event, message, complaintId }) {
  try {
    const notification = await Notification.create({
      recipient_id: recipientId,
      type,
      event,
      message,
      complaint_id: complaintId,
      delivery_status: 'sent',
    });

    // Emit via Socket.io if available
    if (io) {
      io.to(`user-${recipientId}`).emit('notification', {
        id: notification._id,
        event,
        message,
        complaintId,
        timestamp: notification.sent_at,
      });
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}

async function notifyDefconAlert(complaint, recipients) {
  const message = `🚨 DEFCON ${complaint.priority} — ${complaint.complaint_id} at ${complaint.location?.address || complaint.location?.district}`;

  for (const recipient of recipients) {
    await createNotification({
      recipientId: recipient._id,
      type: 'in_app',
      event: 'defcon-alert',
      message,
      complaintId: complaint._id,
    });
  }

  // Emit to CM room
  if (io) {
    io.to('cm-room').to('cmo-room').emit('defcon-alert', {
      complaint_id: complaint.complaint_id,
      priority: complaint.priority,
      location: complaint.location,
      category: complaint.category,
      text: complaint.complaint_text?.substring(0, 100),
      timestamp: new Date(),
    });
  }
}

async function notifySLABreach(complaint) {
  if (io) {
    io.to(`officer-${complaint.assigned_officer_id}`)
      .to(`dm-${complaint.location?.district}`)
      .emit('sla-breach', {
        complaint_id: complaint.complaint_id,
        officer_id: complaint.assigned_officer_id,
        district: complaint.location?.district,
        timestamp: new Date(),
      });
  }
}

async function notifyNewComplaint(complaint) {
  if (io) {
    io.emit('new-complaint', {
      complaint_id: complaint.complaint_id,
      category: complaint.category,
      priority: complaint.priority,
      district: complaint.location?.district,
      status: complaint.status,
      timestamp: new Date(),
    });
  }
}

async function notifyComplaintUpdate(complaint) {
  if (io) {
    io.to(`complaint-${complaint._id}`).emit('complaint-updated', {
      complaint_id: complaint.complaint_id,
      status: complaint.status,
      priority: complaint.priority,
      timestamp: new Date(),
    });
  }
}

module.exports = {
  setSocketIO,
  createNotification,
  notifyDefconAlert,
  notifySLABreach,
  notifyNewComplaint,
  notifyComplaintUpdate,
};
