const express = require('express');
const router = express.Router();
const { 
  shortenUrl, 
  getUserUrls, 
  getUserStats, 
  getUserLeaderboard,
  deleteUrl, 
  getUrlAnalytics,
  getPublicUrlAnalytics,
  bulkShortenUrls,
  toggleFavoriteUrl,
  moveUrlWorkspace,
  addUrlNote,
  editUrlNote,
  deleteUrlNote,
  updateUrlSettings
} = require('../controllers/urlController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.post('/shorten', optionalProtect, shortenUrl);
router.post('/bulk', protect, bulkShortenUrls);
router.get('/', protect, getUserUrls);
router.get('/stats', protect, getUserStats);
router.get('/leaderboard', protect, getUserLeaderboard);
router.delete('/:id', protect, deleteUrl);
router.get('/:id/analytics', protect, getUrlAnalytics);
router.patch('/:id/settings', protect, updateUrlSettings);

router.patch('/:id/favorite', protect, toggleFavoriteUrl);
router.patch('/:id/workspace', protect, moveUrlWorkspace);

// Notes CRUD
router.post('/:id/notes', protect, addUrlNote);
router.put('/:id/notes/:noteId', protect, editUrlNote);
router.delete('/:id/notes/:noteId', protect, deleteUrlNote);

// Public route to retrieve link analytics
router.get('/public/:shortCode/analytics', getPublicUrlAnalytics);

module.exports = router;
