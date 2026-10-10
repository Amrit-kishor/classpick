import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for student drawing to prevent rapid abusive double-clicks
export const drawLimiter = rateLimit({
  windowMs: 2 * 1000, // 2 seconds
  max: 3,
  message: {
    success: false,
    message: 'Draw request in progress. Please wait for the current selection.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
