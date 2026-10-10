import jwt from 'jsonwebtoken';
import { Faculty } from '../models/Faculty.js';
import { ENV } from '../config/env.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const faculty = await Faculty.findById(decoded.id);

    if (!faculty) {
      return res.status(401).json({
        success: false,
        message: 'Faculty account no longer exists.',
      });
    }

    req.faculty = faculty;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
};

/**
 * OWASP-compliant CSRF guard for cookie-based state-changing requests.
 * Modern SPA requests from Axios include 'X-Requested-With: XMLHttpRequest',
 * which cross-site HTML forms cannot forge without preflight rejection.
 */
export const verifyCsrf = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // If authenticated via explicit Bearer header, ambient cookie CSRF is not applicable
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return next();
  }

  // If no ambient session cookie is present (e.g. login, register, unauthenticated), CSRF is not applicable
  if (!req.cookies || !req.cookies.token) {
    return next();
  }

  // If using cookies for state-changing operations, require custom application header
  const requestedWith = req.headers['x-requested-with'];
  if (requestedWith === 'XMLHttpRequest') {
    return next();
  }

  // Permit test runner in test mode
  if (ENV.NODE_ENV === 'test') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Security validation failed: Request must include valid application headers.',
  });
};
