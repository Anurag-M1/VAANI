const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Mock MCD311 API
router.get('/mcd311/categories', (req, res) => {
  res.json({
    categories: [
      { id: 'garbage', name: 'Garbage Collection', name_hi: 'कूड़ा संग्रहण' },
      { id: 'sanitation', name: 'Sanitation', name_hi: 'स्वच्छता' },
      { id: 'stray_dog', name: 'Stray Dog', name_hi: 'आवारा कुत्ता' },
      { id: 'tree', name: 'Tree Cutting/Planting', name_hi: 'पेड़ काटना/लगाना' },
      { id: 'park', name: 'Park Maintenance', name_hi: 'पार्क रखरखाव' },
      { id: 'building', name: 'Building Safety', name_hi: 'भवन सुरक्षा' },
    ],
  });
});

router.post('/mcd311/complaint', (req, res) => {
  res.json({
    success: true,
    external_id: `MCD-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    status: 'registered',
    message: 'Complaint registered with MCD311',
  });
});

router.get('/mcd311/complaint/:id', (req, res) => {
  res.json({
    id: req.params.id,
    status: 'in_progress',
    last_updated: new Date().toISOString(),
    officer_assigned: 'MCD Officer',
  });
});

// Mock DJB API
router.get('/djb/categories', (req, res) => {
  res.json({
    categories: [
      { id: 'water_supply', name: 'Water Supply', name_hi: 'जल आपूर्ति' },
      { id: 'sewage', name: 'Sewage', name_hi: 'सीवर' },
      { id: 'billing', name: 'Billing', name_hi: 'बिलिंग' },
      { id: 'pipeline', name: 'Pipeline', name_hi: 'पाइपलाइन' },
    ],
  });
});

router.post('/djb/complaint', (req, res) => {
  res.json({
    success: true,
    external_id: `DJB-${Date.now()}`,
    status: 'registered',
  });
});

// Mock PGMS Sync
router.post('/pgms/sync', (req, res) => {
  res.json({
    success: true,
    synced: Math.floor(Math.random() * 20) + 5,
    failed: Math.floor(Math.random() * 3),
    timestamp: new Date().toISOString(),
  });
});

// Sync status
router.get('/sync-status', (req, res) => {
  res.json({
    mcd311: { status: 'active', last_sync: new Date().toISOString(), success_rate: 98 },
    djb: { status: 'active', last_sync: new Date().toISOString(), success_rate: 95 },
    pgms: { status: 'active', last_sync: new Date().toISOString(), success_rate: 92 },
    pwd: { status: 'local_mode', last_sync: null, success_rate: 0 },
  });
});

module.exports = router;
