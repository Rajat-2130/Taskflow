const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-key-change-in-production';

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findOne({ _id: decoded.id });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireProjectRole = (roles) => async (req, res, next) => {
  // Express 5 fix: req.params can be undefined in certain middleware contexts
  const params = req.params || {};
  const body = req.body || {};
  const projectId = params.projectId || body.projectId || params.id;
  if (!projectId) return next();

  try {
    const project = await db.projects.findOne({ _id: projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.createdBy === req.user._id) {
      req.projectRole = 'admin';
      req.project = project;
      return next();
    }

    const member = await db.members.findOne({ projectId, userId: req.user._id });
    if (!member) return res.status(403).json({ error: 'Not a member of this project' });

    if (roles && !roles.includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.projectRole = member.role;
    req.project = project;
    next();
  } catch (err) {
    console.error('[requireProjectRole ERROR]', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { auth, requireProjectRole, JWT_SECRET };