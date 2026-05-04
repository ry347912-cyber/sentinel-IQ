const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Device = require('../models/Device');
const Session = require('../models/Session');
const Log = require('../models/Log');
const { authenticate, authorize } = require('../middleware/auth');

const adminOnly = [authenticate, authorize('admin')];

// ─── GET /api/admin/users ─────────────────────────────────────────────────
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password');

    res.json({ success: true, data: { users, total, page: parseInt(page) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ─── PATCH /api/admin/users/:id/toggle ───────────────────────────────────
router.patch('/users/:id/toggle', ...adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot modify your own account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    if (!user.isActive) {
      await Session.updateMany({ userId: user._id }, {
        isActive: false, terminatedAt: new Date(), terminationReason: 'admin_revoke',
      });
    }

    await Log.createLog({
      userId: req.user._id, username: req.user.username,
      action: 'ADMIN_ACTION', status: 'SUCCESS',
      details: `${user.isActive ? 'Activated' : 'Deactivated'} user: ${user.username}`,
    });

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Action failed' });
  }
});

// ─── PATCH /api/admin/users/:id/role ─────────────────────────────────────
router.patch('/users/:id/role', ...adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Log.createLog({
      userId: req.user._id, username: req.user.username,
      action: 'ADMIN_ACTION', status: 'SUCCESS',
      details: `Changed role of ${user.username} to ${role}`,
    });

    res.json({ success: true, message: `Role updated to ${role}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Role update failed' });
  }
});

// ─── DELETE /api/admin/sessions/:id ──────────────────────────────────────
router.delete('/sessions/:id', ...adminOnly, async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, {
      isActive: false, terminatedAt: new Date(), terminationReason: 'admin_revoke',
    });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    await Log.createLog({
      userId: req.user._id, username: req.user.username,
      action: 'SESSION_TERMINATED', status: 'WARNING',
      details: `Admin revoked session: ${session._id}`,
    });

    res.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to terminate session' });
  }
});

// ─── PATCH /api/admin/devices/:deviceId/block ─────────────────────────────
router.patch('/devices/:deviceId/block', ...adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { isBlocked: true, blockedReason: reason || 'Admin blocked' },
      { new: true }
    );

    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    await Log.createLog({
      userId: req.user._id, username: req.user.username,
      action: 'DEVICE_BLOCKED', status: 'WARNING',
      deviceId: device.deviceId,
      details: `Device blocked: ${reason || 'No reason given'}`,
    });

    res.json({ success: true, message: 'Device blocked', data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to block device' });
  }
});

// ─── GET /api/admin/system-stats ─────────────────────────────────────────
router.get('/system-stats', ...adminOnly, async (req, res) => {
  try {
    const [
      totalUsers, activeUsers, totalDevices, blockedDevices,
      activeSessions, totalLogs, criticalLogs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Device.countDocuments(),
      Device.countDocuments({ isBlocked: true }),
      Session.countDocuments({ isActive: true }),
      Log.countDocuments(),
      Log.countDocuments({ status: 'CRITICAL' }),
    ]);

    const recentCritical = await Log.find({ status: 'CRITICAL' })
      .sort({ timestamp: -1 })
      .limit(10);

    const actionBreakdown = await Log.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
        devices: { total: totalDevices, blocked: blockedDevices },
        sessions: { active: activeSessions },
        logs: { total: totalLogs, critical: criticalLogs },
        recentCritical,
        actionBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch system stats' });
  }
});

module.exports = router;
