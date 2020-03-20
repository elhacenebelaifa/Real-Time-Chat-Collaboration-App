const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const pushService = require('../services/pushService');

router.get('/vapid-public-key', auth, (req, res) => {
  const key = pushService.getVapidPublicKey();
  if (!key) return res.status(503).json({ error: { message: 'Push not configured' } });
  res.json({ key });
});

router.post('/subscribe', auth, async (req, res, next) => {
  try {
    const { subscription, userAgent } = req.body || {};
    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ error: { message: 'Invalid subscription' } });
    }

    await User.updateOne(
      { _id: req.user._id, 'pushSubscriptions.endpoint': subscription.endpoint },
      { $set: { 'pushSubscriptions.$.keys': subscription.keys } }
    );

    await User.updateOne(
      { _id: req.user._id, 'pushSubscriptions.endpoint': { $ne: subscription.endpoint } },
      {
        $push: {
          pushSubscriptions: {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
            userAgent: userAgent || req.get('User-Agent') || '',
            createdAt: new Date(),
          },
        },
      }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/subscribe', auth, async (req, res, next) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ error: { message: 'endpoint is required' } });
    }
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { pushSubscriptions: { endpoint } } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
