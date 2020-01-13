const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/users/search?q=query
router.get('/search', auth, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }
    const regex = new RegExp(q, 'i');
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: regex }, { displayName: regex }],
    })
      .select('username displayName avatar status publicKey')
      .limit(20);
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/online
router.get('/online', auth, async (req, res, next) => {
  try {
    const users = await User.find({ status: 'online' })
      .select('username displayName avatar');
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username displayName avatar status publicKey lastSeen');
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/publicKey
router.put('/:id/publicKey', auth, async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: { message: 'Cannot update another user\'s key' } });
    }
    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).json({ error: { message: 'publicKey is required' } });
    }
    await User.findByIdAndUpdate(req.params.id, { publicKey });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
