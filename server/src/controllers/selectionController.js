import { Classroom } from '../models/Classroom.js';
import { Student } from '../models/Student.js';
import { SelectionRound } from '../models/SelectionRound.js';
import { SelectionHistory } from '../models/SelectionHistory.js';
import { pickRandomItem, shuffleArray } from '../utils/randomPicker.js';

// Verify classroom belongs to faculty
const verifyClassroom = async (classroomId, facultyId) => {
  return await Classroom.findOne({ _id: classroomId, faculty: facultyId });
};

// @desc    Get current round status / state for classroom
// @route   GET /api/classrooms/:classroomId/selection/status
export const getSelectionStatus = async (req, res, next) => {
  try {
    const { classroomId } = req.params;

    const classroom = await verifyClassroom(classroomId, req.faculty._id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or unauthorized access.',
      });
    }

    const activeStudents = await Student.find({
      classroom: classroomId,
      isActive: true,
    }).lean();

    let round = await SelectionRound.findOne({ classroom: classroomId }).populate(
      'lastSelectedStudent'
    );

    // If no round initialized yet, initialize round 1
    if (!round) {
      const activeIds = activeStudents.map((s) => s._id);
      const shuffledIds = shuffleArray(activeIds);

      round = await SelectionRound.create({
        classroom: classroomId,
        faculty: req.faculty._id,
        roundNumber: 1,
        totalEligible: activeStudents.length,
        remainingStudentIds: shuffledIds,
        selectedStudentIds: [],
        lastSelectedStudent: null,
        isCompleted: false,
      });
    }

    res.status(200).json({
      success: true,
      classroom: {
        id: classroom._id,
        name: classroom.name,
        subject: classroom.subject,
        department: classroom.department,
        section: classroom.section,
        academicYear: classroom.academicYear,
      },
      totalActiveStudents: activeStudents.length,
      round: {
        roundNumber: round.roundNumber,
        totalEligible: round.totalEligible,
        remainingCount: round.remainingStudentIds.length,
        selectedCount: round.selectedStudentIds.length,
        isCompleted: round.isCompleted,
        lastSelectedStudent: round.lastSelectedStudent,
      },
      students: activeStudents.map((s) => ({
        id: s._id,
        fullName: s.fullName,
        rollNumber: s.rollNumber,
        profileImage: s.profileImage,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Draw/select a student (Random Mode or Fair Round Mode)
// @route   POST /api/classrooms/:classroomId/selection/draw
export const drawStudent = async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const { mode = 'random' } = req.body; // 'random' | 'fair_round'

    const classroom = await verifyClassroom(classroomId, req.faculty._id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or unauthorized access.',
      });
    }

    // Only active students can be picked
    const activeStudents = await Student.find({
      classroom: classroomId,
      isActive: true,
    });

    if (activeStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active students available in this classroom. Please add or activate students.',
      });
    }

    let selectedStudentDoc = null;
    let roundNumber = 1;
    let roundInfo = null;

    if (mode === 'random') {
      // UNBIASED RANDOM MODE:
      // Independent probability for every active student. Can be picked again.
      selectedStudentDoc = pickRandomItem(activeStudents);

      // Get or maintain existing round doc for context
      const currentRound = await SelectionRound.findOne({ classroom: classroomId });
      if (currentRound) {
        roundNumber = currentRound.roundNumber;
      }
    } else if (mode === 'fair_round') {
      // FAIR ROUND MODE:
      // Without replacement within current round until all students picked.
      let round = await SelectionRound.findOne({ classroom: classroomId });

      if (!round) {
        const activeIds = activeStudents.map((s) => s._id);
        const shuffled = shuffleArray(activeIds);
        round = await SelectionRound.create({
          classroom: classroomId,
          faculty: req.faculty._id,
          roundNumber: 1,
          totalEligible: activeStudents.length,
          remainingStudentIds: shuffled,
          selectedStudentIds: [],
          lastSelectedStudent: null,
          isCompleted: false,
        });
      }

      // Check if all students in round have already been selected
      if (round.remainingStudentIds.length === 0 || round.isCompleted) {
        return res.status(400).json({
          success: false,
          isRoundCompleted: true,
          message: 'All students have been selected in this round! Please reset or start a fresh round.',
          roundNumber: round.roundNumber,
        });
      }

      // Pick the next student from shuffled remaining list
      const chosenStudentId = round.remainingStudentIds[0];
      selectedStudentDoc = activeStudents.find(
        (s) => s._id.toString() === chosenStudentId.toString()
      );

      // If student was deleted or deactivated since round began, filter and retry
      if (!selectedStudentDoc) {
        round.remainingStudentIds = round.remainingStudentIds.filter(
          (id) => id.toString() !== chosenStudentId.toString()
        );
        await round.save();
        return res.status(409).json({
          success: false,
          message: 'Roster changed during round. Please retry selection.',
        });
      }

      // Update round state atomically
      round.remainingStudentIds.shift();
      round.selectedStudentIds.push(selectedStudentDoc._id);
      round.lastSelectedStudent = selectedStudentDoc._id;
      if (round.remainingStudentIds.length === 0) {
        round.isCompleted = true;
      }

      await round.save();

      roundNumber = round.roundNumber;
      roundInfo = {
        roundNumber: round.roundNumber,
        totalEligible: round.totalEligible,
        remainingCount: round.remainingStudentIds.length,
        selectedCount: round.selectedStudentIds.length,
        isCompleted: round.isCompleted,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid selection mode. Choose "random" or "fair_round".',
      });
    }

    // Persist to SelectionHistory
    const historyEntry = await SelectionHistory.create({
      classroom: classroomId,
      faculty: req.faculty._id,
      student: selectedStudentDoc._id,
      studentName: selectedStudentDoc.fullName,
      studentRollNumber: selectedStudentDoc.rollNumber,
      classroomName: classroom.name,
      mode,
      roundNumber,
      selectedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      selectedStudent: {
        id: selectedStudentDoc._id,
        fullName: selectedStudentDoc.fullName,
        rollNumber: selectedStudentDoc.rollNumber,
        profileImage: selectedStudentDoc.profileImage,
        classroomName: classroom.name,
        subject: classroom.subject,
      },
      mode,
      roundNumber,
      roundInfo,
      historyId: historyEntry._id,
      selectedAt: historyEntry.selectedAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset round / Start fresh round for Fair Round Mode
// @route   POST /api/classrooms/:classroomId/selection/reset-round
export const resetRound = async (req, res, next) => {
  try {
    const { classroomId } = req.params;

    const classroom = await verifyClassroom(classroomId, req.faculty._id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or unauthorized access.',
      });
    }

    const activeStudents = await Student.find({
      classroom: classroomId,
      isActive: true,
    }).lean();

    const activeIds = activeStudents.map((s) => s._id);
    const shuffledIds = shuffleArray(activeIds);

    let round = await SelectionRound.findOne({ classroom: classroomId });
    const nextRoundNumber = round ? round.roundNumber + 1 : 1;

    round = await SelectionRound.findOneAndUpdate(
      { classroom: classroomId },
      {
        faculty: req.faculty._id,
        roundNumber: nextRoundNumber,
        totalEligible: activeStudents.length,
        remainingStudentIds: shuffledIds,
        selectedStudentIds: [],
        lastSelectedStudent: null,
        isCompleted: false,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Fresh Fair Round #${nextRoundNumber} initiated with newly randomized student order.`,
      round: {
        roundNumber: round.roundNumber,
        totalEligible: round.totalEligible,
        remainingCount: round.remainingStudentIds.length,
        selectedCount: 0,
        isCompleted: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get selection history (with classroom and date filtering, pagination)
// @route   GET /api/selection/history
export const getSelectionHistory = async (req, res, next) => {
  try {
    const { classroomId, date, mode, page = 1, limit = 50 } = req.query;

    let query = { faculty: req.faculty._id };

    if (classroomId) {
      query.classroom = classroomId;
    }

    if (mode) {
      query.mode = mode;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.selectedAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await SelectionHistory.countDocuments(query);

    const history = await SelectionHistory.find(query)
      .populate('classroom', 'name subject section department')
      .populate('student', 'fullName rollNumber profileImage isActive')
      .sort({ selectedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear selection history (with confirmation)
// @route   DELETE /api/selection/history
export const clearSelectionHistory = async (req, res, next) => {
  try {
    const { classroomId } = req.query;

    let query = { faculty: req.faculty._id };
    if (classroomId) {
      query.classroom = classroomId;
    }

    const result = await SelectionHistory.deleteMany(query);

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${result.deletedCount} selection history record(s).`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
