/**
 * SMS Service — Uses Twilio in production, console.log in DEMO_MODE
 */

const DEMO_MODE = process.env.DEMO_MODE === 'true';

async function sendSMS(to, message) {
  if (DEMO_MODE) {
    console.log(`📱 [DEMO SMS] To: ${to}`);
    console.log(`   Message: ${message}`);
    console.log('---');
    return { success: true, demo: true, sid: 'DEMO_' + Date.now() };
  }

  // Production: Use Twilio
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error('SMS send error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendOTP(mobile, otp) {
  return sendSMS(mobile, `Your VAANI verification code is: ${otp}. Valid for 10 minutes. Do not share this code.\n\nआपका VAANI सत्यापन कोड है: ${otp}`);
}

async function sendComplaintConfirmation(mobile, complaintId) {
  return sendSMS(mobile, `Your complaint ${complaintId} has been registered successfully on VAANI. Track status at: vaani.delhi.gov.in/track/${complaintId}\n\nआपकी शिकायत ${complaintId} सफलतापूर्वक दर्ज हो गई है।`);
}

async function sendCitizenVerification(mobile, complaintId, officerName) {
  return sendSMS(mobile, `Your complaint ${complaintId} marked resolved by Officer ${officerName}.\nReply 1 to CONFIRM or 2 to DISPUTE.\nAuto-closes in 72 hours.\n\nशिकायत ${complaintId} अधिकारी ${officerName} द्वारा हल। पुष्टि के लिए 1 या विवाद के लिए 2 दबाएं।`);
}

async function sendDefconAlert(mobile, complaintId, priority, location) {
  return sendSMS(mobile, `🚨 DEFCON ${priority} ALERT — VAANI\nComplaint: ${complaintId}\nLocation: ${location}\nIMMediate action required!\n\n🚨 ${priority} अलर्ट — तत्काल कार्रवाई आवश्यक!`);
}

async function sendSLABreachAlert(mobile, complaintId) {
  return sendSMS(mobile, `⏰ SLA BREACH — Complaint ${complaintId} has exceeded its resolution deadline. Immediate escalation required.\n\n⏰ SLA उल्लंघन — शिकायत ${complaintId} की समय सीमा पार।`);
}

module.exports = {
  sendSMS,
  sendOTP,
  sendComplaintConfirmation,
  sendCitizenVerification,
  sendDefconAlert,
  sendSLABreachAlert,
};
