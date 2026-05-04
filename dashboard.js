const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Device = require('../models/Device');
const Session = require('../models/Session');
const Log = require('../models/Log');
const { authenticate, authorize } = require('../middleware/auth');

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? undefined : req.user._id;
    const query = userId ? { userId } : {};

    const [totalLogs, successLogs, failureLogs, criticalLogs, activeSessions] = await Promise.all([
      Log.countDocuments(query),
      Log.countDocuments({ ...query, status: 'SUCCESS' }),
      Log.countDocuments({ ...query, status: 'FAILURE' }),
      Log.countDocuments({ ...query, status: 'CRITICAL' }),
      Session.countDocuments({ ...(userId ? { userId } : {}), isActive: true }),
    ]);

    const recentAlerts = await Log.find({ ...query, status: { $in: ['CRITICAL', 'WARNING'] } })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('action status details ipAddress timestamp username');

    // Activity over last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activityData = await Log.aggregate([
      { $match: { ...query, timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
          failures: { $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalEvents: totalLogs,
        successRate: totalLogs ? Math.round((successLogs / totalLogs) * 100) : 0,
        failureCount: failureLogs,
        criticalAlerts: criticalLogs,
        activeSessions,
        recentAlerts,
        activityChart: activityData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ─── GET /api/dashboard/logs ──────────────────────────────────────────────
router.get('/logs', authenticate, async (req, res) => {
  try {
    const {
      page = 1, limit = 20, status, action,
      startDate, endDate, search,
    } = req.query;

    const query = req.user.role !== 'admin' ? { userId: req.user._id } : {};

    if (status) query.status = status;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Log.countDocuments(query);
    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'username email role');

    res.json({
      success: true,
      data: { logs, total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

// ─── GET /api/dashboard/devices ───────────────────────────────────────────
router.get('/devices', authenticate, async (req, res) => {
  try {
    const query = req.user.role !== 'admin' ? { userId: req.user._id } : {};
    const devices = await Device.find(query)
      .sort({ lastSeen: -1 })
      .populate('userId', 'username email');

    res.json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch devices' });
  }
});

// ─── GET /api/dashboard/sessions ──────────────────────────────────────────
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const query = req.user.role !== 'admin'
      ? { userId: req.user._id, isActive: true }
      : { isActive: true };

    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'username email role');

    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
});

module.exports = router;
