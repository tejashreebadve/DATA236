const router = require('express').Router();
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const pool = require('../db');

const signupSchema = Joi.object({
  role: Joi.string().valid('TRAVELER','OWNER').required(),
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  location: Joi.string().optional() // for Owner
});

router.post('/signup', async (req, res) => {
  try {
    const v = await signupSchema.validateAsync(req.body);
    const [ex] = await pool.query('SELECT id FROM users WHERE email=?',[v.email]);
    if (ex.length) return res.status(400).json({ error: 'Email in use' });

    const hash = await bcrypt.hash(v.password, 10);
    const [r] = await pool.query(
      'INSERT INTO users(role,name,email,password_hash) VALUES (?,?,?,?)',
      [v.role, v.name, v.email, hash]
    );
    const user = { id: r.insertId, role: v.role, name: v.name, email: v.email };

    if (v.role === 'OWNER') {
      await pool.query('INSERT INTO owner_profiles(user_id, location) VALUES (?,?)', [user.id, v.location || '']);
    } else {
      await pool.query('INSERT INTO traveler_profiles(user_id) VALUES (?)', [user.id]);
    }

    req.session.user = user;
    res.json({ user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE email=?',[email]);
  if (!rows.length) return res.status(400).json({ error: 'Invalid credentials' });
  const u = rows[0];
  const ok = await require('bcryptjs').compare(password, u.password_hash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const user = { id: u.id, role: u.role, name: u.name, email: u.email };
  req.session.user = user;
  res.json({ user });
});

router.post('/logout', (req, res) => {
  req.session.destroy(()=> res.json({ ok:true }));
});

router.get('/me', (req,res)=> res.json({ user: req.session.user || null }));

module.exports = router;
