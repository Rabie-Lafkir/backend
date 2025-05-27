import Admin from '../models/Admin.js';

export const updateProfilePicture = async (req, res) => {
  try {
    const imagePath = req.file.path;
    const admin = await Admin.findByIdAndUpdate(
      req.adminId,
      { profilePicture: imagePath },
      { new: true }
    );
    res.json({
      message: 'Profile picture updated.',
      profilePicture: admin.profilePicture
    });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed.', error: err.message });
  }
};
