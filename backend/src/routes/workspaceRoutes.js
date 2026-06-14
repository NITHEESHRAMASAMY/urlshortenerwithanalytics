const express = require('express');
const router = express.Router();
const { getWorkspaces, createWorkspace, deleteWorkspace } = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWorkspaces);
router.post('/', protect, createWorkspace);
router.delete('/:id', protect, deleteWorkspace);

module.exports = router;
