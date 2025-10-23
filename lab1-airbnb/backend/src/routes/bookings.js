const express = require('express');
const router = express.Router();
const { getPool } = require('../db');

function needAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// POST /api/bookings  { propertyId, checkIn, checkOut, guests }
router.post('/', needAuth, async (req,res)=>{
  try {
    const { propertyId, checkIn, checkOut, guests } = req.body;
    if (!propertyId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const pool = await getPool();

    // naive overlap check example (optional)
    const [overlaps] = await pool.query(
      `SELECT 1 FROM bookings
       WHERE property_id=? AND status IN ('REQUESTED','APPROVED')
       AND NOT (check_out <= ? OR check_in >= ?) LIMIT 1`,
      [propertyId, checkIn, checkOut]
    );
    if (overlaps.length) {
      return res.status(409).json({ error: 'Dates not available' });
    }

    const [r] = await pool.query(
      `INSERT INTO bookings (user_id, property_id, check_in, check_out, guests)
       VALUES (?,?,?,?,?)`,
      [req.session.user.id, propertyId, checkIn, checkOut, guests]
    );
    res.json({ ok:true, bookingId: r.insertId });
  } catch (e) {
    console.error('BOOK ERR', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
