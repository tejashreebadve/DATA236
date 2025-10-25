// backend/src/app.js
require('dotenv').config({ override: true });
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
const pool = require('./db');
const path = require('path');


const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// session store (this uses non-promise mysql2 under the hood; that's fine)
const store = new MySQLStore({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  clearExpired: true,
  expiration: 1000 * 60 * 60 * 24 * 7,
  createDatabaseTable: true,
});

app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000*60*60*24*7 }
}));

// IMPORTANT: these paths are relative to src/
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/favorites',  require('./routes/favorites'));
app.use('/api/bookings',   require('./routes/bookings')); // if you added bookings
app.use('/api/owners', require('./routes/owners'));
app.get('/health', (_req,res)=>res.json({ ok:true }));
app.use('/api/profile', require('./routes/profile'));
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));



const PORT = Number(process.env.PORT || 8000);
app.listen(PORT, ()=>console.log('API on :' + PORT));
