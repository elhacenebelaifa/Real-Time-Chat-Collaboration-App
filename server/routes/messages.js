const router = require('express').Router();
const auth = require('../middleware/auth');
const messageService = require('../services/messageService');

// GET /api/messages/:roomId
router.get('/:roomId', auth, async (req, res, next) => {
  try {
    const { before, limit } = req.query;
    const messages = await messageService.getByRoom(req.params.roomId, {
      before,
      limit: parseInt(limit, 10) || 50,
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

// GET /api/messages/:roomId/thread/:parentId
router.get('/:roomId/thread/:parentId', auth, async (req, res, next) => {
  try {
    const { before, limit } = req.query;
    const messages = await messageService.getThread(req.params.parentId, {
      before,
      limit: parseInt(limit, 10) || 50,
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
