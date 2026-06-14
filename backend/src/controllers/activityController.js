const prisma = require('../config/db');

// @desc    Get user activities timeline
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: { userId: req.user.id },
      orderBy: { timestamp: 'desc' },
      take: 100 // return last 100 timeline records
    });
    res.json(activities);
  } catch (error) {
    console.error('Fetch activities error:', error);
    res.status(500).json({ message: 'Server error retrieving activities' });
  }
};

module.exports = {
  getActivities
};
