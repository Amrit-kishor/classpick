import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/server.js';
import { Faculty } from '../src/models/Faculty.js';
import { Classroom } from '../src/models/Classroom.js';
import { Student } from '../src/models/Student.js';
import { SelectionRound } from '../src/models/SelectionRound.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../src/config/env.js';

let mongod;
let serverInstance;
let baseUrl;
let facultyDoc;
let classroomDoc;
let studentDocs = [];
let authToken;

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

  // Seed test faculty
  facultyDoc = await Faculty.create({
    name: 'Dr. Concurrency Tester',
    email: `concurrency_${Date.now()}@college.edu`,
    password: 'Password123!',
    department: 'Computer Science',
  });

  authToken = jwt.sign({ id: facultyDoc._id }, ENV.JWT_SECRET, { expiresIn: '1h' });

  // Seed test classroom
  classroomDoc = await Classroom.create({
    name: 'CS401 Distributed Systems',
    subject: 'Concurrency & Transactions',
    department: 'Computer Science',
    section: 'A',
    faculty: facultyDoc._id,
    academicYear: '2026-2027',
  });

  // Seed 5 active students
  const studentNames = ['Student Alpha', 'Student Beta', 'Student Gamma', 'Student Delta', 'Student Epsilon'];
  for (let i = 0; i < studentNames.length; i++) {
    const s = await Student.create({
      fullName: studentNames[i],
      rollNumber: `CS26-00${i + 1}`,
      email: `student_${i + 1}@college.edu`,
      classroom: classroomDoc._id,
      faculty: facultyDoc._id,
      isActive: true,
    });
    studentDocs.push(s);
  }
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

test('Fair Round Concurrency - simultaneous requests cannot select the same student', async () => {
  const classroomId = classroomDoc._id.toString();

  // Issue 5 simultaneous selection requests in parallel using Promise.all
  const drawRequests = Array.from({ length: 5 }, () =>
    fetch(`${baseUrl}/api/classrooms/${classroomId}/selection/draw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ mode: 'fair_round' }),
    })
  );

  const responses = await Promise.all(drawRequests);
  const results = await Promise.all(responses.map((r) => r.json()));

  // All 5 requests must succeed
  responses.forEach((res, index) => {
    assert.equal(res.status, 200, `Request ${index} failed: ${JSON.stringify(results[index])}`);
    assert.equal(results[index].success, true);
    assert.ok(results[index].selectedStudent);
  });

  // Extract selected student IDs
  const selectedIds = results.map((r) => r.selectedStudent.id);

  // CRITICAL CONCURRENCY INVARIANT:
  // Each student must be picked exactly once. Zero duplicate selections across simultaneous requests.
  const uniqueSelectedIds = new Set(selectedIds);
  assert.equal(
    uniqueSelectedIds.size,
    5,
    `Duplicate student selection detected under concurrent requests! Unique count: ${uniqueSelectedIds.size}, expected: 5. Picked IDs: ${JSON.stringify(selectedIds)}`
  );

  // Ensure all 5 seeded students were selected
  studentDocs.forEach((s) => {
    assert.ok(uniqueSelectedIds.has(s._id.toString()), `Student ${s.fullName} was not selected`);
  });

  // Verify round state in DB: round must be completed
  const round = await SelectionRound.findOne({ classroom: classroomId });
  assert.ok(round);
  assert.equal(round.remainingStudentIds.length, 0);
  assert.equal(round.selectedStudentIds.length, 5);
  assert.equal(round.isCompleted, true);

  // Subsequent request must fail with round completed status (400)
  const exhaustedRes = await fetch(`${baseUrl}/api/classrooms/${classroomId}/selection/draw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ mode: 'fair_round' }),
  });
  const exhaustedData = await exhaustedRes.json();
  assert.equal(exhaustedRes.status, 400);
  assert.equal(exhaustedData.isRoundCompleted, true);

  // Reset round and verify fresh pool is initialized
  const resetRes = await fetch(`${baseUrl}/api/classrooms/${classroomId}/selection/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });
  const resetData = await resetRes.json();
  assert.equal(resetRes.status, 200);
  assert.equal(resetData.round.roundNumber, 2);
  assert.equal(resetData.round.remainingCount, 5);
  assert.equal(resetData.round.selectedCount, 0);
});

test('Fair Round Concurrency - excess concurrent requests handle exhaustion cleanly', async () => {
  const classroomId = classroomDoc._id.toString();

  // Pick 3 students sequentially, leaving only 2 in the pool of 5
  await fetch(`${baseUrl}/api/classrooms/${classroomId}/selection/draw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ mode: 'fair_round' }),
  });
  await fetch(`${baseUrl}/api/classrooms/${classroomId}/selection/draw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ mode: 'fair_round' }),
  });
  await fetch(`${baseUrl}/api/classrooms/${classroomId}/selection/draw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ mode: 'fair_round' }),
  });

  // Now 2 students remain. Fire 6 concurrent requests!
  const requests = Array.from({ length: 6 }, () =>
    fetch(`${baseUrl}/api/classrooms/${classroomId}/selection/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ mode: 'fair_round' }),
    })
  );

  const responses = await Promise.all(requests);
  const data = await Promise.all(responses.map((r) => r.json()));

  const successResponses = data.filter((d) => d.success);
  const exhaustedResponses = data.filter((d) => !d.success && d.isRoundCompleted);

  // Exactly 2 must succeed, and the remaining 4 must return round completed
  assert.equal(successResponses.length, 2, 'Exactly 2 remaining students should be claimed');
  assert.equal(exhaustedResponses.length, 4, '4 excess concurrent requests must receive round completed');

  // Verify the 2 claimed students are distinct
  const claimedIds = successResponses.map((r) => r.selectedStudent.id);
  assert.equal(new Set(claimedIds).size, 2, 'Claimed students must be unique');
});

test('Multi-Tenant Concurrency - parallel draws across separate faculty classrooms do not interfere', async () => {
  // Create Faculty B and Classroom B
  const facultyB = await Faculty.create({
    name: 'Dr. Concurrency B',
    email: `concurrency_b_${Date.now()}@college.edu`,
    password: 'Password123!',
    department: 'Physics',
  });
  const tokenB = jwt.sign({ id: facultyB._id }, ENV.JWT_SECRET, { expiresIn: '1h' });

  const classroomB = await Classroom.create({
    name: 'PHY201 Quantum Mechanics',
    subject: 'Physics',
    department: 'Physics',
    section: 'B',
    faculty: facultyB._id,
    academicYear: '2026-2027',
  });

  const studentsB = [];
  for (let i = 0; i < 3; i++) {
    const s = await Student.create({
      fullName: `Physics Student ${i + 1}`,
      rollNumber: `PHY26-00${i + 1}`,
      classroom: classroomB._id,
      faculty: facultyB._id,
      isActive: true,
    });
    studentsB.push(s);
  }

  // Reset Classroom A for clean test
  await fetch(`${baseUrl}/api/classrooms/${classroomDoc._id}/selection/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
  });

  // Launch simultaneous draws on Classroom A and Classroom B
  const [resA, resB] = await Promise.all([
    fetch(`${baseUrl}/api/classrooms/${classroomDoc._id}/selection/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ mode: 'fair_round' }),
    }),
    fetch(`${baseUrl}/api/classrooms/${classroomB._id}/selection/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ mode: 'fair_round' }),
    }),
  ]);

  const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);

  assert.equal(resA.status, 200);
  assert.equal(resB.status, 200);

  // Classroom A picked from Classroom A's students, not B's
  const validIdsA = studentDocs.map((s) => s._id.toString());
  const validIdsB = studentsB.map((s) => s._id.toString());

  assert.ok(validIdsA.includes(dataA.selectedStudent.id));
  assert.ok(validIdsB.includes(dataB.selectedStudent.id));
  assert.notEqual(dataA.selectedStudent.id, dataB.selectedStudent.id);
});
