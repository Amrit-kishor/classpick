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

test('API Integration - Faculty Registration and Auth Flow with HTTP-only cookies', async () => {
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
  assert.equal(regData.token, undefined, 'JWT token must not be exposed in JSON body');
  assert.equal(regData.faculty.name, 'Professor Test');

  const regCookie = regRes.headers.get('set-cookie');
  assert.ok(regCookie, 'set-cookie header must be present on register');
  assert.ok(regCookie.includes('token='), 'set-cookie must set token cookie');
  assert.ok(regCookie.toLowerCase().includes('httponly'), 'cookie must be HttpOnly');

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
  assert.equal(loginData.token, undefined, 'JWT token must not be exposed in JSON body');
  assert.equal(loginData.faculty.email, testEmail);

  const loginCookie = loginRes.headers.get('set-cookie');
  assert.ok(loginCookie, 'set-cookie header must be present on login');
  assert.ok(loginCookie.includes('token='));

  // Authenticated route GET /api/auth/me using Cookie
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      Cookie: loginCookie.split(';')[0],
    },
  });
  const meData = await meRes.json();
  assert.equal(meRes.status, 200);
  assert.equal(meData.faculty.email, testEmail);

  // Logout clears the cookie
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Cookie: loginCookie.split(';')[0],
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  assert.equal(logoutRes.status, 200);
  const logoutCookie = logoutRes.headers.get('set-cookie');
  assert.ok(logoutCookie, 'set-cookie header must be present on logout');
  assert.ok(logoutCookie.includes('token=;'));
});
