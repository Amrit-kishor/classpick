import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from '../src/config/env.js';

test('Env Validation - Fails in production if JWT_SECRET is missing or insecure default', () => {
  const insecureSecrets = [
    '',
    undefined,
    'dev_jwt_secret_key_change_in_production_123456789',
    'secret',
    'short_secret_123',
  ];

  for (const secret of insecureSecrets) {
    const mockEnv = {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://admin:pass@cluster.mongodb.net/classpick?retryWrites=true&w=majority',
      JWT_SECRET: secret,
      CLIENT_URL: 'https://classpick.vercel.app',
    };

    assert.throws(
      () => validateEnv(mockEnv),
      /(JWT_SECRET environment variable is missing|JWT_SECRET must be at least 32 characters|JWT_SECRET must not use an insecure)/i,
      `Expected validateEnv to throw for insecure JWT_SECRET: ${secret}`
    );
  }
});

test('Env Validation - Fails in production if MONGODB_URI is missing or contains placeholder', () => {
  const invalidUris = [
    '',
    undefined,
    'mongodb+srv://<username>:<password>@cluster.mongodb.net/test',
  ];

  for (const uri of invalidUris) {
    const mockEnv = {
      NODE_ENV: 'production',
      MONGODB_URI: uri,
      JWT_SECRET: 'a_very_strong_production_secret_key_that_is_at_least_32_chars_long',
      CLIENT_URL: 'https://classpick.vercel.app',
    };

    assert.throws(
      () => validateEnv(mockEnv),
      /(MONGODB_URI environment variable is required|MONGODB_URI must be configured with real credentials)/i,
      `Expected validateEnv to throw for invalid MONGODB_URI: ${uri}`
    );
  }
});

test('Env Validation - Fails in production if CLIENT_URL is wildcard or missing', () => {
  const invalidUrls = ['*', '', undefined];

  for (const url of invalidUrls) {
    const mockEnv = {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://admin:pass@cluster.mongodb.net/classpick',
      JWT_SECRET: 'a_very_strong_production_secret_key_that_is_at_least_32_chars_long',
      CLIENT_URL: url,
    };

    assert.throws(
      () => validateEnv(mockEnv),
      /(CLIENT_URL environment variable is required|CLIENT_URL cannot be a wildcard)/i,
      `Expected validateEnv to throw for invalid CLIENT_URL: ${url}`
    );
  }
});

test('Env Validation - Succeeds in production with complete, secure configuration', () => {
  const validEnv = {
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://admin:pass@cluster.mongodb.net/classpick?retryWrites=true&w=majority',
    JWT_SECRET: 'a_super_strong_production_secret_key_exceeding_32_characters_strictly',
    CLIENT_URL: 'https://classpick.vercel.app',
  };

  assert.doesNotThrow(() => validateEnv(validEnv));
});

test('Env Validation - Allows development environment with safe defaults', () => {
  const devEnv = {
    NODE_ENV: 'development',
  };

  assert.doesNotThrow(() => validateEnv(devEnv));
});
