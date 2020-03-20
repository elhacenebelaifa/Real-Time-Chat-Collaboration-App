const router = require('express').Router();
const auth = require('../middleware/auth');
const roomService = require('../services/roomService');
const User = require('../models/User');

const VALID_LEVELS = ['all', 'mentions', 'none'];

function levelFor(user, roomId) {
  const overrides = user.notificationOverrides;
  if (!overrides) return 'all';
  if (overrides instanceof Map) return overrides.get(roomId.toString()) || 'all';
  return overrides[roomId.toString()] || 'all';
}

// POST /api/rooms - create group room
router.post('/', auth, async (req, res, next) => {
  try {
    const { name, members } = req.body;
    if (!name) {
      return res.status(400).json({ error: { message: 'Room name is required' } });
    }
    const room = await roomService.createGroup(name, req.user._id, members || []);
    res.status(201).json({ room });
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms - list user's rooms
router.get('/', auth, async (req, res, next) => {
  try {
    const rooms = await roomService.getUserRooms(req.user._id);
    res.json({ rooms });
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms/:id - room details
router.get('/:id', auth, async (req, res, next) => {
  try {
    const room = await roomService.getRoom(req.params.id);
    if (!room) {
      return res.status(404).json({ error: { message: 'Room not found' } });
    }
    res.json({ room, notificationLevel: levelFor(req.user, room._id) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/rooms/:id/notifications - update per-room notification level
router.put('/:id/notifications', auth, async (req, res, next) => {
  try {
    const { level } = req.body || {};
    if (!VALID_LEVELS.includes(level)) {
      return res.status(400).json({ error: { message: 'level must be one of all|mentions|none' } });
    }

    const key = `notificationOverrides.${req.params.id}`;
    if (level === 'all') {
      await User.updateOne({ _id: req.user._id }, { $unset: { [key]: '' } });
    } else {
      await User.updateOne({ _id: req.user._id }, { $set: { [key]: level } });
    }

    res.json({ level });
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/:id/join
router.post('/:id/join', auth, async (req, res, next) => {
  try {
    const room = await roomService.joinRoom(req.params.id, req.user._id);
    if (!room) {
      return res.status(404).json({ error: { message: 'Room not found' } });
    }
    res.json({ room });
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/:id/leave
router.post('/:id/leave', auth, async (req, res, next) => {
  try {
    const room = await roomService.leaveRoom(req.params.id, req.user._id);
    if (!room) {
      return res.status(404).json({ error: { message: 'Room not found' } });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/dm - find or create DM
router.post('/dm', auth, async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: { message: 'userId is required' } });
    }
    const room = await roomService.findOrCreateDM(req.user._id, userId);
    res.json({ room });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
