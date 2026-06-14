const prisma = require('../config/db');

// @desc    Get all workspaces for user
// @route   GET /api/workspaces
// @access  Private
const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: { shortUrls: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(workspaces);
  } catch (error) {
    console.error('Fetch workspaces error:', error);
    res.status(500).json({ message: 'Server error retrieving workspaces' });
  }
};

// @desc    Create a custom workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Workspace name is required' });
  }

  const cleanName = name.trim();

  try {
    const existing = await prisma.workspace.findFirst({
      where: {
        userId: req.user.id,
        name: { equals: cleanName, mode: 'insensitive' }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Workspace already exists' });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: cleanName,
        userId: req.user.id
      }
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Server error creating workspace' });
  }
};

// @desc    Delete a workspace
// @route   DELETE /api/workspaces/:id
// @access  Private
const deleteWorkspace = async (req, res) => {
  const { id } = req.params;

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id }
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (workspace.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this workspace' });
    }

    // Default folders cannot be deleted (Marketing, Business, Personal, Projects)
    const defaults = ['Marketing', 'Business', 'Personal', 'Projects'];
    if (defaults.includes(workspace.name)) {
      return res.status(400).json({ message: 'Cannot delete default workspaces' });
    }

    await prisma.workspace.delete({
      where: { id }
    });

    res.json({ message: 'Workspace successfully deleted' });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ message: 'Server error deleting workspace' });
  }
};

module.exports = {
  getWorkspaces,
  createWorkspace,
  deleteWorkspace
};
