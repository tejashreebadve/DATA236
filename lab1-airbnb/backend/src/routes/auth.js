// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db'); // promise-wrapped pool (module.exports = pool.promise())

function cleanEmail(e){ return (e || '').trim().toLowerCase(); }

// ---------- SIGNUP ----------
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, role are required' });
    }
    const r = String(role).toUpperCase();
    if (!['OWNER','TRAVELER'].includes(r)) {
      return res.status(400).json({ error: 'role must be OWNER or TRAVELER' });
    }

    const e = cleanEmail(email);
    const hash = await bcrypt.hash(password, 10);

    // Figure out which password column your table has
    const [[passColHash]] = await pool.query("SHOW COLUMNS FROM users LIKE 'password_hash'").catch(()=>[null]);
    const passwordColumn = passColHash?.Field === 'password_hash' ? 'password_hash' : 'password';

    // Insert user (assumes users has columns: role, name, email, <passwordColumn>)
    await pool.execute(
      `INSERT INTO users (role, name, email, ${passwordColumn}) VALUES (?,?,?,?)`,
      [r, name, e, hash]
    );

    const [[user]] = await pool.query(
      'SELECT id, role, name, email FROM users WHERE email = ? LIMIT 1',
      [e]
    );

    // Start session
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    return res.status(201).json({ user: req.session.user });

  } catch (err) {
    console.error('SIGNUP FAILED ⇣', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(500).json({
      error: 'Signup failed',
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      message: err.message
    });
  }
});

// ---------- LOGIN ----------
router.post('/login', async (req, res) => {
  try {
    const em = cleanEmail(req.body?.email);
    const pw = String(req.body?.password || '');

    // Pull the row
    const [[row]] = await pool.query('SELECT * FROM users WHERE email=? LIMIT 1', [em]);
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    // Support either password_hash or password column
    const hash = row.password_hash ?? row.password;
    if (!hash) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(pw, hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    req.session.user = user;
    return res.json({ user });
  } catch (e) {
    console.error('AUTH /login', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ---------- LOGOUT ----------
router.post('/logout', (req, res) => {
  try {
    req.session.destroy(() => {
      res.clearCookie('sid'); // name must match app.js session cookie name
      res.json({ ok: true });
    });
  } catch (e) {
    console.error('AUTH /logout', e);
    res.json({ ok: true });
  }
});

// ---------- ME ----------
router.get('/me', (req, res) => {
  return res.json({ user: req.session.user || null });
});

module.exports = router;
