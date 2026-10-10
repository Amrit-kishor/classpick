import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { seedInitialData } from './utils/seedData.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import selectionRoutes from './routes/selectionRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration with credentials support
const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5180',
  'http://127.0.0.1:5180',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || ENV.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy violation'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsers & cookie parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply global rate limiter to all API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ClassPick Production API',
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api', studentRoutes);
app.use('/api', selectionRoutes);
app.use('/api/stats', statsRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on path: ${req.originalUrl}`,
  });
});

// Centralized Error Handling
app.use(errorHandler);

// Start server if run directly
export const startServer = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
    await seedInitialData();
  }

  return app.listen(ENV.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🎓 ClassPick Backend running in [${ENV.NODE_ENV}] mode`);
    console.log(`📡 URL: http://localhost:${ENV.PORT}`);
    console.log(`🔐 Allowed Client: ${ENV.CLIENT_URL}`);
    console.log(`======================================================\n`);
  });
};

if (process.env.NODE_ENV !== 'test' && (!process.env.TEST_MODE)) {
  startServer();
}

export default app;
