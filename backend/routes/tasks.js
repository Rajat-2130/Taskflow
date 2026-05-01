const express = require('express');
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth, requireProjectRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/tasks/my - get all tasks assigned to me
router.get('/my', async (req, res) => {
  try {
    const tasks = await db.tasks.find({ assigneeId: req.user._id });
    const enriched = await Promise.all(tasks.map(async (t) => {
      const project = await db.projects.findOne({ _id: t.projectId });
      return { ...t, project: project ? { _id: project._id, name: project.name, color: project.color } : null };
    }));
    res.json(enriched.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/dashboard - dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const memberships = await db.members.find({ userId: req.user._id });
    const memberProjectIds = memberships.map(m => m.projectId);
    const ownedProjects = await db.projects.find({ createdBy: req.user._id });
    const allProjectIds = [...new Set([...ownedProjects.map(p => p._id), ...memberProjectIds])];

    const allTasks = await db.tasks.find({ projectId: { $in: allProjectIds } });
    const myTasks = allTasks.filter(t => t.assigneeId === req.user._id);
    const now = new Date().toISOString();

    const stats = {
      totalProjects: allProjectIds.length,
      totalTasks: allTasks.length,
      myTasks: myTasks.length,
      completed: myTasks.filter(t => t.status === 'done').length,
      inProgress: myTasks.filter(t => t.status === 'in-progress').length,
      overdue: myTasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < now).length,
      recentTasks: allTasks
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', requireProjectRole(), async (req, res) => {
  try {
    const tasks = await db.tasks.find({ projectId: req.params.projectId });

    // Enrich with assignee info
    const assigneeIds = [...new Set(tasks.map(t => t.assigneeId).filter(Boolean))];
    const assignees = await db.users.find({ _id: { $in: assigneeIds } });
    const assigneeMap = Object.fromEntries(assignees.map(u => [u._id, { _id: u._id, name: u.name, email: u.email }]));

    const enriched = tasks.map(t => ({
      ...t,
      assignee: t.assigneeId ? assigneeMap[t.assigneeId] : null,
    }));

    res.json(enriched.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('projectId').notEmpty().withMessage('Project ID required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, projectId, assigneeId, priority, status, dueDate } = req.body;

  // Check project access
  const project = await db.projects.findOne({ _id: projectId });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const isMember = project.createdBy === req.user._id ||
    await db.members.findOne({ projectId, userId: req.user._id });
  if (!isMember) return res.status(403).json({ error: 'Not authorized' });

  try {
    const task = await db.tasks.insert({
      _id: uuid(),
      title,
      description: description || '',
      projectId,
      assigneeId: assigneeId || null,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate: dueDate || null,
      createdBy: req.user._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const task = await db.tasks.findOne({ _id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await db.projects.findOne({ _id: task.projectId });
    const isAdmin = project.createdBy === req.user._id ||
      (await db.members.findOne({ projectId: task.projectId, userId: req.user._id, role: 'admin' }));
    const isAssignee = task.assigneeId === req.user._id;
    const isCreator = task.createdBy === req.user._id;

    if (!isAdmin && !isAssignee && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    const { title, description, assigneeId, priority, status, dueDate } = req.body;
    await db.tasks.update({ _id: req.params.id }, {
      $set: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate }),
        updatedAt: new Date().toISOString(),
      }
    });

    const updated = await db.tasks.findOne({ _id: req.params.id });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await db.tasks.findOne({ _id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await db.projects.findOne({ _id: task.projectId });
    const isAdmin = project.createdBy === req.user._id ||
      (await db.members.findOne({ projectId: task.projectId, userId: req.user._id, role: 'admin' }));

    if (!isAdmin && task.createdBy !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.tasks.remove({ _id: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
