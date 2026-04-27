const router = require('express').Router();
const authService = require('../services/authService');
const auth = require('../middleware/auth');
const ApiResponse = require('../utils/ApiResponse');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const result = await authService.register(req.body || {});
    return ApiResponse.created(result).send(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const result = await authService.login(email, password);
    return ApiResponse.ok(result).send(res);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  return ApiResponse.ok({ user: authService.getCurrentUser(req.user) }).send(res);
});

module.exports = router;
