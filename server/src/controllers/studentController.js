import { Student } from '../models/Student.js';
import { Classroom } from '../models/Classroom.js';
import { SelectionRound } from '../models/SelectionRound.js';
import { parseStudentCSV, generateStudentCSV } from '../utils/csvHelper.js';

// Verify classroom belongs to faculty
const verifyClassroomOwnership = async (classroomId, facultyId) => {
  return await Classroom.findOne({ _id: classroomId, faculty: facultyId });
};

// @desc    Get all students in a classroom (with optional search, filter, pagination)
// @route   GET /api/classrooms/:classroomId/students
export const getStudents = async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const { search, status, page = 1, limit = 50 } = req.query;

    const classroom = await verifyClassroomOwnership(classroomId, req.faculty._id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or unauthorized access.',
      });
    }

    let filter = { classroom: classroomId };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Student.countDocuments(filter);

    const students = await Student.find(filter)
      .sort({ rollNumber: 1, fullName: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add individual student
// @route   POST /api/classrooms/:classroomId/students
export const createStudent = async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const { fullName, rollNumber, profileImage, isActive } = req.body;

    const classroom = await verifyClassroomOwnership(classroomId, req.faculty._id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or unauthorized access.',
      });
    }

    if (!fullName || !rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Student name and roll number are required.',
      });
    }

    const normalizedRoll = rollNumber.trim().toUpperCase();

    // Check duplicate roll number in classroom
    const existing = await Student.findOne({
      classroom: classroomId,
      rollNumber: normalizedRoll,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Student with roll number "${normalizedRoll}" already exists in this classroom.`,
      });
    }

    const student = await Student.create({
      classroom: classroomId,
      faculty: req.faculty._id,
      fullName: fullName.trim(),
      rollNumber: normalizedRoll,
      profileImage: profileImage || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, rollNumber, profileImage, isActive } = req.body;

    const student = await Student.findOne({ _id: id, faculty: req.faculty._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or unauthorized access.',
      });
    }

    if (rollNumber) {
      const normalizedRoll = rollNumber.trim().toUpperCase();
      if (normalizedRoll !== student.rollNumber) {
        const conflict = await Student.findOne({
          classroom: student.classroom,
          rollNumber: normalizedRoll,
          _id: { $ne: student._id },
        });

        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `Roll number "${normalizedRoll}" is already assigned to another student in this classroom.`,
          });
        }
        student.rollNumber = normalizedRoll;
      }
    }

    if (fullName) student.fullName = fullName.trim();
    if (profileImage !== undefined) student.profileImage = profileImage;
    if (isActive !== undefined) student.isActive = Boolean(isActive);

    await student.save();

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findOne({ _id: id, faculty: req.faculty._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or unauthorized access.',
      });
    }

    const classroomId = student.classroom;

    await Student.deleteOne({ _id: id });

    // Clean up student from active SelectionRound if present
    await SelectionRound.updateOne(
      { classroom: classroomId },
      {
        $pull: {
          remainingStudentIds: id,
          selectedStudentIds: id,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Import students from CSV
// @route   POST /api/classrooms/:classroomId/students/import
export const importStudents = async (req, res, next) => {
  try {
    const { classroomId } = req.params;

    const classroom = await verifyClassroomOwnership(classroomId, req.faculty._id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or unauthorized access.',
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid CSV file.',
      });
    }

    const parsedStudents = await parseStudentCSV(req.file.buffer);

    if (parsedStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file contains no valid student rows. Ensure columns: fullName, rollNumber.',
      });
    }

    // Existing roll numbers in this classroom
    const existingStudents = await Student.find(
      { classroom: classroomId },
      { rollNumber: 1 }
    ).lean();
    const existingRolls = new Set(existingStudents.map((s) => s.rollNumber.toUpperCase()));

    const toInsert = [];
    const duplicates = [];
    const seenInFile = new Set();

    for (const record of parsedStudents) {
      const roll = record.rollNumber.toUpperCase();
      if (existingRolls.has(roll) || seenInFile.has(roll)) {
        duplicates.push(roll);
      } else {
        seenInFile.add(roll);
        toInsert.push({
          classroom: classroomId,
          faculty: req.faculty._id,
          fullName: record.fullName,
          rollNumber: roll,
          isActive: record.isActive,
        });
      }
    }

    if (toInsert.length > 0) {
      await Student.insertMany(toInsert);
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${toInsert.length} students.${
        duplicates.length > 0 ? ` Skipped ${duplicates.length} duplicate roll number(s).` : ''
      }`,
      importedCount: toInsert.length,
      skippedDuplicates: duplicates,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export students to CSV
// @route   GET /api/classrooms/:classroomId/students/export
export const exportStudents = async (req, res, next) => {
  try {
    const { classroomId } = req.params;

    const classroom = await verifyClassroomOwnership(classroomId, req.faculty._id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or unauthorized access.',
      });
    }

    const students = await Student.find({ classroom: classroomId })
      .sort({ rollNumber: 1 })
      .lean();

    const csvData = await generateStudentCSV(students);

    const safeFilename = `${classroom.name.replace(/[^a-zA-Z0-9]/g, '_')}_students.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};
