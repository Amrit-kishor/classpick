import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/server.js';
import { Faculty } from '../src/models/Faculty.js';
import { Classroom } from '../src/models/Classroom.js';
import { Student } from '../src/models/Student.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../src/config/env.js';
import { seedDemoData } from '../src/utils/seedData.js';

let mongod;
let serverInstance;
let baseUrl;
let facultyA;
let facultyB;
let tokenA;
let tokenB;
let classroomA;

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

  facultyA = await Faculty.create({
    name: 'Professor Alice',
    email: `alice_${Date.now()}@college.edu`,
    password: 'Password123!',
    department: 'Computer Science',
  });
  tokenA = jwt.sign({ id: facultyA._id }, ENV.JWT_SECRET, { expiresIn: '1h' });

  facultyB = await Faculty.create({
    name: 'Professor Bob',
    email: `bob_${Date.now()}@college.edu`,
    password: 'Password123!',
    department: 'Physics',
  });
  tokenB = jwt.sign({ id: facultyB._id }, ENV.JWT_SECRET, { expiresIn: '1h' });

  classroomA = await Classroom.create({
    name: 'Alice Classroom',
    subject: 'Algorithms',
    department: 'Computer Science',
    section: 'A',
    faculty: facultyA._id,
    academicYear: '2026-2027',
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

test('Security - Faculty B cannot access Faculty A classroom', async () => {
  const res = await fetch(`${baseUrl}/api/classrooms/${classroomA._id}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('Security - Faculty B cannot add student to Faculty A classroom', async () => {
  const res = await fetch(`${baseUrl}/api/classrooms/${classroomA._id}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      fullName: 'Eve Hacker',
      rollNumber: 'HACK-01',
    }),
  });
  assert.equal(res.status, 404);
});

test('Security - Invalid ObjectId returns 400 Bad Request, not 500', async () => {
  const res = await fetch(`${baseUrl}/api/classrooms/not-a-valid-object-id`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.message.toLowerCase().includes('invalid') && data.message.toLowerCase().includes('identifier'));
});

test('Security - Demo Seeding is strictly prevented during production startup', async () => {
  const originalEnv = ENV.NODE_ENV;
  ENV.NODE_ENV = 'production';

  const countBefore = await Faculty.countDocuments();
  await seedDemoData(false); // Normal startup invocation
  const countAfter = await Faculty.countDocuments();

  assert.equal(countBefore, countAfter, 'No accounts should be created by normal startup in production');
  const demoAccount = await Faculty.findOne({ email: 'dr.sharma@college.edu' });
  assert.equal(demoAccount, null, 'dr.sharma@college.edu must not be created during production startup');

  ENV.NODE_ENV = originalEnv;
});

test('Security - Rejects missing, malformed, or expired tokens with 401', async () => {
  // 1. Missing token
  const noTokenRes = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(noTokenRes.status, 401);

  // 2. Malformed token
  const malformedRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: 'Bearer this-is-not-a-valid-jwt-token' },
  });
  assert.equal(malformedRes.status, 401);

  // 3. Expired token
  const expiredToken = jwt.sign({ id: facultyA._id }, ENV.JWT_SECRET, { expiresIn: '1ms' });
  await new Promise((r) => setTimeout(r, 10)); // wait for expiry
  const expiredRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert.equal(expiredRes.status, 401);
});

test('Security - CSRF header is strictly enforced for cookie requests in production', async () => {
  const originalEnv = ENV.NODE_ENV;
  ENV.NODE_ENV = 'production';

  // Request with Cookie auth but WITHOUT X-Requested-With header
  const csrfBlockedRes = await fetch(`${baseUrl}/api/classrooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `token=${tokenA}`,
    },
    body: JSON.stringify({
      name: 'CSRF Attack Classroom',
      subject: 'Security',
      department: 'CS',
      section: 'A',
    }),
  });

  assert.equal(csrfBlockedRes.status, 403, 'Cookie mutating request without X-Requested-With must be rejected with 403');

  // Request WITH X-Requested-With header succeeds
  const csrfAllowedRes = await fetch(`${baseUrl}/api/classrooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `token=${tokenA}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      name: 'Legitimate Classroom',
      subject: 'Security',
      department: 'CS',
      section: 'A',
      academicYear: '2026-2027',
    }),
  });

  assert.equal(csrfAllowedRes.status, 201, 'Request with valid CSRF header must succeed');

  ENV.NODE_ENV = originalEnv;
});
