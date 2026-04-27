const router = require('express').Router();
const auth = require('../middleware/auth');
const userService = require('../services/userService');
const ApiResponse = require('../utils/ApiResponse');

// GET /api/users/search?q=query
router.get('/search', auth, async (req, res, next) => {
  try {
    const users = await userService.searchUsers(req.query.q, req.user._id);
    return ApiResponse.ok({ users }).send(res);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/online
router.get('/online', auth, async (req, res, next) => {
  try {
    const users = await userService.getOnlineUsers();
    return ApiResponse.ok({ users }).send(res);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.params.id);
    return ApiResponse.ok({ user }).send(res);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/publicKey
router.put('/:id/publicKey', auth, async (req, res, next) => {
  try {
    await userService.setPublicKey(req.user._id, req.params.id, req.body && req.body.publicKey);
    return ApiResponse.ok({ updated: true }).send(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
