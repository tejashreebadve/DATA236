const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

function requireAuth(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: 'auth required' });
  next();
}

// ---------- File upload config ----------
const uploadDir = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// ---------- GET /api/profile/me ----------
router.get('/me', requireAuth, async (req, res) => {
  try {
    const uid = req.session.user.id;

    const [[user]] = await pool.query(
      `SELECT id, name, email, role FROM users WHERE id = ?`,
      [uid]
    );

    if (!user) return res.status(404).json({ error: 'user not found' });

    const [[profile]] = await pool.query(
      `SELECT phone, about_me AS about, city, country, state_abbr AS state, 
              languages, gender, profile_image_url AS avatar
       FROM traveler_profiles WHERE user_id = ?`,
      [uid]
    );

    res.json({ ...user, ...profile });
  } catch (e) {
    console.error('GET /profile/me', e);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// ---------- PUT /api/profile/me ----------
router.put('/me', requireAuth, async (req, res) => {
  try {
    const uid = req.session.user.id;

    // Map frontend -> DB column names
    const mapping = {
      phone: 'phone',
      about: 'about_me',
      city: 'city',
      country: 'country',
      state: 'state_abbr',
      languages: 'languages',
      gender: 'gender',
    };

    const updates = [];
    const values = [];

    Object.keys(mapping).forEach(key => {
      if (req.body[key] !== undefined) {
        updates.push(`${mapping[key]} = ?`);
        values.push(req.body[key]);
      }
    });

    if (!updates.length) return res.json({ ok: true });

    // ensure a profile row exists
    await pool.execute(`INSERT IGNORE INTO traveler_profiles (user_id) VALUES (?)`, [uid]);

    values.push(uid);
    const sql = `UPDATE traveler_profiles SET ${updates.join(', ')} WHERE user_id = ?`;
    await pool.execute(sql, values);

    res.json({ ok: true });
  } catch (e) {
    console.error('PUT /profile/me', e);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ---------- POST /api/profile/avatar ----------
router.post('/avatar', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const uid = req.session.user.id;
    const relPath = `/uploads/avatars/${path.basename(req.file.path)}`;

    // ensure a profile row exists
    await pool.execute(`INSERT IGNORE INTO traveler_profiles (user_id) VALUES (?)`, [uid]);

    await pool.execute(
      `UPDATE traveler_profiles SET profile_image_url = ? WHERE user_id = ?`,
      [relPath, uid]
    );

    res.json({ ok: true, avatar: relPath });
  } catch (e) {
    console.error('POST /profile/avatar', e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
