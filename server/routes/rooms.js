const router = require('express').Router();
const auth = require('../middleware/auth');
const roomService = require('../services/roomService');
const userService = require('../services/userService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// POST /api/rooms - create group room
router.post('/', auth, async (req, res, next) => {
  try {
    const { name, members } = req.body || {};
    if (!name) throw ApiError.badRequest('Room name is required');
    const room = await roomService.createGroup(name, req.user._id, members || []);
    return ApiResponse.created({ room }).send(res);
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms - list user's rooms
router.get('/', auth, async (req, res, next) => {
  try {
    const rooms = await roomService.getUserRooms(req.user._id);
    return ApiResponse.ok({ rooms }).send(res);
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms/:id - room details
router.get('/:id', auth, async (req, res, next) => {
  try {
    const room = await roomService.getRoom(req.params.id);
    if (!room) throw ApiError.notFound('Room not found');
    const notificationLevel = userService.levelFor(req.user, room._id);
    return ApiResponse.ok({ room, notificationLevel }).send(res);
  } catch (err) {
    next(err);
  }
});

// PUT /api/rooms/:id/notifications - update per-room notification level
router.put('/:id/notifications', auth, async (req, res, next) => {
  try {
    const { level } = req.body || {};
    const result = await userService.setNotificationLevel(req.user._id, req.params.id, level);
    return ApiResponse.ok({ level: result }).send(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/:id/join
router.post('/:id/join', auth, async (req, res, next) => {
  try {
    const room = await roomService.joinRoom(req.params.id, req.user._id);
    if (!room) throw ApiError.notFound('Room not found');
    return ApiResponse.ok({ room }).send(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/:id/leave
router.post('/:id/leave', auth, async (req, res, next) => {
  try {
    const room = await roomService.leaveRoom(req.params.id, req.user._id);
    if (!room) throw ApiError.notFound('Room not found');
    return ApiResponse.ok({ left: true }).send(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/dm - find or create DM
router.post('/dm', auth, async (req, res, next) => {
  try {
    const { userId } = req.body || {};
    if (!userId) throw ApiError.badRequest('userId is required');
    const room = await roomService.findOrCreateDM(req.user._id, userId);
    return ApiResponse.ok({ room }).send(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
