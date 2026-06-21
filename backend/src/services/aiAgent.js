/**
 * VAANI Vigilant AI Detection & Authenticity Verification Agent
 * Performs simulated heuristic checks for fake complaints, fraud detection, 
 * and evidence (photo/video) authenticity.
 */

const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

function analyzeComplaintAuthenticity(complaintText, mediaUrls = [], location = {}) {
  const text = (complaintText || '').toLowerCase().trim();
  const flags = [];
  let fraudProbability = 0;
  let authenticityScore = 100;

  // 1. Gibberish & Spam Heuristics
  const spamKeywords = [
    'test', 'dummy', 'fake', 'trial', 'testing', 'asdf', 'qwerty', 
    'garbage text', 'junk text', 'checking only', 'hello world',
    'परीक्षण', 'फर्जी'
  ];

  const hasSpamKeyword = spamKeywords.some(keyword => text.includes(keyword));
  if (hasSpamKeyword) {
    flags.push('SPAM_KEYWORDS_DETECTED');
    fraudProbability += 45;
    authenticityScore -= 40;
  }

  // Length check & gibberish indicators (e.g. very long single word or repeating characters)
  if (text.length < 15) {
    flags.push('INSUFFICIENT_DETAIL_WARNING');
    fraudProbability += 15;
    authenticityScore -= 10;
  }

  const longestWord = text.split(/\s+/).reduce((max, word) => word.length > max.length ? word : max, '');
  if (longestWord.length > 25) {
    flags.push('POTENTIAL_GIBBERISH_DETECTED');
    fraudProbability += 30;
    authenticityScore -= 25;
  }

  const repeatedCharsPattern = /(.)\1{4,}/g; // 5+ repeating characters
  if (repeatedCharsPattern.test(text)) {
    flags.push('REPETITIVE_CHARACTER_PATTERN');
    fraudProbability += 25;
    authenticityScore -= 20;
  }

  // 2. Evidence Authenticity Verification
  if (!mediaUrls || mediaUrls.length === 0) {
    flags.push('NO_VISUAL_EVIDENCE_ATTACHED');
    // Not necessarily fraudulent, but lower verification score
    authenticityScore -= 15;
  } else {
    // Check files properties (simulated)
    mediaUrls.forEach((media, index) => {
      const url = typeof media === 'string' ? media : media.url || '';
      
      // Stock image indicators in file name
      if (url.includes('stock') || url.includes('download') || url.includes('preview')) {
        flags.push(`STOCK_IMAGE_SUSPECTED_IN_MEDIA_${index + 1}`);
        fraudProbability += 35;
        authenticityScore -= 30;
      }

      // Check GPS metadata spoofing/mismatch (if coordinates exist)
      const mediaCoords = media.gps || {};
      const complaintCoords = location.coords || {};

      if (mediaCoords.lat && mediaCoords.lng && complaintCoords.lat && complaintCoords.lng) {
        const distance = getDistance(
          mediaCoords.lat,
          mediaCoords.lng,
          complaintCoords.lat,
          complaintCoords.lng
        );

        // If distance is greater than 1km between photo location and complaint location
        if (distance > 1000) {
          flags.push(`EVIDENCE_LOCATION_MISMATCH_${index + 1}`);
          fraudProbability += 40;
          authenticityScore -= 35;
        }
      } else if (mediaCoords.lat && mediaCoords.lng) {
        // Location coords are missing, but photo has coords: check if within Delhi bounds roughly
        const lat = parseFloat(mediaCoords.lat);
        const lng = parseFloat(mediaCoords.lng);
        const insideDelhi = (lat > 28.4 && lat < 28.9) && (lng > 76.8 && lng < 77.4);
        if (!insideDelhi) {
          flags.push(`EVIDENCE_OUTSIDE_DELHI_BOUNDS_${index + 1}`);
          fraudProbability += 50;
          authenticityScore -= 45;
        }
      } else {
        // Media exists but has no GPS metadata
        flags.push(`EXIF_DATA_STRIPPED_IN_MEDIA_${index + 1}`);
        authenticityScore -= 5;
      }
    });
  }

  // Clamp values
  fraudProbability = Math.min(Math.max(fraudProbability, 0), 100);
  authenticityScore = Math.min(Math.max(authenticityScore, 0), 100);

  // Determine Verdict
  let verdict = 'PASSED';
  let isFake = false;
  if (fraudProbability >= 65 || authenticityScore <= 35) {
    verdict = 'FAILED';
    isFake = true;
  } else if (fraudProbability >= 30 || authenticityScore <= 70) {
    verdict = 'WARNING';
  }

  return {
    is_fake: isFake,
    fraud_probability: fraudProbability,
    evidence_authentic: authenticityScore >= 50,
    authenticity_score: authenticityScore,
    flags,
    verdict,
    checked_at: new Date()
  };
}

module.exports = {
  analyzeComplaintAuthenticity
};
