const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

function signToken(user) {
  return jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

const authService = {
  async register({ username, email, password, displayName, publicKey }) {
    if (!username || !email || !password) {
      throw ApiError.badRequest('Username, email, and password are required');
    }
    if (password.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters');
    }

    const existing = await userRepository.findByEmailOrUsername(email, username);
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username';
      throw ApiError.conflict(`${field} already taken`, {
        code: existing.email === email ? 'EMAIL_TAKEN' : 'USERNAME_TAKEN',
      });
    }

    const user = await userRepository.create({ username, email, password, displayName, publicKey });
    const token = signToken(user);
    return { token, user: user.toJSON() };
  },

  async login(email, password) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }
    const user = await userRepository.findByEmail(email);
    if (!user) throw ApiError.unauthorized('Invalid credentials');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

    const token = signToken(user);
    return { token, user: user.toJSON() };
  },

  getCurrentUser(user) {
    return user.toJSON();
  },
};

module.exports = authService;
