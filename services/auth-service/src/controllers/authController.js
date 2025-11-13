const Traveler = require('../models/Traveler');
const Owner = require('../models/Owner');
const { generateToken, generateRefreshToken, verifyRefreshToken, verifyToken } = require('../utils/jwt');

/**
 * Register a new traveler
 */
const registerTraveler = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;

    // Check if traveler already exists
    const existingTraveler = await Traveler.findOne({ email });
    if (existingTraveler) {
      return res.status(400).json({
        error: {
          message: 'Traveler with this email already exists',
          code: 'EMAIL_EXISTS',
          status: 400,
        },
      });
    }

    // Create new traveler
    const traveler = await Traveler.create({
      email,
      password,
      name,
      phone,
    });

    // Generate tokens
    const tokenPayload = {
      id: traveler._id.toString(),
      email: traveler.email,
      role: 'traveler',
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: traveler._id,
        email: traveler.email,
        name: traveler.name,
        phone: traveler.phone,
        role: traveler.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new owner
 */
const registerOwner = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;

    // Check if owner already exists
    const existingOwner = await Owner.findOne({ email });
    if (existingOwner) {
      return res.status(400).json({
        error: {
          message: 'Owner with this email already exists',
          code: 'EMAIL_EXISTS',
          status: 400,
        },
      });
    }

    // Create new owner
    const owner = await Owner.create({
      email,
      password,
      name,
      phone,
    });

    // Generate tokens
    const tokenPayload = {
      id: owner._id.toString(),
      email: owner.email,
      role: 'owner',
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: owner._id,
        email: owner.email,
        name: owner.name,
        phone: owner.phone,
        role: owner.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login as traveler
 */
const loginTraveler = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find traveler and include password for comparison
    const traveler = await Traveler.findOne({ email }).select('+password');

    if (!traveler) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401,
        },
      });
    }

    // Verify password
    const isPasswordValid = await traveler.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401,
        },
      });
    }

    // Generate tokens
    const tokenPayload = {
      id: traveler._id.toString(),
      email: traveler.email,
      role: 'traveler',
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      token,
      refreshToken,
      user: {
        id: traveler._id,
        email: traveler.email,
        name: traveler.name,
        phone: traveler.phone,
        role: traveler.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login as owner
 */
const loginOwner = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find owner and include password for comparison
    const owner = await Owner.findOne({ email }).select('+password');

    if (!owner) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401,
        },
      });
    }

    // Verify password
    const isPasswordValid = await owner.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401,
        },
      });
    }

    // Generate tokens
    const tokenPayload = {
      id: owner._id.toString(),
      email: owner.email,
      role: 'owner',
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      token,
      refreshToken,
      user: {
        id: owner._id,
        email: owner.email,
        name: owner.name,
        phone: owner.phone,
        role: owner.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken: refreshTokenFromBody } = req.body;

    if (!refreshTokenFromBody) {
      return res.status(400).json({
        error: {
          message: 'Refresh token is required',
          code: 'NO_REFRESH_TOKEN',
          status: 400,
        },
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshTokenFromBody);

    // Generate new access token
    const tokenPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(401).json({
      error: {
        message: error.message || 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
        status: 401,
      },
    });
  }
};

/**
 * Verify JWT token
 */
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({
        error: {
          message: 'No token provided',
          code: 'NO_TOKEN',
          status: 400,
        },
        valid: false,
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Get user details based on role
    let user;
    if (decoded.role === 'traveler') {
      user = await Traveler.findById(decoded.id);
    } else if (decoded.role === 'owner') {
      user = await Owner.findById(decoded.id);
    }

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          status: 404,
        },
        valid: false,
      });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(401).json({
      error: {
        message: error.message || 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        status: 401,
      },
      valid: false,
    });
  }
};

module.exports = {
  registerTraveler,
  registerOwner,
  loginTraveler,
  loginOwner,
  refreshAccessToken,
  verifyJWT,
};

