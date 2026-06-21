/**
 * VAANI Database Seed Script
 * Creates departments, districts, demo users (one per role), and 75+ realistic complaints
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const User = require('../../models/User');
const Department = require('../../models/Department');
const DistrictWard = require('../../models/DistrictWard');
const Complaint = require('../../models/Complaint');
const departmentsData = require('./departments.json');
const districtsData = require('./delhi_districts.json');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vaani';

const complaintTexts = {
  water: [
    'No water supply for last 3 days in our colony. Tanker not arriving despite repeated calls.',
    'Water pressure is extremely low. Only trickle comes from taps.',
    'Contaminated water supply - yellow colored water with foul smell. Children fell sick.',
    'Water pipeline burst on main road. Water wasting for 2 days.',
    'पानी नहीं आ रहा 3 दिन से। टैंकर भी नहीं आ रहा।',
  ],
  electricity: [
    'Power outage for 12 hours in peak summer. No response from BSES.',
    'Street lights not working in entire colony for 2 weeks. Safety concern.',
    'Exposed electric wires hanging from pole near school. Extreme danger.',
    'Transformer sparking and making loud noise. Fire risk.',
    'बिजली 12 घंटे से गायब है। कोई जवाब नहीं मिल रहा।',
  ],
  roads: [
    'Massive pothole on main road causing accidents daily.',
    'Road completely damaged after monsoon. No repair work started.',
    'Road caved in near metro construction. Dangerous for pedestrians.',
    'सड़क पर बड़ा गड्ढा है, रोज एक्सीडेंट हो रहे हैं।',
  ],
  sanitation: [
    'Garbage not collected for 5 days. Piling up near residential area.',
    'Open dumping of garbage near park. Children cannot play.',
    'Dead animal carcass on road for 3 days. No one came.',
    'कूड़ा 5 दिन से नहीं उठाया गया। बदबू आ रही है।',
  ],
  sewage: [
    'Sewer overflowing on main road. Dirty water entering houses.',
    'Blocked drain causing waterlogging during rain.',
    'Sewage line burst. Foul smell throughout the colony.',
    'सीवर का पानी सड़क पर बह रहा है। घरों में आ रहा है।',
  ],
  encroachment: [
    'Illegal construction happening on government land.',
    'Street vendors blocking entire footpath. Pedestrians forced to walk on road.',
  ],
  pollution: [
    'Factory releasing toxic smoke. Air quality very poor in area.',
    'Chemical smell from factory. People feeling nauseous.',
  ],
  transport: [
    'Bus stop shifted without notice. Old people unable to walk to new stop.',
    'No bus service on route 522 for 2 weeks.',
  ],
  gas_leak: [
    'EMERGENCY: Gas smell in entire colony. Suspected pipeline leak. Need immediate attention.',
  ],
  building_collapse: [
    'URGENT: Building showing major cracks. 20 families at risk.',
  ],
  open_manhole: [
    'CRITICAL: Open manhole on school route. Child fell in last week.',
  ],
  fire_hazard: [
    'Illegal factory storing chemicals in residential area. Fire risk.',
  ],
};

const areas = [
  { area: 'Chandni Chowk', district: 'central', pin: '110006', lat: 28.6507, lng: 77.2334 },
  { area: 'Karol Bagh', district: 'central', pin: '110005', lat: 28.6514, lng: 77.1907 },
  { area: 'Laxmi Nagar', district: 'east', pin: '110092', lat: 28.6305, lng: 77.2771 },
  { area: 'Preet Vihar', district: 'east', pin: '110092', lat: 28.6421, lng: 77.2943 },
  { area: 'Connaught Place', district: 'new_delhi', pin: '110001', lat: 28.6315, lng: 77.2167 },
  { area: 'Sarojini Nagar', district: 'new_delhi', pin: '110023', lat: 28.5769, lng: 77.1993 },
  { area: 'Model Town', district: 'north', pin: '110009', lat: 28.7153, lng: 77.1926 },
  { area: 'Civil Lines', district: 'north', pin: '110054', lat: 28.6816, lng: 77.2263 },
  { area: 'Seelampur', district: 'north_east', pin: '110053', lat: 28.6746, lng: 77.2668 },
  { area: 'Mustafabad', district: 'north_east', pin: '110094', lat: 28.7054, lng: 77.2664 },
  { area: 'Rohini', district: 'north_west', pin: '110085', lat: 28.7329, lng: 77.1213 },
  { area: 'Pitampura', district: 'north_west', pin: '110034', lat: 28.7025, lng: 77.1324 },
  { area: 'Shahdara', district: 'shahdara', pin: '110032', lat: 28.6738, lng: 77.2947 },
  { area: 'Vivek Vihar', district: 'shahdara', pin: '110095', lat: 28.6728, lng: 77.3145 },
  { area: 'Saket', district: 'south', pin: '110017', lat: 28.5244, lng: 77.2109 },
  { area: 'Hauz Khas', district: 'south', pin: '110016', lat: 28.5494, lng: 77.2001 },
  { area: 'Kalkaji', district: 'south_east', pin: '110019', lat: 28.5410, lng: 77.2586 },
  { area: 'Okhla', district: 'south_east', pin: '110020', lat: 28.5396, lng: 77.2725 },
  { area: 'Dwarka', district: 'south_west', pin: '110075', lat: 28.5921, lng: 77.0460 },
  { area: 'Najafgarh', district: 'south_west', pin: '110043', lat: 28.6141, lng: 76.9799 },
  { area: 'Janakpuri', district: 'west', pin: '110058', lat: 28.6273, lng: 77.0822 },
  { area: 'Rajouri Garden', district: 'west', pin: '110027', lat: 28.6467, lng: 77.1213 },
  { area: 'Mayur Vihar', district: 'east', pin: '110091', lat: 28.5937, lng: 77.2976 },
  { area: 'Burari', district: 'north', pin: '110084', lat: 28.7570, lng: 77.2056 },
  { area: 'Uttam Nagar', district: 'south_west', pin: '110059', lat: 28.6210, lng: 77.0611 },
];

const citizenNames = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Verma', 'Sunita Devi', 'Mohammad Aslam',
  'Rekha Yadav', 'Vikram Singh', 'Anita Gupta', 'Suresh Chand', 'Kavita Jain',
  'Ramesh Pandey', 'Nisha Malik', 'Deepak Chauhan', 'Pooja Rani', 'Harish Kumar',
  'Suman Lata', 'Abdul Rehman', 'Geeta Devi', 'Manoj Tiwari', 'Renu Bala',
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randDate = (daysBack) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 14) + 7); // 7am-9pm
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
};

async function seed() {
  console.log('🌱 VAANI — Seeding database...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    DistrictWard.deleteMany({}),
    Complaint.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // 1. Seed Departments
  const departments = await Department.insertMany(departmentsData);
  console.log(`✅ Seeded ${departments.length} departments`);
  const deptMap = {};
  departments.forEach(d => { deptMap[d.code] = d; });

  // 2. Seed Districts
  const districts = await DistrictWard.insertMany(districtsData);
  console.log(`✅ Seeded ${districts.length} districts`);

  // 3. Seed Demo Users (one per role)
  const demoUsers = [
    { name: 'Chief Minister', mobile: '+919999000001', role: 'cm', district: 'Central', language_preference: 'en' },
    { name: 'CM Staff Ramesh', mobile: '+919999000002', role: 'cm_staff', district: 'Central', language_preference: 'en' },
    { name: 'DM Central Rajiv', mobile: '+919999000003', role: 'district_officer', district: 'Central', language_preference: 'en' },
    { name: 'DM East Priya', mobile: '+919999000010', role: 'district_officer', district: 'East', language_preference: 'hi' },
    { name: 'MCD Manager Sunil', mobile: '+919999000004', role: 'department_manager', district: 'Central', department: deptMap['MCD']._id, language_preference: 'en' },
    { name: 'DJB Manager Pooja', mobile: '+919999000011', role: 'department_manager', district: 'Central', department: deptMap['DJB']._id, language_preference: 'en' },
    { name: 'PWD Nodal Officer', mobile: '+919999000018', role: 'nodal_officer', district: 'Central', department: deptMap['PWD']._id, language_preference: 'en' },
    { name: 'BSES Nodal Officer', mobile: '+919999000019', role: 'nodal_officer', district: 'Central', department: deptMap['BSES']._id, language_preference: 'en' },
    { name: 'MCD Commissioner', mobile: '+919999000021', role: 'commissioner', district: 'Central', department: deptMap['MCD']._id, language_preference: 'en' },
    { name: 'DJB Commissioner', mobile: '+919999000022', role: 'commissioner', district: 'Central', department: deptMap['DJB']._id, language_preference: 'en' },
    { name: 'Super Admin', mobile: '+919999000023', role: 'super_admin', district: 'Central', language_preference: 'en' },
  ];

  // Officers across departments and districts
  const officerData = [
    { name: 'Ramesh Kumar', mobile: '+919999000005', district: 'Central', dept: 'MCD', designation: 'SDM', empId: 'MCD-001' },
    { name: 'Sunil Verma', mobile: '+919999000006', district: 'East', dept: 'DJB', designation: 'AE', empId: 'DJB-001' },
    { name: 'Pooja Mehra', mobile: '+919999000007', district: 'South', dept: 'PWD', designation: 'JE', empId: 'PWD-001' },
    { name: 'Deepak Rao', mobile: '+919999000008', district: 'North', dept: 'MCD', designation: 'SHO', empId: 'MCD-002' },
    { name: 'Kiran Bedi', mobile: '+919999000012', district: 'North East', dept: 'MCD', designation: 'MO', empId: 'HLTH-001' },
    { name: 'Manoj Sharma', mobile: '+919999000013', district: 'West', dept: 'BSES', designation: 'AE', empId: 'BSES-001' },
    { name: 'Anita Singh', mobile: '+919999000014', district: 'South West', dept: 'MCD', designation: 'SDM', empId: 'MCD-003' },
    { name: 'Ravi Prakash', mobile: '+919999000015', district: 'North West', dept: 'DJB', designation: 'JE', empId: 'DJB-002' },
    { name: 'Sunita Yadav', mobile: '+919999000016', district: 'Shahdara', dept: 'PWD', designation: 'AE', empId: 'PWD-002' },
    { name: 'Vijay Malhotra', mobile: '+919999000017', district: 'South East', dept: 'DJB', designation: 'Inspector', empId: 'DPCC-001' },
  ];

  for (const o of officerData) {
    demoUsers.push({
      name: o.name,
      mobile: o.mobile,
      role: 'officer',
      district: o.district,
      department: deptMap[o.dept]._id,
      language_preference: 'en',
      officer_profile: {
        employee_id: o.empId,
        designation: o.designation,
        active_complaints_count: Math.floor(Math.random() * 15),
        max_capacity: 20,
        is_available: true,
        contact_phone: o.mobile,
        scorecard: {
          total_assigned: 50 + Math.floor(Math.random() * 100),
          total_resolved: 30 + Math.floor(Math.random() * 80),
          total_disputed: Math.floor(Math.random() * 5),
          false_closure_rate: Math.random() * 10,
          avg_resolution_time_hours: 24 + Math.random() * 120,
          citizen_satisfaction_avg: 3 + Math.random() * 2,
          on_time_rate: 60 + Math.random() * 35,
          anomaly_flag_count: Math.floor(Math.random() * 3),
          credibility_score: 75 + Math.floor(Math.random() * 25),
        },
      },
    });
  }

  // Demo citizens
  const citizenMobiles = [];
  for (let i = 0; i < 20; i++) {
    const mobile = `+91${9800000020 + i}`;
    citizenMobiles.push(mobile);
    demoUsers.push({
      name: citizenNames[i],
      mobile,
      role: 'citizen',
      district: rand(districtsData).code,
      language_preference: rand(['en', 'hi']),
    });
  }

  const users = await User.insertMany(demoUsers);
  console.log(`✅ Seeded ${users.length} users`);

  const officerUsers = users.filter(u => u.role === 'officer');
  const citizenUsers = users.filter(u => u.role === 'citizen');

  // 4. Seed Complaints
  const statuses = ['FILED', 'PENDING_ASSIGN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_CLOSURE', 'DISPUTED', 'PROVISIONALLY_CLOSED', 'CLOSED', 'ESCALATED', 'DEFCON_ALERT'];
  const priorities = ['DEFCON_RED', 'DEFCON_ORANGE', 'DEFCON_YELLOW', 'DEFCON_GREEN', 'DEFCON_GREEN', 'DEFCON_GREEN', 'DEFCON_GREEN']; // weighted toward GREEN
  const sources = ['web', 'whatsapp', 'ivr', 'manual'];
  const categories = Object.keys(complaintTexts);

  const complaintDocs = [];
  for (let i = 0; i < 80; i++) {
    const cat = rand(categories);
    const text = rand(complaintTexts[cat]);
    const loc = rand(areas);
    const priority = rand(priorities);
    const status = rand(statuses);
    const citizen = rand(citizenUsers);
    const officer = rand(officerUsers);
    const createdAt = randDate(30);
    const isCritical = ['gas_leak', 'building_collapse', 'open_manhole', 'fire_hazard'].includes(cat);

    const deptCode = cat === 'water' || cat === 'sewage' ? 'DJB' :
      cat === 'roads' ? 'PWD' :
      cat === 'sanitation' || cat === 'encroachment' || cat === 'open_manhole' ? 'MCD' :
      cat === 'electricity' ? 'BSES' :
      cat === 'pollution' ? 'DJB' :
      cat === 'transport' ? 'PWD' :
      cat === 'gas_leak' ? 'DJB' :
      cat === 'fire_hazard' ? 'MCD' :
      cat === 'building_collapse' ? 'MCD' : 'CMO';

    const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
    const complaintId = `VAANI-${dateStr}-${String(10000 + i).padStart(5, '0')}`;

    const slaHours = priority === 'DEFCON_RED' ? 4 : priority === 'DEFCON_ORANGE' ? 24 : priority === 'DEFCON_YELLOW' ? 72 : 168;
    const slaDeadline = new Date(createdAt.getTime() + slaHours * 3600000);

    const timeline = [
      { event: 'Complaint filed', actor_id: citizen._id, actor_role: 'citizen', timestamp: createdAt },
    ];
    if (['ASSIGNED', 'IN_PROGRESS', 'PENDING_CLOSURE', 'CLOSED', 'PROVISIONALLY_CLOSED', 'DISPUTED'].includes(status)) {
      timeline.push({ event: 'Assigned to officer', actor_role: 'system', timestamp: new Date(createdAt.getTime() + 3600000) });
    }
    if (['IN_PROGRESS', 'PENDING_CLOSURE', 'CLOSED', 'PROVISIONALLY_CLOSED'].includes(status)) {
      timeline.push({ event: 'Work in progress', actor_id: officer._id, actor_role: 'officer', timestamp: new Date(createdAt.getTime() + 86400000) });
    }
    if (['CLOSED', 'PROVISIONALLY_CLOSED'].includes(status)) {
      timeline.push({ event: 'Marked resolved', actor_id: officer._id, actor_role: 'officer', timestamp: new Date(createdAt.getTime() + 86400000 * 3) });
    }

    const closure = ['PENDING_CLOSURE', 'CLOSED', 'PROVISIONALLY_CLOSED', 'DISPUTED'].includes(status) ? {
      speaking_order: 'Visited the site and found the issue. Repair work has been completed satisfactorily. The area has been cleaned and restored to normal condition. Citizen was informed.',
      resolution_photos: [{ url: '/uploads/demo-resolution.jpg', watermarked: true }],
      resolution_type: 'fixed',
      citizen_verification: {
        sms_sent_at: new Date(createdAt.getTime() + 86400000 * 3),
        response: status === 'DISPUTED' ? 'disputed' : status === 'CLOSED' ? 'confirmed' : 'no_response',
        responded_at: status !== 'PENDING_CLOSURE' ? new Date(createdAt.getTime() + 86400000 * 4) : undefined,
      },
      officer_closed_at: new Date(createdAt.getTime() + 86400000 * 3),
      anti_false_closure_flags: status === 'DISPUTED' ? ['Citizen disputed resolution'] : [],
    } : undefined;

    complaintDocs.push({
      complaint_id: complaintId,
      citizen_id: citizen._id,
      complaint_text: text,
      location: {
        coords: { lat: loc.lat + (Math.random() - 0.5) * 0.01, lng: loc.lng + (Math.random() - 0.5) * 0.01 },
        address: `${loc.area}, Delhi`,
        district: loc.district,
        pincode: loc.pin,
      },
      category: cat,
      department_id: deptMap[deptCode]?._id,
      routing_confidence: 65 + Math.floor(Math.random() * 35),
      routing_method: 'auto_nlp',
      assigned_officer_id: status !== 'FILED' && status !== 'PENDING_ASSIGN' ? officer._id : undefined,
      assigned_at: status !== 'FILED' && status !== 'PENDING_ASSIGN' ? new Date(createdAt.getTime() + 3600000) : undefined,
      priority: isCritical ? 'DEFCON_RED' : priority,
      sla_deadline: slaDeadline,
      sla_breached: slaDeadline < new Date() && !['CLOSED', 'PROVISIONALLY_CLOSED'].includes(status),
      status,
      timeline,
      closure,
      source: rand(sources),
      cm_flagged: Math.random() > 0.9,
      createdAt,
    });
  }

  await Complaint.insertMany(complaintDocs);
  console.log(`✅ Seeded ${complaintDocs.length} complaints`);

  console.log('\n🎉 VAANI database seeded successfully!');
  console.log('\n📋 Demo Login Credentials (OTP: 123456):');
  console.log('   CM:             +919999000001');
  console.log('   CM Staff:       +919999000002');
  console.log('   DM Central:     +919999000003');
  console.log('   MCD Manager:    +919999000004');
  console.log('   Officer Ramesh: +919999000005');
  console.log('   Citizen Rajesh: +919800000020');
  console.log('   PWD Nodal:      +919999000018');
  console.log('   BSES Nodal:     +919999000019');
  console.log('   MCD Commision:  +919999000021');
  console.log('   DJB Commision:  +919999000022');
  console.log('   Super Admin:    +919999000023');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
