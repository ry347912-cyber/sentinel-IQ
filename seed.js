/**
 * ZTNA Demo Data Seeder
 * Run: node seed.js
 * Seeds: 1 admin, 3 users, devices, sessions, logs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const User = require('./models/User');
const Device = require('./models/Device');
const Session = require('./models/Session');
const Log = require('./models/Log');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ztna_db';

const deviceId = (ip, ua) =>
  crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 32);

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Device.deleteMany({}),
    Session.deleteMany({}), Log.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ─── Users ─────────────────────────────────────────────────────────────
  const usersData = [
    { username: 'admin',    email: 'admin@ztna.local',   password: 'Admin@1234', role: 'admin',  trustScore: 95 },
    { username: 'rupesh',   email: 'rupesh@ztna.local',  password: 'User@1234',  role: 'user',   trustScore: 82 },
    { username: 'priya',    email: 'priya@ztna.local',   password: 'User@1234',  role: 'user',   trustScore: 71 },
    { username: 'hacker',   email: 'hacker@ztna.local',  password: 'Hack@1234',  role: 'user',   trustScore: 23, isActive: false },
  ];

  const users = [];
  for (const u of usersData) {
    const user = new User({ ...u, lastLogin: new Date(), lastLoginIp: '192.168.1.1' });
    await user.save();
    users.push(user);
    console.log(`  👤 Created user: ${u.username} (${u.role})`);
  }

  // ─── Devices ────────────────────────────────────────────────────────────
  const devicesData = [
    { userId: users[0]._id, ip: '192.168.1.10', ua: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120', browser: 'Chrome', os: 'Windows', type: 'desktop', trusted: true, score: 90 },
    { userId: users[1]._id, ip: '192.168.1.20', ua: 'Mozilla/5.0 (Macintosh) Safari/17.0', browser: 'Safari', os: 'macOS', type: 'desktop', trusted: true, score: 80 },
    { userId: users[1]._id, ip: '10.0.0.50',    ua: 'Mozilla/5.0 (Android) Chrome/120 Mobile', browser: 'Chrome', os: 'Android', type: 'mobile', trusted: false, score: 55 },
    { userId: users[2]._id, ip: '172.16.0.5',   ua: 'Mozilla/5.0 (X11; Linux) Firefox/121', browser: 'Firefox', os: 'Linux', type: 'desktop', trusted: false, score: 60 },
    { userId: users[3]._id, ip: '45.33.32.156',  ua: 'python-requests/2.28.0', browser: 'Unknown', os: 'Unknown', type: 'unknown', trusted: false, score: 10, blocked: true },
  ];

  const devices = [];
  for (const d of devicesData) {
    const dev = await Device.create({
      userId: d.userId,
      deviceId: deviceId(d.ip, d.ua),
      userAgent: d.ua,
      browser: d.browser,
      os: d.os,
      deviceType: d.type,
      ipAddress: d.ip,
      isTrusted: d.trusted,
      trustScore: d.score,
      loginCount: Math.floor(Math.random() * 20) + 1,
      isBlocked: d.blocked || false,
      blockedReason: d.blocked ? 'Automated tool detected' : undefined,
    });
    devices.push(dev);
    console.log(`  💻 Created device: ${d.browser}/${d.os} — ${d.ip}`);
  }

  // ─── Sessions ────────────────────────────────────────────────────────────
  const sessionsData = [
    { user: users[0], dev: devices[0], mfa: true,  suspicious: false },
    { user: users[1], dev: devices[1], mfa: true,  suspicious: false },
    { user: users[2], dev: devices[3], mfa: false, suspicious: true  },
  ];

  for (const s of sessionsData) {
    await Session.create({
      userId: s.user._id,
      deviceId: s.dev.deviceId,
      sessionToken: uuidv4(),
      ipAddress: s.dev.ipAddress,
      userAgent: s.dev.userAgent,
      mfaVerified: s.mfa,
      isSuspicious: s.suspicious,
      suspicionReason: s.suspicious ? 'IP changed mid-session' : undefined,
      isActive: true,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    console.log(`  🔐 Created session: ${s.user.username} — MFA:${s.mfa}`);
  }

  // ─── Logs ────────────────────────────────────────────────────────────────
  const actions = [
    { userId: users[0]._id, username: 'admin',  action: 'LOGIN_SUCCESS',       status: 'SUCCESS',  ip: '192.168.1.10', risk: 0,  details: 'Admin login' },
    { userId: users[1]._id, username: 'rupesh', action: 'LOGIN_SUCCESS',       status: 'SUCCESS',  ip: '192.168.1.20', risk: 0,  details: 'User login' },
    { userId: users[1]._id, username: 'rupesh', action: 'OTP_SENT',            status: 'SUCCESS',  ip: '192.168.1.20', risk: 0,  details: 'OTP sent' },
    { userId: users[2]._id, username: 'priya',  action: 'OTP_FAILED',          status: 'WARNING',  ip: '172.16.0.5',   risk: 50, details: 'Incorrect OTP' },
    { userId: users[3]._id, username: 'hacker', action: 'LOGIN_FAILED',        status: 'FAILURE',  ip: '45.33.32.156', risk: 40, details: 'Wrong credentials' },
    { userId: users[3]._id, username: 'hacker', action: 'LOGIN_FAILED',        status: 'FAILURE',  ip: '45.33.32.156', risk: 40, details: 'Attempt #2' },
    { userId: users[3]._id, username: 'hacker', action: 'LOGIN_BLOCKED',       status: 'CRITICAL', ip: '45.33.32.156', risk: 80, details: 'Account locked after 5 attempts' },
    { userId: users[2]._id, username: 'priya',  action: 'SUSPICIOUS_ACTIVITY', status: 'CRITICAL', ip: '99.99.99.99',  risk: 90, details: 'IP changed from 172.16.0.5 to 99.99.99.99' },
    { userId: users[0]._id, username: 'admin',  action: 'ADMIN_ACTION',        status: 'SUCCESS',  ip: '192.168.1.10', risk: 0,  details: 'Deactivated user: hacker' },
    { userId: users[0]._id, username: 'admin',  action: 'DEVICE_BLOCKED',      status: 'WARNING',  ip: '192.168.1.10', risk: 30, details: 'Blocked: Automated tool detected' },
    { userId: users[1]._id, username: 'rupesh', action: 'TOKEN_REFRESH',       status: 'SUCCESS',  ip: '192.168.1.20', risk: 0,  details: 'Access token refreshed' },
    { userId: users[1]._id, username: 'rupesh', action: 'PERMISSION_DENIED',   status: 'WARNING',  ip: '192.168.1.20', risk: 50, details: "Role 'user' attempted /api/admin/users" },
    { userId: users[0]._id, username: 'admin',  action: 'SESSION_TERMINATED',  status: 'WARNING',  ip: '192.168.1.10', risk: 20, details: 'Admin revoked session of priya' },
    { userId: users[1]._id, username: 'rupesh', action: 'LOGOUT',              status: 'SUCCESS',  ip: '192.168.1.20', risk: 0,  details: 'User initiated logout' },
    { userId: users[2]._id, username: 'priya',  action: 'REGISTER',            status: 'SUCCESS',  ip: '172.16.0.5',   risk: 0,  details: 'New user account registered' },
  ];

  // Spread logs across last 7 days
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    const daysAgo = Math.floor(Math.random() * 7);
    const hoursAgo = Math.floor(Math.random() * 23);
    const ts = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000);
    await Log.create({ ...a, ipAddress: a.ip, timestamp: ts });
    console.log(`  📋 Log: ${a.action} — ${a.username}`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('Demo Credentials:');
  console.log('  Admin:  admin@ztna.local    / Admin@1234');
  console.log('  User:   rupesh@ztna.local   / User@1234');
  console.log('  User:   priya@ztna.local    / User@1234');
  console.log('  (hacker account is deactivated)');
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
