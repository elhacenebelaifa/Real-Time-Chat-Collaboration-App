const router = require('express').Router();
const auth = require('../middleware/auth');
const userService = require('../services/userService');
const pushService = require('../services/pushService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

router.get('/vapid-public-key', auth, (req, res, next) => {
  try {
    const key = pushService.getVapidPublicKey();
    if (!key) throw ApiError.unsupported('Push not configured');
    return ApiResponse.ok({ key }).send(res);
  } catch (err) {
    next(err);
  }
});

router.post('/subscribe', auth, async (req, res, next) => {
  try {
    const { subscription, userAgent } = req.body || {};
    const ua = userAgent || req.get('User-Agent') || '';
    await userService.subscribePush(req.user._id, subscription, ua);
    return ApiResponse.ok({ subscribed: true }).send(res);
  } catch (err) {
    next(err);
  }
});

router.delete('/subscribe', auth, async (req, res, next) => {
  try {
    const { endpoint } = req.body || {};
    await userService.unsubscribePush(req.user._id, endpoint);
    return ApiResponse.ok({ unsubscribed: true }).send(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
