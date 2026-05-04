const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Device = require('../models/Device');
const Session = require('../models/Session');
const Log = require('../models/Log');
const {
  generateAccessToken, generateRefreshToken, verifyRefreshToken,
  generateSessionToken, generateOTP, getOTPExpiry, generateDeviceId,
} = require('../auth/jwtUtils');
const { authenticate } = require('../middleware/auth');
const { registerValidation, loginValidation, otpValidation } = require('../middleware/validation');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

const getClientIp = (req) => req.ip || req.connection.remoteAddress || '0.0.0.0';

// ─── POST /api/auth/register ──────────────────────────────────────────────
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || '';

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.email === email ? 'Email already registered' : 'Username taken',
      });
    }

    // Only allow admin creation if no admins exist yet (first user)
    const adminCount = await User.countDocuments({ role: 'admin' });
    const assignedRole = adminCount === 0 ? 'admin' : 'user';

    const user = await User.create({
      username,
      email,
      password,
      role: assignedRole,
      lastLoginIp: ip,
    });

    await Log.createLog({
      userId: user._id,
      username: user.username,
      action: 'REGISTER',
      status: 'SUCCESS',
      ipAddress: ip,
      userAgent: ua,
      details: `New ${assignedRole} account registered`,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please login.',
      data: { userId: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || '';
    const deviceId = generateDeviceId(ip, ua);

    const user = await User.findOne({ email }).select('+password +otpSecret +otpExpiry');
    if (!user) {
      await Log.createLog({
        action: 'LOGIN_FAILED', status: 'FAILURE', ipAddress: ip,
        userAgent: ua, details: `Login attempt for non-existent email: ${email}`, riskScore: 30,
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isLocked()) {
      await Log.createLog({
        userId: user._id, username: user.username, action: 'LOGIN_BLOCKED',
        status: 'CRITICAL', ipAddress: ip, userAgent: ua,
        details: 'Login attempt on locked account', riskScore: 80,
      });
      return res.status(423).json({
        success: false,
        message: 'Account locked due to too many failed attempts. Try again in 30 minutes.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      await Log.createLog({
        userId: user._id, username: user.username, action: 'LOGIN_FAILED',
        status: 'FAILURE', ipAddress: ip, userAgent: ua,
        details: `Failed login attempt #${user.failedLoginAttempts + 1}`, riskScore: 40,
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Reset failed attempts
    await user.updateOne({ $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } });

    // Generate and store OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();
    await user.updateOne({ otpSecret: otp, otpExpiry });

    // Create or update device record
    const { browser, os, deviceType } = Device.parseUserAgent(ua);
    await Device.findOneAndUpdate(
      { deviceId },
      {
        $set: { lastSeen: new Date(), ipAddress: ip, userAgent: ua, browser, os, deviceType },
        $inc: { loginCount: 1 },
        $setOnInsert: { userId: user._id, firstSeen: new Date() },
      },
      { upsert: true, new: true }
    );

    // Create pending session (not MFA verified yet)
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 min for OTP window
    await Session.create({
      userId: user._id,
      deviceId,
      sessionToken,
      ipAddress: ip,
      userAgent: ua,
      mfaVerified: false,
      expiresAt,
    });

    await Log.createLog({
      userId: user._id, username: user.username, action: 'OTP_SENT',
      status: 'SUCCESS', ipAddress: ip, userAgent: ua, deviceId,
      details: `OTP sent to ${user.email.replace(/(.{2}).*@/, '$1***@')}`,
    });

    // SIMULATION: In production, send OTP via email/SMS. Here we return it for demo.
    console.log(`[OTP SIMULATION] OTP for ${user.email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to your registered email',
      data: {
        sessionToken,
        userId: user._id,
        email: user.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
        otpSimulated: process.env.NODE_ENV === 'development' ? otp : undefined,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────
router.post('/verify-otp', otpLimiter, otpValidation, async (req, res) => {
  try {
    const { otp, sessionToken } = req.body;
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || '';

    const session = await Session.findOne({ sessionToken, isActive: true });
    if (!session) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    const user = await User.findById(session.userId).select('+otpSecret +otpExpiry');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.otpSecret || user.otpExpiry < new Date()) {
      await Log.createLog({
        userId: user._id, username: user.username, action: 'OTP_FAILED',
        status: 'FAILURE', ipAddress: ip, details: 'OTP expired', riskScore: 20,
      });
      return res.status(401).json({ success: false, message: 'OTP expired. Please login again.' });
    }

    if (user.otpSecret !== otp) {
      await Log.createLog({
        userId: user._id, username: user.username, action: 'OTP_FAILED',
        status: 'WARNING', ipAddress: ip, details: 'Incorrect OTP entered', riskScore: 50,
      });
      return res.status(401).json({ success: false, message: 'Incorrect OTP' });
    }

    // Clear OTP
    await user.updateOne({ $unset: { otpSecret: 1, otpExpiry: 1 }, lastLogin: new Date(), lastLoginIp: ip });

    // Mark session as MFA verified
    const accessExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const tokenPayload = {
      userId: user._id,
      username: user.username,
      role: user.role,
      sessionToken,
      deviceId: session.deviceId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user._id, sessionToken });

    await session.updateOne({
      mfaVerified: true,
      refreshToken,
      expiresAt: accessExpiry,
    });

    await Log.createLog({
      userId: user._id, username: user.username, action: 'LOGIN_SUCCESS',
      status: 'SUCCESS', ipAddress: ip, userAgent: ua, deviceId: session.deviceId,
      details: 'Full authentication completed (password + MFA)',
    });

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          trustScore: user.trustScore,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const session = await Session.findOne({ refreshToken, isActive: true });
    if (!session) {
      return res.status(401).json({ success: false, message: 'Session not found' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const tokenPayload = {
      userId: user._id,
      username: user.username,
      role: user.role,
      sessionToken: decoded.sessionToken,
      deviceId: session.deviceId,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await session.updateOne({ expiresAt: newExpiresAt, lastActivity: new Date() });

    await Log.createLog({
      userId: user._id, username: user.username, action: 'TOKEN_REFRESH',
      status: 'SUCCESS', ipAddress: getClientIp(req),
    });

    res.json({ success: true, data: { accessToken: newAccessToken, expiresIn: 900 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  try {
    await Session.findOneAndUpdate(
      { sessionToken: req.session.sessionToken },
      { isActive: false, terminatedAt: new Date(), terminationReason: 'logout' }
    );

    await Log.createLog({
      userId: req.user._id, username: req.user.username, action: 'LOGOUT',
      status: 'SUCCESS', ipAddress: getClientIp(req),
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      trustScore: req.user.trustScore,
      lastLogin: req.user.lastLogin,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;
