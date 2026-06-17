const User = require('../models/user');

// GET /guide/status
// Returns hasGuideShown, domaine, speciality for the authenticated user
const getGuideStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('hasGuideShown domaine speciality');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      hasGuideShown: user.hasGuideShown,
      domaine: user.domaine,
      speciality: user.speciality,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /guide/profile
// Update domaine and speciality together in one call (stored as numeric indices)
const updateGuideProfile = async (req, res) => {
  try {
    const { domaine, speciality } = req.body;
    const update = {};

    if (domaine !== undefined) {
      if (typeof domaine !== 'number' || domaine < 0 || !Number.isInteger(domaine)) {
        return res.status(400).json({ message: 'domaine must be a non-negative integer' });
      }
      update.domaine = domaine;
    }
    if (speciality !== undefined) {
      if (typeof speciality !== 'number' || speciality < 0 || !Number.isInteger(speciality)) {
        return res.status(400).json({ message: 'speciality must be a non-negative integer' });
      }
      update.speciality = speciality;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('hasGuideShown domaine speciality');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated', domaine: user.domaine, speciality: user.speciality });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /guide/shown
// Mark the guide as shown (one-time flag)
const markGuideShown = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { hasGuideShown: true } },
      { new: true }
    ).select('hasGuideShown');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Guide marked as shown', hasGuideShown: user.hasGuideShown });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getGuideStatus, updateGuideProfile, markGuideShown };
