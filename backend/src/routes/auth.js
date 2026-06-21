const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendOtp, verifyOtp, refreshToken, logout, getMe, updateMe } = require('../controllers/authController');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/refresh', refreshToken);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);
router.patch('/me', auth, updateMe);

module.exports = router;
