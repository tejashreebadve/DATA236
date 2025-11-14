const jwt = require('jsonwebtoken');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
 * Middleware to ensure user is a traveler
 */
const requireTraveler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED',
        status: 401,
      },
    });
  }

  if (req.user.role !== 'traveler') {
    return res.status(403).json({
      error: {
        message: 'Only travelers can access this resource',
        code: 'FORBIDDEN',
        status: 403,
      },
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireTraveler,
};

