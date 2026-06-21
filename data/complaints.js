// Mock complaints data for Delhi CM Grievance Dashboard
// Covers all 11 districts, major departments, and complaint categories

export const COMPLAINT_STATUS = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REOPENED: 'reopened',
  FALSE_CLOSURE: 'false_closure',
};

export const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const COMPLAINT_CATEGORIES = [
  { id: 'water', label: 'Water Supply / जल आपूर्ति', icon: '💧', department: 'Delhi Jal Board' },
  { id: 'electricity', label: 'Electricity / बिजली', icon: '⚡', department: 'BSES Electricity' },
  { id: 'roads', label: 'Roads & Potholes / सड़कें', icon: '🛣️', department: 'Public Works Department' },
  { id: 'sanitation', label: 'Sanitation & Garbage / स्वच्छता', icon: '🗑️', department: 'Municipal Corporation of Delhi' },
  { id: 'sewage', label: 'Sewage & Drains / सीवर', icon: '🚰', department: 'Delhi Jal Board' },
  { id: 'encroachment', label: 'Encroachment / अतिक्रमण', icon: '🏗️', department: 'Municipal Corporation of Delhi' },
  { id: 'parking', label: 'Parking Issues / पार्किंग', icon: '🅿️', department: 'Public Works Department' },
  { id: 'pollution', label: 'Pollution / प्रदूषण', icon: '🏭', department: 'Delhi Jal Board' },
  { id: 'law_order', label: 'Law & Order / कानून-व्यवस्था', icon: '👮', department: "Chief Minister's Office" },
  { id: 'healthcare', label: 'Healthcare / स्वास्थ्य', icon: '🏥', department: 'Municipal Corporation of Delhi' },
  { id: 'education', label: 'Education / शिक्षा', icon: '📚', department: "Chief Minister's Office" },
  { id: 'ration', label: 'Ration & PDS / राशन', icon: '🌾', department: "Chief Minister's Office" },
  { id: 'transport', label: 'Public Transport / परिवहन', icon: '🚌', department: 'Public Works Department' },
  { id: 'housing', label: 'Housing / आवास', icon: '🏠', department: 'Municipal Corporation of Delhi' },
  { id: 'social_welfare', label: 'Social Welfare / समाज कल्याण', icon: '🤝', department: "Chief Minister's Office" },
  { id: 'building_collapse', label: 'Building Safety / भवन सुरक्षा', icon: '🏚️', department: 'Municipal Corporation of Delhi' },
  { id: 'fire_hazard', label: 'Fire Hazard / अग्नि खतरा', icon: '🔥', department: 'Municipal Corporation of Delhi' },
  { id: 'gas_leak', label: 'Gas Leak / गैस रिसाव', icon: '⚠️', department: 'Delhi Jal Board' },
  { id: 'open_manhole', label: 'Open Manhole / खुला मैनहोल', icon: '🕳️', department: 'Municipal Corporation of Delhi' },
  { id: 'other', label: 'Other / अन्य', icon: '📋', department: "Chief Minister's Office" },
];

export const DELHI_DISTRICTS = [
  { id: 'central', name: 'Central Delhi / मध्य दिल्ली', lat: 28.6358, lng: 77.2245 },
  { id: 'east', name: 'East Delhi / पूर्वी दिल्ली', lat: 28.6280, lng: 77.3050 },
  { id: 'new_delhi', name: 'New Delhi / नई दिल्ली', lat: 28.6139, lng: 77.2090 },
  { id: 'north', name: 'North Delhi / उत्तर दिल्ली', lat: 28.7041, lng: 77.1025 },
  { id: 'north_east', name: 'North East Delhi / उत्तर पूर्वी दिल्ली', lat: 28.6920, lng: 77.2730 },
  { id: 'north_west', name: 'North West Delhi / उत्तर पश्चिमी दिल्ली', lat: 28.7200, lng: 77.0700 },
  { id: 'shahdara', name: 'Shahdara / शाहदरा', lat: 28.6740, lng: 77.2925 },
  { id: 'south', name: 'South Delhi / दक्षिण दिल्ली', lat: 28.5244, lng: 77.2167 },
  { id: 'south_east', name: 'South East Delhi / दक्षिण पूर्वी दिल्ली', lat: 28.5635, lng: 77.2875 },
  { id: 'south_west', name: 'South West Delhi / दक्षिण पश्चिमी दिल्ली', lat: 28.5500, lng: 77.0920 },
  { id: 'west', name: 'West Delhi / पश्चिमी दिल्ली', lat: 28.6517, lng: 77.0517 },
];

export const DEPARTMENTS = [
  { id: 'mcd', name: 'Municipal Corporation of Delhi', nameHi: 'दिल्ली नगर निगम', shortName: 'MCD', color: '#e74c3c', complaints: 3420, resolved: 2180 },
  { id: 'djb', name: 'Delhi Jal Board', nameHi: 'दिल्ली जल बोर्ड', shortName: 'DJB', color: '#3498db', complaints: 2850, resolved: 1920 },
  { id: 'pwd', name: 'Public Works Department', nameHi: 'लोक निर्माण विभाग', shortName: 'PWD', color: '#e67e22', complaints: 1920, resolved: 1100 },
  { id: 'bses', name: 'BSES Electricity', nameHi: 'बीएसईएस बिजली विभाग', shortName: 'BSES', color: '#f1c40f', complaints: 2100, resolved: 1650 },
  { id: 'ndmc', name: 'New Delhi Municipal Council', nameHi: 'नई दिल्ली नगर पालिका परिषद', shortName: 'NDMC', color: '#8E24AA', complaints: 456, resolved: 410 },
  { id: 'dda', name: 'Delhi Development Authority', nameHi: 'दिल्ली विकास प्राधिकरण', shortName: 'DDA', color: '#FF7043', complaints: 823, resolved: 650 },
  { id: 'dtc', name: 'Delhi Transport Corporation', nameHi: 'दिल्ली परिवहन निगम', shortName: 'DTC', color: '#26A69A', complaints: 350, resolved: 310 },
  { id: 'dp', name: 'Delhi Police', nameHi: 'दिल्ली पुलिस', shortName: 'DP', color: '#3949AB', complaints: 620, resolved: 580 },
  { id: 'dfs', name: 'Delhi Fire Service', nameHi: 'दिल्ली अग्निशमन सेवा', shortName: 'DFS', color: '#E53935', complaints: 120, resolved: 118 },
  { id: 'dpcc', name: 'Delhi Pollution Control Committee', nameHi: 'दिल्ली प्रदूषण नियंत्रण समिति', shortName: 'DPCC', color: '#43A047', complaints: 520, resolved: 390 },
  { id: 'dusib', name: 'Delhi Urban Shelter Improvement Board', nameHi: 'दिल्ली शहरी आश्रय सुधार बोर्ड', shortName: 'DUSIB', color: '#795548', complaints: 280, resolved: 220 },
  { id: 'cmo', name: "Chief Minister's Office", nameHi: 'मुख्यमंत्री कार्यालय', shortName: 'CMO', color: '#2c3e50', complaints: 1580, resolved: 980 },
];

// Generate realistic complaint data
function generateComplaintId(index) {
  const year = '2026';
  const prefix = 'DL-CM';
  return `${prefix}-${year}-${String(index).padStart(6, '0')}`;
}

const citizenNames = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Verma', 'Sunita Devi', 'Mohammad Aslam',
  'Rekha Yadav', 'Vikram Singh', 'Anita Gupta', 'Suresh Chand', 'Kavita Jain',
  'Ramesh Pandey', 'Nisha Malik', 'Deepak Chauhan', 'Pooja Rani', 'Harish Kumar',
  'Suman Lata', 'Abdul Rehman', 'Geeta Devi', 'Manoj Tiwari', 'Renu Bala',
  'Satish Kumar', 'Meera Chopra', 'Yogesh Saini', 'Kiran Bedi', 'Ashok Tanwar',
  'Babita Sharma', 'Gaurav Mishra', 'Sarita Joshi', 'Pawan Kumar', 'Asha Rani',
];

const locations = [
  { area: 'Chandni Chowk', district: 'central', pin: '110006' },
  { area: 'Karol Bagh', district: 'central', pin: '110005' },
  { area: 'Laxmi Nagar', district: 'east', pin: '110092' },
  { area: 'Preet Vihar', district: 'east', pin: '110092' },
  { area: 'Connaught Place', district: 'new_delhi', pin: '110001' },
  { area: 'Sarojini Nagar', district: 'new_delhi', pin: '110023' },
  { area: 'Model Town', district: 'north', pin: '110009' },
  { area: 'Civil Lines', district: 'north', pin: '110054' },
  { area: 'Seelampur', district: 'north_east', pin: '110053' },
  { area: 'Mustafabad', district: 'north_east', pin: '110094' },
  { area: 'Rohini', district: 'north_west', pin: '110085' },
  { area: 'Pitampura', district: 'north_west', pin: '110034' },
  { area: 'Shahdara', district: 'shahdara', pin: '110032' },
  { area: 'Vivek Vihar', district: 'shahdara', pin: '110095' },
  { area: 'Saket', district: 'south', pin: '110017' },
  { area: 'Hauz Khas', district: 'south', pin: '110016' },
  { area: 'Kalkaji', district: 'south_east', pin: '110019' },
  { area: 'Okhla', district: 'south_east', pin: '110020' },
  { area: 'Dwarka', district: 'south_west', pin: '110075' },
  { area: 'Najafgarh', district: 'south_west', pin: '110043' },
  { area: 'Janakpuri', district: 'west', pin: '110058' },
  { area: 'Rajouri Garden', district: 'west', pin: '110027' },
  { area: 'Paharganj', district: 'central', pin: '110055' },
  { area: 'Mayur Vihar', district: 'east', pin: '110091' },
  { area: 'Mehrauli', district: 'south', pin: '110030' },
  { area: 'Vikaspuri', district: 'west', pin: '110018' },
  { area: 'Burari', district: 'north', pin: '110084' },
  { area: 'Babarpur', district: 'north_east', pin: '110032' },
  { area: 'Narela', district: 'north_west', pin: '110040' },
  { area: 'Uttam Nagar', district: 'south_west', pin: '110059' },
];

const complaintDescriptions = {
  water: [
    'No water supply for last 3 days in our colony. Tanker not arriving despite repeated calls to DJB helpline.',
    'Water pressure is extremely low. Only trickle comes from taps. Entire block affected.',
    'Contaminated water supply - yellow colored water with foul smell. Children fell sick.',
    'Water pipeline burst on main road. Water wasting for 2 days, no one has come to repair.',
    'Bore well in our area has dried up. Need immediate tanker supply for 200+ families.',
  ],
  electricity: [
    'Power outage for 12 hours in peak summer. No response from BSES complaint number.',
    'Street lights not working in entire colony for 2 weeks. Safety concern for women.',
    'Electricity bill inflated - showing 3x normal consumption. Meter reading seems wrong.',
    'Exposed electric wires hanging from pole near school. Extreme danger for children.',
    'Transformer sparking and making loud noise. Fire risk for nearby houses.',
  ],
  roads: [
    'Massive pothole on main road causing accidents daily. Two-wheeler riders injured.',
    'Road completely damaged after monsoon. No repair work started despite complaints.',
    'Construction debris dumped on road for weeks. Traffic congestion and dust pollution.',
    'Speed breaker too high, causing damage to vehicles and back injuries.',
    'Road caved in near metro construction site. Dangerous for pedestrians.',
  ],
  sanitation: [
    'Garbage not collected for 5 days. Piling up near residential area. Stray dogs and flies everywhere.',
    'Open dumping of garbage near park. Children cannot play. Health hazard.',
    'MCD garbage truck not visiting our lane. Only main road gets cleaned.',
    'Community dustbin overflowing. Needs larger bin or more frequent collection.',
    'Dead animal carcass on road for 3 days. No one came despite multiple complaints.',
  ],
  sewage: [
    'Sewer overflowing on main road. Dirty water entering houses. Unhygienic conditions.',
    'Blocked drain causing waterlogging during rain. Mosquito breeding ground.',
    'Sewage line burst. Foul smell throughout the colony. Children getting sick.',
    'No proper drainage system in colony. Rain water stagnates for days.',
    'Manhole cover missing on busy road. Extremely dangerous at night.',
  ],
  law_order: [
    'Illegal gambling den operating near school. Multiple complaints to local police ignored.',
    'Eve teasing and harassment near metro station. Women feel unsafe.',
    'Illegal liquor shop operating in residential area. Creating nuisance daily.',
    'Theft incidents increasing in area. No police patrolling at night.',
    'Loud DJ and parties every weekend violating noise pollution norms. Police not acting.',
  ],
  healthcare: [
    'Government hospital refusing to treat patients. Sent back without examination.',
    'Mohalla clinic closed for 2 weeks. No doctor available. Patients forced to go to private hospital.',
    'Dengue cases increasing in area. No fumigation done despite repeated complaints.',
    'Government hospital has no medicines in stock. Patients asked to buy from outside.',
    'Long queues at government hospital. 6 hour wait for a 5 minute consultation.',
  ],
  building_collapse: [
    'URGENT: Building showing major cracks after recent earthquake tremors. 20 families at risk.',
    'Old building in danger of collapse. Residents evacuated but no further action taken.',
    'Construction next door causing cracks in our building walls. Structural damage feared.',
  ],
  open_manhole: [
    'CRITICAL: Open manhole on school route. Child fell in last week. No cover placed yet.',
    'Multiple manholes without covers in colony. Life threatening during monsoon.',
    'Broken manhole cover on busy intersection. Temporary fix keeps getting removed.',
  ],
  gas_leak: [
    'EMERGENCY: Gas smell in entire colony. Suspected pipeline leak. Need immediate attention.',
    'Gas leak from IGL pipeline near residential building. Very dangerous situation.',
  ],
  fire_hazard: [
    'CRITICAL: Illegal factory storing chemicals in residential area. Fire risk imminent.',
    'Fire extinguishers in government building expired 2 years ago. Fire safety audit needed.',
  ],
};

const statusTimeline = {
  [COMPLAINT_STATUS.NEW]: ['Complaint registered', 'Awaiting assignment'],
  [COMPLAINT_STATUS.ASSIGNED]: ['Complaint registered', 'Assigned to department', 'Officer assigned'],
  [COMPLAINT_STATUS.IN_PROGRESS]: ['Complaint registered', 'Assigned to department', 'Officer assigned', 'Work in progress'],
  [COMPLAINT_STATUS.ESCALATED]: ['Complaint registered', 'Assigned to department', 'Officer assigned', 'No action taken', 'Escalated to senior officer'],
  [COMPLAINT_STATUS.RESOLVED]: ['Complaint registered', 'Assigned to department', 'Officer assigned', 'Work in progress', 'Work completed', 'Resolved'],
  [COMPLAINT_STATUS.CLOSED]: ['Complaint registered', 'Assigned to department', 'Officer assigned', 'Work completed', 'Resolved', 'Closed after citizen confirmation'],
  [COMPLAINT_STATUS.REOPENED]: ['Complaint registered', 'Assigned to department', 'Resolved', 'Citizen disputed resolution', 'Reopened for review'],
  [COMPLAINT_STATUS.FALSE_CLOSURE]: ['Complaint registered', 'Assigned to department', 'Marked resolved by officer', '⚠️ Citizen reported issue not resolved', 'Flagged as false closure'],
};

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString();
}

function generateComplaints() {
  const complaints = [];
  const statuses = Object.values(COMPLAINT_STATUS);
  const priorities = Object.values(PRIORITY_LEVELS);

  for (let i = 1; i <= 75; i++) {
    const category = getRandomItem(COMPLAINT_CATEGORIES);
    const location = getRandomItem(locations);
    const status = getRandomItem(statuses);
    const priority = getRandomItem(priorities);
    const citizen = getRandomItem(citizenNames);
    const descriptions = complaintDescriptions[category.id] || [`General complaint regarding ${category.label}. Needs immediate attention from concerned department.`];
    const description = getRandomItem(descriptions);
    const createdAt = getRandomDate(30);
    const isCritical = ['building_collapse', 'open_manhole', 'gas_leak', 'fire_hazard'].includes(category.id) ||
                       priority === PRIORITY_LEVELS.CRITICAL;

    // Build timeline
    const timeline = (statusTimeline[status] || statusTimeline[COMPLAINT_STATUS.NEW]).map((step, idx) => ({
      step,
      timestamp: new Date(new Date(createdAt).getTime() + idx * 86400000 * Math.random()).toISOString(),
      by: idx === 0 ? 'System' : getRandomItem(['Officer Ramesh', 'AO Sunil Kumar', 'SDM Office', 'DM Office', 'CM Secretariat']),
    }));

    complaints.push({
      id: generateComplaintId(i),
      citizenName: citizen,
      citizenPhone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      category: category.id,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      department: category.department,
      priority,
      status,
      isCritical,
      description,
      location: {
        area: location.area,
        district: location.district,
        districtName: DELHI_DISTRICTS.find(d => d.id === location.district)?.name || location.district,
        pincode: location.pin,
        lat: DELHI_DISTRICTS.find(d => d.id === location.district)?.lat + (Math.random() - 0.5) * 0.05,
        lng: DELHI_DISTRICTS.find(d => d.id === location.district)?.lng + (Math.random() - 0.5) * 0.05,
      },
      source: getRandomItem(['MCD311 App', 'CM Helpline', 'Online Portal', 'Walk-in', 'Social Media', 'Letter', 'Email']),
      createdAt,
      updatedAt: new Date(new Date(createdAt).getTime() + Math.random() * 86400000 * 5).toISOString(),
      assignedTo: status !== COMPLAINT_STATUS.NEW ? getRandomItem(['Officer Ramesh Kumar', 'Officer Sunil Verma', 'Officer Pooja Mehra', 'Officer Deepak Rao', 'AO Kiran Bedi', 'AO Manoj Sharma']) : null,
      slaDeadline: new Date(new Date(createdAt).getTime() + (priority === 'critical' ? 86400000 : priority === 'high' ? 86400000 * 3 : 86400000 * 7)).toISOString(),
      slaBreached: Math.random() > 0.6,
      citizenVerified: status === COMPLAINT_STATUS.CLOSED,
      hasEvidence: Math.random() > 0.4,
      evidenceCount: Math.floor(Math.random() * 5),
      timeline,
      notes: Math.random() > 0.5 ? `Field visit scheduled. ${getRandomItem(['Contractor informed.', 'Material ordered.', 'Waiting for clearance.', 'Budget approval pending.'])}` : '',
    });
  }

  // Sort by creation date, newest first
  return complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export const complaints = generateComplaints();

// Dashboard statistics
export const dashboardStats = {
  totalComplaints: 15420,
  todayComplaints: 247,
  pendingComplaints: 4830,
  resolvedToday: 189,
  criticalAlerts: 12,
  avgResolutionDays: 4.2,
  citizenSatisfaction: 72,
  falseClosure: 8.3,
  slaCompliance: 67,
  escalated: 340,
  reopened: 156,
  districtWise: DELHI_DISTRICTS.map(d => ({
    ...d,
    totalComplaints: Math.floor(800 + Math.random() * 2000),
    pending: Math.floor(200 + Math.random() * 600),
    resolved: Math.floor(400 + Math.random() * 1200),
    critical: Math.floor(Math.random() * 15),
  })),
  departmentWise: DEPARTMENTS.map(d => ({
    ...d,
    avgResolutionDays: (2 + Math.random() * 8).toFixed(1),
    slaCompliance: Math.floor(50 + Math.random() * 45),
    satisfaction: Math.floor(55 + Math.random() * 40),
  })),
  weeklyTrend: [
    { day: 'Mon', complaints: 342, resolved: 298 },
    { day: 'Tue', complaints: 387, resolved: 312 },
    { day: 'Wed', complaints: 356, resolved: 340 },
    { day: 'Thu', complaints: 298, resolved: 276 },
    { day: 'Fri', complaints: 412, resolved: 289 },
    { day: 'Sat', complaints: 234, resolved: 198 },
    { day: 'Sun', complaints: 178, resolved: 156 },
  ],
  monthlyTrend: [
    { month: 'Jan', complaints: 8900, resolved: 7200 },
    { month: 'Feb', complaints: 9200, resolved: 7800 },
    { month: 'Mar', complaints: 10500, resolved: 8100 },
    { month: 'Apr', complaints: 11200, resolved: 8900 },
    { month: 'May', complaints: 13800, resolved: 9200 },
    { month: 'Jun', complaints: 15420, resolved: 10590 },
  ],
  topCategories: [
    { category: 'Water Supply', count: 3200, icon: '💧' },
    { category: 'Roads & Potholes', count: 2800, icon: '🛣️' },
    { category: 'Sanitation', count: 2400, icon: '🗑️' },
    { category: 'Electricity', count: 2100, icon: '⚡' },
    { category: 'Sewage & Drains', count: 1900, icon: '🚰' },
    { category: 'Law & Order', count: 1580, icon: '👮' },
    { category: 'Healthcare', count: 760, icon: '🏥' },
    { category: 'Education', count: 540, icon: '📚' },
  ],
};

export const officers = [
  { id: 1, name: 'Ramesh Kumar', nameHi: 'रमेश कुमार', designation: 'SDM', department: 'MCD', district: 'Central Delhi', phone: '+91 9811234567', email: 'ramesh.kumar@delhi.gov.in', activeComplaints: 23, resolvedThisMonth: 45, avgResolutionDays: 3.2, performance: 87, status: 'active', bandwidth: 'high' },
  { id: 2, name: 'Sunil Verma', nameHi: 'सुनील वर्मा', designation: 'AE', department: 'DJB', district: 'East Delhi', phone: '+91 9811234568', email: 'sunil.verma@delhi.gov.in', activeComplaints: 34, resolvedThisMonth: 38, avgResolutionDays: 4.5, performance: 72, status: 'active', bandwidth: 'overloaded' },
  { id: 3, name: 'Pooja Mehra', nameHi: 'पूजा मेहरा', designation: 'JE', department: 'PWD', district: 'South Delhi', phone: '+91 9811234569', email: 'pooja.mehra@delhi.gov.in', activeComplaints: 18, resolvedThisMonth: 52, avgResolutionDays: 2.8, performance: 92, status: 'active', bandwidth: 'moderate' },
  { id: 4, name: 'Deepak Rao', nameHi: 'दीपक राव', designation: 'SHO', department: 'MCD', district: 'North Delhi', phone: '+91 9811234570', email: 'deepak.rao@delhi.gov.in', activeComplaints: 15, resolvedThisMonth: 30, avgResolutionDays: 5.1, performance: 68, status: 'active', bandwidth: 'moderate' },
  { id: 5, name: 'Kiran Bedi', nameHi: 'किरण बेदी', designation: 'AO', department: 'MCD', district: 'North East Delhi', phone: '+91 9811234571', email: 'kiran.bedi@delhi.gov.in', activeComplaints: 28, resolvedThisMonth: 25, avgResolutionDays: 6.3, performance: 58, status: 'active', bandwidth: 'overloaded' },
  { id: 6, name: 'Manoj Sharma', nameHi: 'मनोज शर्मा', designation: 'AO', department: 'BSES', district: 'West Delhi', phone: '+91 9811234572', email: 'manoj.sharma@delhi.gov.in', activeComplaints: 12, resolvedThisMonth: 41, avgResolutionDays: 3.0, performance: 85, status: 'active', bandwidth: 'low' },
  { id: 7, name: 'Anita Singh', nameHi: 'अनिता सिंह', designation: 'SDM', department: 'MCD', district: 'South West Delhi', phone: '+91 9811234573', email: 'anita.singh@delhi.gov.in', activeComplaints: 31, resolvedThisMonth: 35, avgResolutionDays: 4.8, performance: 71, status: 'on_leave', bandwidth: 'unavailable' },
  { id: 8, name: 'Ravi Prakash', nameHi: 'रवि प्रकाश', designation: 'JE', department: 'DJB', district: 'North West Delhi', phone: '+91 9811234574', email: 'ravi.prakash@delhi.gov.in', activeComplaints: 20, resolvedThisMonth: 48, avgResolutionDays: 2.5, performance: 94, status: 'active', bandwidth: 'moderate' },
  { id: 9, name: 'Sunita Yadav', nameHi: 'सुनीता यादव', designation: 'AE', department: 'PWD', district: 'Shahdara', phone: '+91 9811234575', email: 'sunita.yadav@delhi.gov.in', activeComplaints: 27, resolvedThisMonth: 29, avgResolutionDays: 5.5, performance: 63, status: 'active', bandwidth: 'high' },
  { id: 10, name: 'Vijay Malhotra', nameHi: 'विजय मल्होत्रा', designation: 'SDM', department: 'DJB', district: 'South East Delhi', phone: '+91 9811234576', email: 'vijay.malhotra@delhi.gov.in', activeComplaints: 9, resolvedThisMonth: 55, avgResolutionDays: 2.1, performance: 96, status: 'active', bandwidth: 'low' },
];

// Visit logs for CM
export const visitLogs = [
  { id: 1, date: '2026-06-18', location: 'Chandni Chowk, Central Delhi', purpose: 'Inspection of road repair work', complaintsNearby: 14, resolved: 8, notes: 'Road work 60% complete. Directed PWD to finish by June 25.' },
  { id: 2, date: '2026-06-15', location: 'Seelampur, North East Delhi', purpose: 'Water supply complaint review', complaintsNearby: 23, resolved: 5, notes: 'DJB pipeline work delayed. Escalated to Secretary level.' },
  { id: 3, date: '2026-06-12', location: 'Dwarka, South West Delhi', purpose: 'New school inauguration & area review', complaintsNearby: 8, resolved: 3, notes: 'Noted parking and sanitation issues. MCD directed to resolve.' },
  { id: 4, date: '2026-06-10', location: 'Rohini, North West Delhi', purpose: 'Hospital complaint inspection', complaintsNearby: 11, resolved: 6, notes: 'Medicine supply restored. Doctor attendance issue escalated.' },
  { id: 5, date: '2026-06-05', location: 'Okhla, South East Delhi', purpose: 'Pollution complaint area visit', complaintsNearby: 19, resolved: 2, notes: 'Factory found violating norms. DPCC sealed the unit.' },
];
