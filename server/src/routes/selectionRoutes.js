import express from 'express';
import {
  getSelectionStatus,
  drawStudent,
  resetRound,
  getSelectionHistory,
  clearSelectionHistory,
} from '../controllers/selectionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { drawLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

// Classroom specific selection routes
router.get('/classrooms/:classroomId/selection/status', getSelectionStatus);
router.post('/classrooms/:classroomId/selection/draw', drawLimiter, drawStudent);
router.post('/classrooms/:classroomId/selection/reset-round', resetRound);

// Global selection history routes for faculty
router.get('/selection/history', getSelectionHistory);
router.delete('/selection/history', clearSelectionHistory);

export default router;
