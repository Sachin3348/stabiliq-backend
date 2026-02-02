const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'stabiliq_secret_key_change_in_production';

/**
 * Create JWT access token
 */
const createAccessToken = (data) => {
  const expireDays = parseInt(process.env.JWT_EXPIRE_DAYS || '30');
  const expiresIn = `${expireDays}d`;
  
  return jwt.sign(data, JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Token has expired');
      err.statusCode = 401;
      throw err;
    }
    const err = new Error('Invalid token');
    err.statusCode = 401;
    throw err;
  }
};

/**
 * Middleware to get current user from JWT token
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return res.status(statusCode).json({ detail: error.message });
  }
};

module.exports = {
  createAccessToken,
  verifyToken,
  getCurrentUser,
};
