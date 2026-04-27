const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    let token = null;
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    } else if (typeof req.query.token === 'string' && req.query.token) {
      token = req.query.token;
    }
    if (!token) return next(ApiError.unauthorized('Authentication required'));

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return next(ApiError.unauthorized('Invalid token'));
    }

    const user = await userRepository.findByIdSafe(decoded.userId);
    if (!user) return next(ApiError.unauthorized('User not found'));

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;
