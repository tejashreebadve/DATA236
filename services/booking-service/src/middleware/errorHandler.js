const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, status: 404 };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    error = { message, status: 400 };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = { message, status: 400 };
  }

  res.status(error.status || 500).json({
    error: {
      message: error.message || 'Server Error',
      code: error.code || 'SERVER_ERROR',
      status: error.status || 500,
    },
  });
};

module.exports = errorHandler;

