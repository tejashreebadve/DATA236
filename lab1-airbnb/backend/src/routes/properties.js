// backend/src/routes/properties.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // <-- must be default export (pool.promise())

/**
 * GET /api/properties/search
 * Query params (all optional):
 *   category=Beachfront|City|Parks|Museums|Hiking
 *   country=USA|Canada|...
 *   q=free text (matches name/description/location/country)
 */
router.get('/search', async (req, res) => {
  try {
    const { category, country, q } = req.query;

    const params = [];
    let sql = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.type,
        p.category,
        p.location,
        p.country,
        p.price_per_night,
        p.bedrooms,
        p.bathrooms,
        p.max_guests,
        -- first image if exists (change table/column names below to match your DB)
        (SELECT i.url
           FROM property_images i
          WHERE i.property_id = p.id
          ORDER BY i.id ASC
          LIMIT 1) AS image_url
      FROM properties p
      WHERE 1=1
    `;

    if (category) {
      sql += ` AND p.category = ?`;
      params.push(category);
    }
    if (country) {
      sql += ` AND p.country = ?`;
      params.push(country);
    }
    if (q) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.location LIKE ? OR p.country LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    sql += ` ORDER BY p.created_at DESC LIMIT 200`;

    const [rows] = await pool.query(sql, params);
    res.json(rows || []);
  } catch (err) {
    console.error('PROPERTIES /search FAILED:', {
      code: err.code, errno: err.errno, sqlState: err.sqlState,
      sqlMessage: err.sqlMessage, message: err.message
    });
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * GET /api/properties/:id
 * Returns one property with an array of image URLs.
 * Adjust table/columns to match your DB.
 */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'bad id' });

    const [[prop]] = await pool.query(
      `SELECT
         p.id,
         p.name,
         p.description,
         p.type,
         p.category,
         p.location,
         p.country,
         p.price_per_night,
         p.bedrooms,
         p.bathrooms,
         p.max_guests
       FROM properties p
       WHERE p.id = ?`,
      [id]
    );
    if (!prop) return res.status(404).json({ error: 'not found' });

    const [imgs] = await pool.query(
      `SELECT url FROM property_images WHERE property_id = ? ORDER BY id ASC`,
      [id]
    );
    prop.images = imgs.map(x => x.url);

    res.json(prop);
  } catch (err) {
    console.error('PROPERTIES /:id FAILED:', {
      code: err.code, errno: err.errno, sqlState: err.sqlState,
      sqlMessage: err.sqlMessage, message: err.message
    });
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
