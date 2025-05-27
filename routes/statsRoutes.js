import express from 'express';
import { getStats, getTodayStats, getDailyIncome, getConsoleUsageToday, getDailySessions, getSessionTypeBreakdown, getHourlyActivity } from '../controllers/statsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', protect, getStats);
router.get('/summary', protect, getTodayStats);
router.get('/daily-income', protect, getDailyIncome);
router.get('/console-usage-today', protect, getConsoleUsageToday);
router.get('/daily-sessions', protect, getDailySessions);
router.get('/session-types', protect, getSessionTypeBreakdown);
router.get('/hourly-activity', protect, getHourlyActivity);


export default router;
