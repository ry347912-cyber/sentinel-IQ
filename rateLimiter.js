const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      res.status(429).json(options.message);
    },
  });

// General API limiter
const apiLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX) || 100,
  'Too many requests. Please try again later.'
);

// Auth endpoints — tighter limit
const authLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many authentication attempts. Please try again in 15 minutes.'
);

// OTP endpoints — very tight
const otpLimiter = createLimiter(
  5 * 60 * 1000,
  5,
  'Too many OTP requests. Please wait 5 minutes.'
);

module.exports = { apiLimiter, authLimiter, otpLimiter };
