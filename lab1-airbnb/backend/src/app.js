require('dotenv').config({ override: true });

const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');

const app = express();

// CORS first
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

app.use(express.json());

// Session store
const store = new MySQLStore({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: { session_id: 'sid', expires: 'expires', data: 'data' }
  }
});

app.set('trust proxy', 0);

app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// Mount routes from ./routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/bookings', require('./routes/bookings'));


app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT || 8000);
app.listen(PORT, () => console.log('API on :' + PORT));
