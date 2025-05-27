import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  resetOtp: { type: String },
  resetOtpExpires: { type: Date },
}, {
  timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
