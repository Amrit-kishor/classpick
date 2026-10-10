import express from 'express';
import multer from 'multer';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  exportStudents,
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = express.Router();

router.use(protect);

// Classroom nested routes for students
router.get('/classrooms/:classroomId/students', getStudents);
router.post('/classrooms/:classroomId/students', createStudent);
router.post(
  '/classrooms/:classroomId/students/import',
  upload.single('file'),
  importStudents
);
router.get('/classrooms/:classroomId/students/export', exportStudents);

// Direct student item operations
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

export default router;
