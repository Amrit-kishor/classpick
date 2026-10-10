import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  const statusCode = error.statusCode || err.status || 500;

  // Log error safely without leaking sensitive information (passwords, tokens, or connection strings)
  const errCodeStr = err.code !== undefined ? ` [Code: ${err.code}]` : '';
  const errNameStr = err.name ? ` [${err.name}]` : '';
  const safeMessage = (err.message || 'Unknown error').replace(
    /mongodb(\+srv)?:\/\/[^@\s]+@/gi,
    'mongodb$1://<credentials-hidden>@'
  );
  console.error(`[API Error] ${req.method} ${req.url}:${errNameStr}${errCodeStr}`, safeMessage);

  // Mongoose duplicate key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `A record with this ${field} already exists.`;
    return res.status(400).json({
      success: false,
      message,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    return res.status(400).json({
      success: false,
      message,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid resource identifier: ${err.value}`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
    });
  }

  // In production, avoid leaking internal exception details for 500 errors
  const clientMessage = (statusCode === 500 && ENV.NODE_ENV === 'production')
    ? 'Internal Server Error. Please try again later.'
    : (error.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
  });
};
