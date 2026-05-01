const express = require('express');
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth, requireProjectRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/projects - list all projects for user
router.get('/', async (req, res) => {
  try {
    const memberships = await db.members.find({ userId: req.user._id });
    const memberProjectIds = memberships.map(m => m.projectId);
    const ownedProjects = await db.projects.find({ createdBy: req.user._id });
    const ownedIds = ownedProjects.map(p => p._id);

    const allIds = [...new Set([...ownedIds, ...memberProjectIds])];
    const allProjects = await db.projects.find({ _id: { $in: allIds } });

    const enriched = await Promise.all(allProjects.map(async (p) => {
      const projectMembers = await db.members.find({ projectId: p._id });
      const memberCount = projectMembers.length;
      const projectTasks = await db.tasks.find({ projectId: p._id });
      const taskCount = projectTasks.length;
      const completedCount = projectTasks.filter(t => t.status === 'done').length;
      const now = new Date().toISOString();
      const overdue = projectTasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < now).length;
      const myMembership = memberships.find(m => m.projectId === p._id);
      const role = p.createdBy === req.user._id ? 'admin' : (myMembership?.role || 'member');
      return { ...p, memberCount: memberCount + 1, taskCount, completedCount, overdue, role };
    }));

    res.json(enriched.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  } catch (err) {
    console.error('[GET /projects ERROR]', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('description').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, color } = req.body;
  try {
    const project = await db.projects.insert({
      _id: uuid(),
      name,
      description: description || '',
      color: color || '#6366f1',
      createdBy: req.user._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('[POST /projects ERROR]', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', requireProjectRole(), async (req, res) => {
  try {
    const members = await db.members.find({ projectId: req.params.id });
    const memberIds = [req.project.createdBy, ...members.map(m => m.userId)];
    const users = await db.users.find({ _id: { $in: memberIds } });
    const usersMap = Object.fromEntries(users.map(u => [u._id, { _id: u._id, name: u.name, email: u.email }]));

    const enrichedMembers = [
      { userId: req.project.createdBy, role: 'admin', user: usersMap[req.project.createdBy] },
      ...members.map(m => ({ ...m, user: usersMap[m.userId] }))
    ];

    res.json({ ...req.project, members: enrichedMembers, role: req.projectRole });
  } catch (err) {
    console.error('[GET /projects/:id ERROR]', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', requireProjectRole(['admin']), async (req, res) => {
  const { name, description, color } = req.body;
  try {
    await db.projects.update({ _id: req.params.id }, {
      $set: { name, description, color, updatedAt: new Date().toISOString() }
    });
    const updated = await db.projects.findOne({ _id: req.params.id });
    res.json(updated);
  } catch (err) {
    console.error('[PUT /projects/:id ERROR]', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', requireProjectRole(['admin']), async (req, res) => {
  try {
    await db.projects.remove({ _id: req.params.id });
    await db.members.remove({ projectId: req.params.id }, { multi: true });
    await db.tasks.remove({ projectId: req.params.id }, { multi: true });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('[DELETE /projects/:id ERROR]', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/members
router.post('/:projectId/members', requireProjectRole(['admin']), async (req, res) => {
  const { email, role } = req.body;
  try {
    const user = await db.users.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found. They must sign up first.' });

    if (user._id === req.project.createdBy) {
      return res.status(409).json({ error: 'User is already the project owner' });
    }

    const existing = await db.members.findOne({ projectId: req.params.projectId, userId: user._id });
    if (existing) return res.status(409).json({ error: 'User is already a member' });

    const member = await db.members.insert({
      _id: uuid(),
      projectId: req.params.projectId,
      userId: user._id,
      role: role || 'member',
      joinedAt: new Date().toISOString(),
    });

    res.status(201).json({ ...member, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('[POST /projects/:id/members ERROR]', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:projectId/members/:userId
router.put('/:projectId/members/:userId', requireProjectRole(['admin']), async (req, res) => {
  const { role } = req.body;
  try {
    await db.members.update(
      { projectId: req.params.projectId, userId: req.params.userId },
      { $set: { role } }
    );
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:projectId/members/:userId
router.delete('/:projectId/members/:userId', requireProjectRole(['admin']), async (req, res) => {
  try {
    await db.members.remove({ projectId: req.params.projectId, userId: req.params.userId });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
