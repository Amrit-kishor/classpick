import { Classroom } from '../models/Classroom.js';
import { Student } from '../models/Student.js';
import { SelectionHistory } from '../models/SelectionHistory.js';

// @desc    Get dashboard metrics, recently accessed classrooms, and recent selection activity
// @route   GET /api/stats/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const facultyId = req.faculty._id;

    // Concurrently fetch counts
    const [totalClassrooms, totalStudents, totalSelections] = await Promise.all([
      Classroom.countDocuments({ faculty: facultyId }),
      Student.countDocuments({ faculty: facultyId }),
      SelectionHistory.countDocuments({ faculty: facultyId }),
    ]);

    // Recently accessed classrooms (up to 4)
    const recentClassrooms = await Classroom.find({ faculty: facultyId })
      .sort({ lastAccessedAt: -1 })
      .limit(4)
      .lean();

    // Attach student counts for these recent classrooms
    const recentIds = recentClassrooms.map((c) => c._id);
    const counts = await Student.aggregate([
      { $match: { classroom: { $in: recentIds } } },
      { $group: { _id: '$classroom', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = { total: c.count, active: c.active };
    });

    const enrichedRecentClassrooms = recentClassrooms.map((c) => ({
      ...c,
      studentCount: countMap[c._id.toString()]?.total || 0,
      activeStudentCount: countMap[c._id.toString()]?.active || 0,
    }));

    // Recent selection activity (up to 6)
    const recentSelections = await SelectionHistory.find({ faculty: facultyId })
      .populate('classroom', 'name subject section')
      .populate('student', 'fullName rollNumber profileImage')
      .sort({ selectedAt: -1 })
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalClassrooms,
        totalStudents,
        totalSelections,
      },
      recentClassrooms: enrichedRecentClassrooms,
      recentSelections,
    });
  } catch (error) {
    next(error);
  }
};
