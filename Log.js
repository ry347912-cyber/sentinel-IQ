const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  username: { type: String },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_BLOCKED',
      'LOGOUT', 'REGISTER', 'OTP_SENT', 'OTP_VERIFIED', 'OTP_FAILED',
      'TOKEN_REFRESH', 'TOKEN_REVOKED', 'PASSWORD_CHANGE',
      'SUSPICIOUS_ACTIVITY', 'SESSION_TERMINATED',
      'RESOURCE_ACCESS', 'PERMISSION_DENIED',
      'ADMIN_ACTION', 'DEVICE_TRUSTED', 'DEVICE_BLOCKED',
      'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED',
    ],
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING', 'CRITICAL'],
    required: true,
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  deviceId: { type: String },
  resource: { type: String },
  details: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  timestamp: { type: Date, default: Date.now, index: true },
});

// Static method for creating logs
LogSchema.statics.createLog = async function (data) {
  try {
    return await this.create(data);
  } catch (err) {
    console.error('Log creation failed:', err.message);
  }
};

module.exports = mongoose.model('Log', LogSchema);
