import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { sendOTPEmail } from '../utils/sendEmail.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// REGISTER
export const registerAdmin = async (req, res) => {
  const { email, password, confirmPassword, businessName } = req.body;
  if (!email || !password || !confirmPassword || !businessName)
    return res.status(400).json({ message: 'All fields are required.' });

  if (password !== confirmPassword)
    return res.status(400).json({ message: 'Passwords do not match.' });

  const existing = await Admin.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already in use.' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.create({
    email,
    passwordHash,
    businessName,
    otp,
    otpExpires,
    isVerified: false
  });

  await sendOTPEmail(email, otp);
  res.status(201).json({ message: 'OTP sent. Please verify.' });
};

// LOGIN
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) return res.status(401).json({ message: 'Invalid credentials.' });
  if (!admin.isVerified) return res.status(403).json({ message: 'Please verify your account.' });

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

  const token = jwt.sign({ adminId: admin._id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    admin: {
      email: admin.email,
      businessName: admin.businessName,
      profilePicture: admin.profilePicture
    }
  });
};

// VERIFY OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin || admin.otp !== otp || admin.otpExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  admin.isVerified = true;
  admin.otp = null;
  admin.otpExpires = null;
  await admin.save();

  res.json({ message: 'Account verified successfully' });
};

// RESEND OTP
export const resendOTP = async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) return res.status(404).json({ message: 'Admin not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  admin.otp = otp;
  admin.otpExpires = otpExpires;
  await admin.save();

  await sendOTPEmail(email, otp);
  res.json({ message: 'OTP resent successfully' });
};

// UPDATE PROFILE (email can't be changed)
export const updateAdminInfo = async (req, res) => {
  const { businessName } = req.body;

  const admin = await Admin.findByIdAndUpdate(
    req.adminId,
    { businessName },
    { new: true }
  );

  res.json({
    message: 'Admin info updated.',
    admin: {
      email: admin.email,
      businessName: admin.businessName,
      profilePicture: admin.profilePicture
    }
  });
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const admin = await Admin.findById(req.adminId);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });

  const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!isMatch) return res.status(401).json({ message: 'Incorrect current password' });

  if (newPassword !== confirmPassword)
    return res.status(400).json({ message: 'New passwords do not match' });

  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  await admin.save();

  res.json({ message: 'Password changed successfully' });
};

// GET PROFILE
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-passwordHash');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// Send reset code
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(404).json({ message: 'Email not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  admin.resetOtp = otp;
  admin.resetOtpExpires = expires;
  await admin.save();

  await sendOTPEmail(email, otp); // reuse existing email function
  res.json({ message: 'Reset OTP sent to your email' });
};

// Reset password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin || admin.resetOtp !== otp || admin.resetOtpExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  admin.resetOtp = null;
  admin.resetOtpExpires = null;
  await admin.save();

  res.json({ message: 'Password reset successfully' });
};

