const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  console.log('AUTH DEBUG → method:', req.method);
  console.log('AUTH DEBUG → url:', req.originalUrl);
  console.log('AUTH DEBUG → headers.authorization:', req.headers.authorization);
  try {
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

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED',
        status: 401,
      },
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      error: {
        message: 'Only owners can access this resource',
        code: 'FORBIDDEN',
        status: 403,
      },
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireOwner,
};

