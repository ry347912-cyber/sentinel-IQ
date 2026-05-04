const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const Log = require('../models/Log');
const { authenticate } = require('../middleware/auth');

const getIp = (req) => req.ip || req.connection.remoteAddress || '0.0.0.0';

// ─── POST /api/auth/change-password ──────────────────────────────────────
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      await Log.createLog({
        userId: user._id, username: user.username,
        action: 'PASSWORD_CHANGE', status: 'FAILURE',
        ipAddress: getIp(req), details: 'Wrong current password supplied',
        riskScore: 30,
      });
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    // Terminate all other sessions after password change
    await Session.updateMany(
      { userId: user._id, sessionToken: { $ne: req.session.sessionToken } },
      { isActive: false, terminatedAt: new Date(), terminationReason: 'new_login' }
    );

    await Log.createLog({
      userId: user._id, username: user.username,
      action: 'PASSWORD_CHANGE', status: 'SUCCESS',
      ipAddress: getIp(req), details: 'Password changed; all other sessions revoked',
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, message: 'Password change failed' });
  }
});

// ─── GET /api/user/profile ────────────────────────────────────────────────
router.get('/profile', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      trustScore: req.user.trustScore,
      lastLogin: req.user.lastLogin,
      lastLoginIp: req.user.lastLoginIp,
      isVerified: req.user.isVerified,
      isMfaEnabled: req.user.isMfaEnabled,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;
