import jwt from 'jsonwebtoken';
import { Faculty } from '../models/Faculty.js';
import { ENV } from '../config/env.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check cookie first
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
