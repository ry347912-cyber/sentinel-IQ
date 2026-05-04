const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  deviceId: { type: String, required: true, unique: true },
  userAgent: { type: String, required: true },
  browser: { type: String },
  os: { type: String },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  },
  ipAddress: { type: String, required: true },
  isTrusted: { type: Boolean, default: false },
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  lastSeen: { type: Date, default: Date.now },
  firstSeen: { type: Date, default: Date.now },
  loginCount: { type: Number, default: 1 },
  isBlocked: { type: Boolean, default: false },
  blockedReason: { type: String },
  location: {
    country: String,
    city: String,
    timezone: String,
  },
  createdAt: { type: Date, default: Date.now },
});

// Parse user agent helper
DeviceSchema.statics.parseUserAgent = function (userAgent) {
  const ua = userAgent || '';
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'desktop';

  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) { os = 'Android'; deviceType = 'mobile'; }
  else if (ua.includes('iOS') || ua.includes('iPhone')) { os = 'iOS'; deviceType = 'mobile'; }

  return { browser, os, deviceType };
};

module.exports = mongoose.model('Device', DeviceSchema);
