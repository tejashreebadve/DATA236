// backend/src/routes/owners.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 

function requireOwner(req,res,next){
  const u = req.session?.user;
  if (!u) return res.status(401).json({ error: 'auth required' });
  if (u.role !== 'OWNER') return res.status(403).json({ error: 'owner only' });
  next();
}

// owner properties
router.get('/me/properties', requireOwner, async (req, res) => {
  try {
    const uid = req.session.user.id;
    const [rows] = await pool.query(`
      SELECT p.*, (SELECT url FROM property_images i WHERE i.property_id=p.id ORDER BY id ASC LIMIT 1) AS image_url
      FROM properties p WHERE p.owner_id=? ORDER BY p.created_at DESC
    `, [uid]);
    res.json(rows || []);
  } catch (e) {
    console.error('OWN props', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// owner bookings (incoming + previous)
router.get('/me/bookings', requireOwner, async (req, res) => {
  try {
    const uid = req.session.user.id;
    const [rows] = await pool.query(`
      SELECT b.*, p.name AS property_name, u.name AS traveler_name, u.email AS traveler_email
      FROM bookings b
      JOIN properties p ON p.id=b.property_id
      JOIN users u ON u.id=b.traveler_id
      WHERE p.owner_id=?
      ORDER BY b.start_date DESC
    `, [uid]);
    res.json(rows || []);
  } catch (e) {
    console.error('OWN bookings', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET owner profile (name, email, location)
router.get('/me/profile', requireOwner, async (req, res) => {
  try {
    const uid = req.session.user.id;
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, o.location
      FROM users u
      LEFT JOIN owner_profiles o ON o.user_id = u.id
      WHERE u.id = ?
    `, [uid]);
    res.json(rows[0] || {});
  } catch (e) {
    console.error('OWN profile fetch', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// PUT update owner profile
router.put('/me/profile', requireOwner, async (req, res) => {
  try {
    const uid = req.session.user.id;
    const { name, email, location } = req.body;
    await pool.execute(`UPDATE users SET name=?, email=? WHERE id=?`, [name, email, uid]);
    await pool.execute(`
      INSERT INTO owner_profiles (user_id, location)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE location = VALUES(location)
    `, [uid, location || '']);
    res.json({ ok: true });
  } catch (e) {
    console.error('OWN profile update', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Add new property
router.post('/properties', requireOwner, async (req, res) => {
  try {
    const ownerId = req.session.user.id;
    const {
      name, type, category, location, country,
      description, amenities, price_per_night,
      bedrooms, bathrooms, max_guests
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO properties
      (owner_id, name, type, category, location, country, description,
       amenities, price_per_night, bedrooms, bathrooms, max_guests)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      ownerId, name, type, category, location, country, description,
      JSON.stringify(amenities), price_per_night, bedrooms, bathrooms, max_guests
    ]);

    res.json({ propertyId: result.insertId });
  } catch (e) {
    console.error("POST /owner/properties", e);
    res.status(500).json({ error: "Internal error", message: e.message });
  }
});

// Update existing property
router.put('/properties/:id', requireOwner, async (req, res) => {
  try {
    const uid = req.session.user.id;
    const pid = req.params.id;
    const {
      name, type, category, location, country,
      description, amenities, price_per_night,
      bedrooms, bathrooms, max_guests
    } = req.body;

    const [result] = await pool.execute(`
      UPDATE properties
      SET name=?, type=?, category=?, location=?, country=?, description=?,
          amenities=?, price_per_night=?, bedrooms=?, bathrooms=?, max_guests=?
      WHERE id=? AND owner_id=?
    `, [
      name, type, category, location, country, description,
      JSON.stringify(amenities), price_per_night,
      bedrooms, bathrooms, max_guests,
      pid, uid
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Property not found or unauthorized' });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("PUT /owner/properties/:id", e);
    res.status(500).json({ error: "Internal error", message: e.message });
  }
});

router.post('/properties/:id/images', requireOwner, upload.single('file'), async (req, res) => {
  try {
    const pid = req.params.id;
    const uid = req.session.user.id;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const imageUrl = `/uploads/${file.filename}`;

    await pool.execute(
      'INSERT INTO property_images (property_id, url) VALUES (?, ?)',
      [pid, imageUrl]
    );

    res.json({ ok: true, url: imageUrl });
  } catch (e) {
    console.error('Upload failed', e);
    res.status(500).json({ error: 'Upload failed' });
  }
});
module.exports = router;
