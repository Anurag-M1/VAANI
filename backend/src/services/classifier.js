/**
 * VAANI Smart Jurisdiction Router — Keyword NLP Classifier
 * Input: complaint_text + GPS + category_hint
 * Output: department_code + confidence_score + assigned_officer
 */

const User = require('../models/User');
const Department = require('../models/Department');

// Keyword-to-department mapping with weights
const DEPARTMENT_KEYWORDS = {
  DJB: {
    keywords: ['water', 'pani', 'sewage', 'sewer', 'pipe burst', 'drain', 'no water supply',
      'water leakage', 'boring', 'manhole', 'पानी', 'सीवर', 'नाली', 'जल', 'पाइप', 'नल',
      'water supply', 'pipeline', 'drainage', 'waterlogging', 'flood', 'बाढ़', 'pollution', 'smoke', 'factory', 'chemical', 'gas', 'प्रदूषण', 'धुआं'],
    defcon_triggers: ['burst pipe', 'flooding', 'sewer overflow', 'contaminated water', 'दूषित पानी', 'gas leak', 'chemical spill', 'गैस लीक'],
  },
  PWD: {
    keywords: ['road', 'pothole', 'flyover', 'bridge', 'highway', 'divider', 'footpath',
      'sadak', 'सड़क', 'गड्ढा', 'पुल', 'road damage', 'cave in', 'speed breaker',
      'construction debris', 'crater', 'tar', 'asphalt', 'traffic', 'यातायात', 'signal', 'red light', 'parking'],
    defcon_triggers: ['bridge collapse', 'road completely blocked', 'road cave in', 'पुल टूटा'],
  },
  MCD: {
    keywords: ['garbage', 'trash', 'waste', 'sweeping', 'dust', 'bin', 'stray dog', 'dengue',
      'malaria', 'mosquito', 'park', 'tree', 'कूड़ा', 'सफाई', 'मच्छर', 'कचरा',
      'sanitation', 'cleanliness', 'dumping', 'landfill', 'dead animal', 'pest', 'encroachment', 'unauthorized construction', 'अतिक्रमण', 'illegal construction',
      'building violation', 'land', 'plot', 'colony', 'अवैध निर्माण'],
    defcon_triggers: ['disease outbreak', 'dengue surge', 'epidemic', 'महामारी'],
  },
  BSES: {
    keywords: ['electricity', 'power', 'light', 'bijli', 'transformer', 'outage', 'meter',
      'live wire', 'बिजली', 'अंधेरा', 'current', 'power cut', 'blackout', 'voltage',
      'electric', 'fuse', 'street light', 'wiring'],
    defcon_triggers: ['electrocution', 'live wire', 'fire from transformer', 'करंट लगा', 'आग'],
  },
  CMO: {
    keywords: ['general', 'other', 'complaint'],
    defcon_triggers: []
  }
};

// DEFCON RED triggers (life-threatening, any department)
const DEFCON_RED_KEYWORDS = [
  'gas leak', 'explosion', 'fire', 'building collapse', 'roof fell',
  'child missing', 'child trapped', 'body found', 'open manhole',
  'contaminated water', 'people sick', 'electrocution', 'live wire',
  'गैस लीक', 'आग', 'बच्चा लापता', 'इमारत गिरी', 'विस्फोट',
  'छत गिरी', 'बच्चा फंसा', 'शव मिला', 'खुला मैनहोल',
  'करंट', 'बिजली का तार', 'collapse', 'trapped', 'drowning',
  'death', 'died', 'critical injury', 'मौत', 'डूबना',
];

/**
 * Classify a complaint and determine department + confidence
 */
function classifyComplaint(complaintText, categoryHint = '') {
  const text = (complaintText + ' ' + categoryHint).toLowerCase();

  const scores = {};
  let maxScore = 0;
  let bestDept = null;

  for (const [deptCode, config] of Object.entries(DEPARTMENT_KEYWORDS)) {
    let score = 0;
    let matchedKeywords = 0;

    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length; // multi-word keywords get higher weight
        matchedKeywords++;
      }
    }

    // Bonus for multiple keyword matches
    if (matchedKeywords > 2) score *= 1.3;
    if (matchedKeywords > 4) score *= 1.5;

    scores[deptCode] = score;
    if (score > maxScore) {
      maxScore = score;
      bestDept = deptCode;
    }
  }

  // Calculate confidence
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.round((maxScore / totalScore) * 100) : 0;

  // Determine routing method
  let routingMethod = 'auto_nlp';
  if (confidence < 50) routingMethod = 'manual'; // needs CMO review

  return {
    department_code: bestDept || 'CMO',
    confidence,
    routing_method: routingMethod,
    all_scores: scores,
    needs_verification: confidence >= 50 && confidence < 80,
  };
}

/**
 * Detect DEFCON priority level
 */
function detectDefconLevel(complaintText) {
  const text = complaintText.toLowerCase();

  // Check DEFCON RED (life-threatening)
  for (const trigger of DEFCON_RED_KEYWORDS) {
    if (text.includes(trigger.toLowerCase())) {
      return {
        priority: 'DEFCON_RED',
        trigger_keyword: trigger,
        sla_hours: { acknowledgment: 1, resolution: 4 },
      };
    }
  }

  // Check department-specific DEFCON triggers (ORANGE)
  for (const [deptCode, config] of Object.entries(DEPARTMENT_KEYWORDS)) {
    for (const trigger of config.defcon_triggers) {
      if (text.includes(trigger.toLowerCase())) {
        return {
          priority: 'DEFCON_ORANGE',
          trigger_keyword: trigger,
          department: deptCode,
          sla_hours: { acknowledgment: 4, resolution: 24 },
        };
      }
    }
  }

  return {
    priority: 'DEFCON_GREEN',
    trigger_keyword: null,
    sla_hours: { acknowledgment: 24, resolution: 168 },
  };
}

/**
 * Find the best officer to assign a complaint to
 */
async function findBestOfficer(departmentCode, district) {
  try {
    const dept = await Department.findOne({ code: departmentCode });
    if (!dept) return null;

    // Find available officers in this department + district with capacity
    const officers = await User.find({
      role: 'officer',
      department: dept._id,
      district: district,
      is_active: true,
      'officer_profile.is_available': true,
      'officer_profile.active_complaints_count': { $lt: 20 },
    }).sort({ 'officer_profile.active_complaints_count': 1 }); // lowest load first

    if (officers.length > 0) return officers[0];

    // Fallback: any officer in the department (any district)
    const anyOfficer = await User.find({
      role: 'officer',
      department: dept._id,
      is_active: true,
      'officer_profile.is_available': true,
      'officer_profile.active_complaints_count': { $lt: 20 },
    }).sort({ 'officer_profile.active_complaints_count': 1 });

    if (anyOfficer.length > 0) return anyOfficer[0];

    // Fallback: nodal officer
    if (dept.nodal_officer_id) {
      return await User.findById(dept.nodal_officer_id);
    }

    return null;
  } catch (err) {
    console.error('Error finding best officer:', err);
    return null;
  }
}

/**
 * Generate unique complaint ID: VAANI-YYYYMMDD-XXXXX
 */
function generateComplaintId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(10000 + Math.random() * 90000));
  return `VAANI-${dateStr}-${rand}`;
}

module.exports = {
  classifyComplaint,
  detectDefconLevel,
  findBestOfficer,
  generateComplaintId,
  DEFCON_RED_KEYWORDS,
  DEPARTMENT_KEYWORDS,
};
