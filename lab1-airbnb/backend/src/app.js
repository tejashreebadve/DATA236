// backend/src/app.js (CommonJS)

require('dotenv').config({ override: true });

const express = require('express');
const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const cors = require('cors');
const path = require('path');

// Local modules (CommonJS)
const agentRoutes = require('./routes/agent');
const pool = require('./db'); // if your routes use it, keep this require

const app = express();

// ---- CORS ----
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// ---- JSON body parsing ----
app.use(express.json());

// ---- Session store ----
const MySQLStore = MySQLStoreFactory(session);
const store = new MySQLStore({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  clearExpired: true,
  expiration: 1000 * 60 * 60 * 24 * 7, // 7 days
  createDatabaseTable: true,
});

app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true behind https/proxy
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

// ---- Routes (relative to src/) ----
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/favorites',  require('./routes/favorites'));
app.use('/api/bookings',   require('./routes/bookings')); // if you added bookings
app.use('/api/owners',     require('./routes/owners'));
app.use('/api/profile',    require('./routes/profile'));

// Health & static
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// ---- AI Agent proxy ----
app.use('/api/agent', agentRoutes);

// ---- Start server ----
const PORT = Number(process.env.PORT || 8000);
app.listen(PORT, () => {
  console.log('API on :' + PORT);
});