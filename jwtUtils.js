const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
    issuer: 'ztna-system',
    audience: 'ztna-client',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    issuer: 'ztna-system',
    audience: 'ztna-client',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'ztna-system',
    audience: 'ztna-client',
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'ztna-system',
    audience: 'ztna-client',
  });
};

const generateSessionToken = () => uuidv4();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// OTP expiry: 5 minutes
const getOTPExpiry = () => new Date(Date.now() + 5 * 60 * 1000);

// Generate device fingerprint
const generateDeviceId = (ip, userAgent) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').slice(0, 32);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateSessionToken,
  generateOTP,
  getOTPExpiry,
  generateDeviceId,
};
