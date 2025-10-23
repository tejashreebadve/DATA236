const express = require('express');
const router = express.Router();
const { getPool } = require('../db');

// GET /api/properties/search?location=&guests=&start=&end=
router.get('/search', async (req, res) => {
  try {
    const { location = '', guests } = req.query;
    const pool = await getPool();

    // basic filter on location + optional min guests
    const params = [];
    let where = '1=1';
    if (location) {
      where += ' AND p.location LIKE ?';
      params.push(`%${location}%`);
    }
    if (guests) {
      where += ' AND p.max_guests >= ?';
      params.push(Number(guests));
    }

    // pick first image per property
    const [rows] = await pool.query(
      `
      SELECT
        p.id, p.owner_id, p.name, p.type, p.location, p.description,
        p.amenities, p.price_per_night, p.bedrooms, p.bathrooms, p.max_guests,
        (
          SELECT pi.url FROM property_images pi
          WHERE pi.property_id = p.id
          ORDER BY pi.id ASC LIMIT 1
        ) AS image_url
      FROM properties p
      WHERE ${where}
      ORDER BY p.id DESC
      `,
      params
    );

    // shape images like your frontend expects: images:[{url:...}]
    const data = rows.map(r => ({
      ...r,
      images: r.image_url ? [{ url: r.image_url }] : []
    }));

    res.json(data);
  } catch (err) {
    console.error('SEARCH ERR', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/properties/:id  (details + all images)
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = await getPool();

    const [[prop]] = await pool.query(
      `SELECT id, owner_id, name, type, location, description, amenities,
              price_per_night, bedrooms, bathrooms, max_guests, availability
       FROM properties WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!prop) return res.status(404).json({ error: 'Not found' });

    const [imgs] = await pool.query(
      `SELECT id, url FROM property_images WHERE property_id = ? ORDER BY id ASC`,
      [id]
    );

    res.json({ ...prop, images: imgs });
  } catch (err) {
    console.error('DETAIL ERR', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
