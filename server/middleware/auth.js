const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ error: { message: 'User not found' } });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ error: { message: 'Invalid token' } });
  }
}

module.exports = auth;
