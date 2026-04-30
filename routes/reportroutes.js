import express from 'express';
import { getReportStats } from '../controllers/reportcontroller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stats', authMiddleware, getReportStats);

export default router;