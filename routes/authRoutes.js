import express from 'express';
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminInfo,
  verifyOTP,
  resendOTP,
  changePassword,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';

import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { updateProfilePicture } from '../controllers/profileController.js';

const router = express.Router();

// Public
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Protected
router.get('/me', protect, getAdminProfile);
router.put('/update-info', protect, updateAdminInfo);
router.post('/upload-picture', protect, upload.single('image'), updateProfilePicture);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);        // sends OTP
router.post('/reset-password', resetPassword);          // verifies OTP + resets password


export default router;
