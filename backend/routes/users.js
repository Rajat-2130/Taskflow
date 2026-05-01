const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/users/search?email=
router.get('/search', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json([]);
  try {
    const users = await db.users.find({ email: new RegExp(email, 'i') });
    res.json(users.map(u => ({ _id: u._id, name: u.name, email: u.email })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
