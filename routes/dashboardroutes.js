import express from 'express';
import { getDashboardStats } from '../controllers/authdashboard.js';
import authMiddleware from '../middlewares/authMiddleware.js'; // Ensure you protect this data!

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, getDashboardStats);

export default router;