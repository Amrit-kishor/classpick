import dotenv from 'dotenv';
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

export const validateEnv = (env = process.env) => {
  const nodeEnv = env.NODE_ENV || process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const errors = [];

  // Validate JWT Secret
  const jwtSecret = env.JWT_SECRET;
  if (isProduction) {
    if (!jwtSecret) {
      errors.push('JWT_SECRET environment variable is missing.');
    } else if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production.');
    } else if (
      jwtSecret.includes('super_secret') ||
      jwtSecret.includes('classpick_secret_jwt_key') ||
      jwtSecret.includes('dev_jwt_secret') ||
      jwtSecret === 'change_me' ||
      jwtSecret === 'your_jwt_secret'
    ) {
      errors.push('JWT_SECRET must not use an insecure default or placeholder string in production.');
    }

    // Validate persistent MongoDB URI
    const mongoUri = env.MONGODB_URI;
    if (!mongoUri) {
      errors.push('MONGODB_URI environment variable is required in production. In-memory databases are strictly forbidden in production.');
    } else if (mongoUri.includes('<username>') || mongoUri.includes('<password>')) {
      errors.push('MONGODB_URI must be configured with real credentials, not template placeholders.');
    } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      errors.push('MONGODB_URI must be a valid MongoDB connection string starting with mongodb:// or mongodb+srv://');
    }

    // Validate CLIENT_URL
    const clientUrl = env.CLIENT_URL;
    if (!clientUrl) {
      errors.push('CLIENT_URL environment variable is required in production for CORS origin security.');
    } else if (clientUrl === '*' || clientUrl.includes('*')) {
      errors.push('CLIENT_URL cannot be a wildcard (*) when credentials/cookies are enabled.');
    }
  }

  if (errors.length > 0) {
    const errorMsg = `\n======================================================\n❌ APPLICATION CONFIGURATION ERROR:\n${errors
      .map((e) => `  - ${e}`)
      .join('\n')}\n======================================================\n`;
    throw new Error(errorMsg);
  }
};

export const ENV = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI || '',
  ALLOW_IN_MEMORY_DB: process.env.ALLOW_IN_MEMORY_DB === 'true' || isTest || (!isProduction && !process.env.MONGODB_URI),
  SEED_DEMO_DATA: process.env.SEED_DEMO_DATA === 'true' && !isProduction,
  JWT_SECRET: process.env.JWT_SECRET || (isTest ? 'test_jwt_secret_key_minimum_32_characters_long_for_tests' : (isProduction ? '' : 'dev_jwt_secret_key_minimum_32_characters_long_for_dev')),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5180',
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
  COOKIE_SECURE: process.env.COOKIE_SECURE !== undefined ? process.env.COOKIE_SECURE === 'true' : isProduction,
};
