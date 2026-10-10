import express from 'express';
import { getDashboardStats } from '../controllers/statsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/dashboard', getDashboardStats);

export default router;
