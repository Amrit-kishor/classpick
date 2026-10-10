import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV, validateEnv } from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { verifyCsrf } from './middleware/authMiddleware.js';
import { seedInitialData, auditDemoAccounts } from './utils/seedData.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import selectionRoutes from './routes/selectionRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

// Validate environment variables on startup
validateEnv();

const app = express();

// Trust reverse proxy (essential for Render / Vercel rate-limiting & IP resolution)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Determine allowed CORS origins
const parseAllowedOrigins = () => {
  const configured = (ENV.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (ENV.NODE_ENV === 'production') {
    return configured;
  }

  // Development & local testing origins
  return [
    ...configured,
    'http://localhost:5180',
    'http://127.0.0.1:5180',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
  ];
};

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, server-to-server, or same-origin curl)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (ENV.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy violation: Origin ${origin} not permitted.`));
    },
    credentials: true, // Required for secure HTTP-only cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsers & cookie parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CSRF validation for state-changing cookie requests
app.use('/api', verifyCsrf);

// Global API rate limiter
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ClassPick Production API',
    environment: ENV.NODE_ENV,
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

let serverInstance = null;

// Start server if run directly
export const startServer = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
    await auditDemoAccounts();
    await seedInitialData();
  }

  return new Promise((resolve, reject) => {
    serverInstance = app.listen(ENV.PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🎓 ClassPick Backend running in [${ENV.NODE_ENV}] mode`);
      console.log(`📡 URL: http://localhost:${ENV.PORT}`);
      console.log(`🔐 Allowed Client Origin(s): ${allowedOrigins.join(', ')}`);
      console.log(`======================================================\n`);
      resolve(serverInstance);
    });

    serverInstance.on('error', (err) => {
      console.error(`Server listen error: ${err.message}`);
      reject(err);
    });
  });
};

// Graceful shutdown handling
const handleGracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully terminating ClassPick server...`);
  if (serverInstance) {
    await new Promise((res) => serverInstance.close(res));
  }
  await closeDB();
  process.exit(0);
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

if (ENV.NODE_ENV !== 'test' && !process.env.TEST_MODE) {
  startServer().catch((err) => {
    console.error(`Fatal startup failure: ${err.message}`);
    process.exit(1);
  });
}

export default app;
