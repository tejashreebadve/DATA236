require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');
const ownerRoutes = require('./routes/ownerRoutes');
const errorHandler = require('./middleware/errorHandler');

// Initialize Kafka consumer
require('./kafka/consumer');

const app = express();

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'owner-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/owner', ownerRoutes);

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

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Owner Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

