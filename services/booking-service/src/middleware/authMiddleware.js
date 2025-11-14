const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
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

module.exports = {
  authenticate,
};

