import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/server.js';

let mongod;
let serverInstance;
let baseUrl;

before(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }

  await new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
      const port = serverInstance.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (serverInstance) {
    serverInstance.close();
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
});

test('API Integration - Health check returns healthy', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.status, 'healthy');
});

test('API Integration - Faculty Registration and Auth Flow', async () => {
  const testEmail = `prof.test_${Date.now()}@college.edu`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Professor Test',
      email: testEmail,
      password: 'password123',
      department: 'Electrical Engineering',
    }),
  });

  const regData = await regRes.json();
  assert.equal(regRes.status, 201);
  assert.ok(regData.token);
  assert.equal(regData.faculty.name, 'Professor Test');

  // Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
    }),
  });

  const loginData = await loginRes.json();
  assert.equal(loginRes.status, 200);
  assert.ok(loginData.token);

  // Authenticated route GET /api/auth/me
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const meData = await meRes.json();
  assert.equal(meRes.status, 200);
  assert.equal(meData.faculty.email, testEmail);
});
