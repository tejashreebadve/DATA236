require('dotenv').config();

// Register models for population FIRST - before anything else
// This ensures models are available when Booking model is loaded
// Register Traveler, Owner, Property first (for population)
require('./models/Traveler');
require('./models/Owner');
require('./models/Property');
// Then register Booking (which references the above)
require('./models/Booking');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Initialize Kafka consumer (after models are registered)
require('./kafka/consumer');

// Load routes AFTER all models are registered
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'booking-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/booking', bookingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      status: 404,
    },
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

