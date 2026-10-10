import express from 'express';
import {
  getClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} from '../controllers/classroomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getClassrooms)
  .post(createClassroom);

router.route('/:id')
  .get(getClassroomById)
  .put(updateClassroom)
  .delete(deleteClassroom);

export default router;
