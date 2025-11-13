const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to authenticate JWT tokens
 * Attaches user info to req.user if token is valid
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'No token provided or invalid format',
          code: 'NO_TOKEN',
          status: 401,
        },
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request object
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        message: error.message || 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        status: 401,
      },
    });
  }
};

/**
 * Middleware to check if user has a specific role
 * Must be used after authenticate middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED',
          status: 401,
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: 'You do not have permission to access this resource',
          code: 'FORBIDDEN',
          status: 403,
        },
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};

