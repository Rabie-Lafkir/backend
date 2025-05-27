import express from 'express';
import {
  startSession,
  pauseSession,
  resumeSession,
  stopSession
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/start', protect, startSession);
router.patch('/:id/pause', protect, pauseSession);
router.patch('/:id/resume', protect, resumeSession);
router.patch('/:id/stop', protect, stopSession);

export default router;
