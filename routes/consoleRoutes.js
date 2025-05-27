import express from 'express';
import {
  getAllConsoles,
  createConsole,
  updateConsole,
  deleteConsole
} from '../controllers/consoleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllConsoles);
router.post('/', protect, createConsole);
router.put('/:id', protect, updateConsole);
router.delete('/:id', protect, deleteConsole);

export default router;
