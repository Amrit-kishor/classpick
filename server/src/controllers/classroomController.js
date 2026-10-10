import { Classroom } from '../models/Classroom.js';
import { Student } from '../models/Student.js';
import { SelectionRound } from '../models/SelectionRound.js';
import { SelectionHistory } from '../models/SelectionHistory.js';

// @desc    Get all classrooms belonging to logged-in faculty
// @route   GET /api/classrooms
export const getClassrooms = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = { faculty: req.faculty._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } },
      ];
    }

    const classrooms = await Classroom.find(query)
      .sort({ lastAccessedAt: -1, updatedAt: -1 })
      .lean();

    // Attach student count
    const classroomIds = classrooms.map((c) => c._id);
    const counts = await Student.aggregate([
      { $match: { classroom: { $in: classroomIds } } },
      { $group: { _id: '$classroom', count: { $sum: 1 }, activeCount: { $sum: { $cond: ['$isActive', 1, 0] } } } },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = {
        total: c.count,
        active: c.activeCount,
      };
    });

    const enrichedClassrooms = classrooms.map((cls) => ({
      ...cls,
      studentCount: countMap[cls._id.toString()]?.total || 0,
      activeStudentCount: countMap[cls._id.toString()]?.active || 0,
    }));

    res.status(200).json({
      success: true,
      count: enrichedClassrooms.length,
      data: enrichedClassrooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single classroom by ID
// @route   GET /api/classrooms/:id
export const getClassroomById = async (req, res, next) => {
  try {
    const classroom = await Classroom.findOne({
      _id: req.params.id,
      faculty: req.faculty._id,
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or unauthorized access.',
      });
    }

    // Update last accessed time
    classroom.lastAccessedAt = new Date();
    await classroom.save();

    const studentCount = await Student.countDocuments({ classroom: classroom._id });
    const activeStudentCount = await Student.countDocuments({
      classroom: classroom._id,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        ...classroom.toObject(),
        studentCount,
        activeStudentCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new classroom
// @route   POST /api/classrooms
export const createClassroom = async (req, res, next) => {
  try {
    const { name, department, academicYear, section, subject } = req.body;

    if (!name || !department || !academicYear || !section || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classroom name, department, academic year, section, and subject.',
      });
    }

    const classroom = await Classroom.create({
      name,
      department,
      academicYear,
      section,
      subject,
      faculty: req.faculty._id,
    });

    res.status(201).json({
      success: true,
      data: classroom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update classroom
// @route   PUT /api/classrooms/:id
export const updateClassroom = async (req, res, next) => {
  try {
    const { name, department, academicYear, section, subject } = req.body;

    let classroom = await Classroom.findOne({
      _id: req.params.id,
      faculty: req.faculty._id,
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or unauthorized access.',
      });
    }

    classroom.name = name ?? classroom.name;
    classroom.department = department ?? classroom.department;
    classroom.academicYear = academicYear ?? classroom.academicYear;
    classroom.section = section ?? classroom.section;
    classroom.subject = subject ?? classroom.subject;

    await classroom.save();

    res.status(200).json({
      success: true,
      data: classroom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete classroom and its associated students/rounds/history
// @route   DELETE /api/classrooms/:id
export const deleteClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findOne({
      _id: req.params.id,
      faculty: req.faculty._id,
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or unauthorized access.',
      });
    }

    // Cascade delete students, round tracker, and selection history
    await Promise.all([
      Student.deleteMany({ classroom: classroom._id }),
      SelectionRound.deleteOne({ classroom: classroom._id }),
      SelectionHistory.deleteMany({ classroom: classroom._id }),
      Classroom.deleteOne({ _id: classroom._id }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Classroom and all associated student rosters removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
