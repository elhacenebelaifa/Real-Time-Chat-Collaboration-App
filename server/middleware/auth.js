const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    let token = null;
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    } else if (typeof req.query.token === 'string' && req.query.token) {
      token = req.query.token;
    }
    if (!token) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }
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
