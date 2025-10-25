const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');   

function cleanEmail(e){ return (e || '').trim().toLowerCase(); }

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role = 'TRAVELER', location } = req.body || {};
    const em = cleanEmail(email);
    if (!em || !password) return res.status(400).json({ error: 'Email & password required' });

    const hash = bcrypt.hashSync(String(password), 10);
    const pool = await getPool();

    // Insert or update user
const [result] = await pool.execute(
  `INSERT INTO users (name, email, password_hash, role)
   VALUES (?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
  [name || em.split('@')[0], em, hash, role]
);

// Safely get the user ID
let userId = result.insertId;
if (!userId) {
  const [[existing]] = await pool.query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [em]
  );
  userId = existing?.id;
}

if (!userId) {
  return res.status(500).json({ error: 'User creation failed.' });
}

// Now fetch full user
const [[user]] = await pool.query(
  'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1',
  [userId]
);

// Insert owner profile if needed
if (user?.role === 'OWNER' && location) {
  await pool.execute(
    `INSERT INTO owner_profiles (user_id, location)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE location = VALUES(location)`,
    [user.id, location]
  );
}


  } catch (e) {
    console.error('AUTH /signup', e);
    return res.status(500).json({ error: 'Signup failed' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const em = cleanEmail(req.body?.email);
    const pw = String(req.body?.password || '');

    const pool = await getPool();
    const [[row]] = await pool.query('SELECT * FROM users WHERE email=? LIMIT 1', [em]);

    if (!row || !row.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(pw, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    req.session.user = user;
    return res.json({ user });
  } catch (e) {
    console.error('AUTH /login', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/logout', (req, res) => {
  try {
    req.session.destroy(() => {
      res.clearCookie('sid');
      res.json({ ok: true });
    });
  } catch (e) {
    console.error('AUTH /logout', e);
    res.json({ ok: true });
  }
});

router.get('/me', (req, res) => {
  return res.json({ user: req.session.user || null });
});

module.exports = router;
