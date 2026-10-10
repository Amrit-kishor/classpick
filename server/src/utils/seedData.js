import { Faculty } from '../models/Faculty.js';
import { Classroom } from '../models/Classroom.js';
import { Student } from '../models/Student.js';

export const seedInitialData = async () => {
  try {
    const facultyCount = await Faculty.countDocuments();
    if (facultyCount > 0) {
      return; // Already initialized
    }

    console.log('🌱 Seeding sample faculty and classroom for demonstration...');

    // 1. Create demo faculty
    const demoFaculty = await Faculty.create({
      name: 'Dr. Alok Sharma',
      email: 'dr.sharma@college.edu',
      password: 'faculty1234',
      department: 'Computer Science & Engineering',
      designation: 'Associate Professor',
    });

    // 2. Create demo classroom
    const demoClassroom = await Classroom.create({
      name: 'Data Structures & Algorithms - Sec A',
      department: 'Computer Science & Engineering',
      academicYear: '2025-2026',
      section: 'A',
      subject: 'CS301 - Data Structures & Algorithms',
      faculty: demoFaculty._id,
      lastAccessedAt: new Date(),
    });

    const secondClassroom = await Classroom.create({
      name: 'Database Systems - Sec B',
      department: 'Computer Science & Engineering',
      academicYear: '2025-2026',
      section: 'B',
      subject: 'CS304 - Database Management Systems',
      faculty: demoFaculty._id,
      lastAccessedAt: new Date(Date.now() - 3600000),
    });

    // 3. Create demo students in DSA classroom
    const initialStudents = [
      { fullName: 'Aarav Sharma', rollNumber: 'CS2026-001' },
      { fullName: 'Aditi Patel', rollNumber: 'CS2026-002' },
      { fullName: 'Ananya Iyer', rollNumber: 'CS2026-003' },
      { fullName: 'Devansh Verma', rollNumber: 'CS2026-004' },
      { fullName: 'Ishaan Nair', rollNumber: 'CS2026-005' },
      { fullName: 'Kavya Deshmukh', rollNumber: 'CS2026-006' },
      { fullName: 'Manish Kumar', rollNumber: 'CS2026-007' },
      { fullName: 'Meera Pillai', rollNumber: 'CS2026-008' },
      { fullName: 'Nikhil Rao', rollNumber: 'CS2026-009' },
      { fullName: 'Pooja Gupta', rollNumber: 'CS2026-010' },
      { fullName: 'Pranav Joshi', rollNumber: 'CS2026-011' },
      { fullName: 'Rohan Mehta', rollNumber: 'CS2026-012' },
      { fullName: 'Sanya Malhotra', rollNumber: 'CS2026-013' },
      { fullName: 'Siddharth Sen', rollNumber: 'CS2026-014' },
      { fullName: 'Sneha Kulkarni', rollNumber: 'CS2026-015' },
      { fullName: 'Tanvi Reddy', rollNumber: 'CS2026-016' },
      { fullName: 'Varun Nambiar', rollNumber: 'CS2026-017' },
      { fullName: 'Vidya Venkatesh', rollNumber: 'CS2026-018' },
      { fullName: 'Yash Chopra', rollNumber: 'CS2026-019' },
      { fullName: 'Zoya Khan', rollNumber: 'CS2026-020' },
    ];

    const studentDocs = initialStudents.map((s) => ({
      classroom: demoClassroom._id,
      faculty: demoFaculty._id,
      fullName: s.fullName,
      rollNumber: s.rollNumber,
      isActive: true,
    }));

    await Student.insertMany(studentDocs);

    // Also add a couple students to second classroom
    await Student.insertMany([
      { classroom: secondClassroom._id, faculty: demoFaculty._id, fullName: 'Arjun Das', rollNumber: 'CS-B01', isActive: true },
      { classroom: secondClassroom._id, faculty: demoFaculty._id, fullName: 'Bhavna Bose', rollNumber: 'CS-B02', isActive: true },
      { classroom: secondClassroom._id, faculty: demoFaculty._id, fullName: 'Chirag Seth', rollNumber: 'CS-B03', isActive: true },
    ]);

    console.log('✅ Demo data seeded successfully:');
    console.log('   Faculty Email: dr.sharma@college.edu');
    console.log('   Password:      faculty1234');
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
};
