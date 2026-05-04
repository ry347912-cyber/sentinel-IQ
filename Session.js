const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  deviceId: { type: String, required: true },
  sessionToken: { type: String, required: true, unique: true },
  refreshToken: { type: String, unique: true, sparse: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String },
  isActive: { type: Boolean, default: true },
  isSuspicious: { type: Boolean, default: false },
  suspicionReason: { type: String },
  mfaVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  lastActivity: { type: Date, default: Date.now },
  terminatedAt: { type: Date },
  terminationReason: {
    type: String,
    enum: ['logout', 'expired', 'suspicious', 'admin_revoke', 'new_login'],
  },
});

// Auto-expire sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', SessionSchema);
