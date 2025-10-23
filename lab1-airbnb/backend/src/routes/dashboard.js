const router = require('express').Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/authGuard');

router.get('/traveler', requireAuth(['TRAVELER']), async (req,res)=>{
  const [history] = await pool.query(
    `SELECT * FROM bookings WHERE traveler_id=? ORDER BY created_at DESC`,
    [req.session.user.id]
  );
  const [fav] = await pool.query(
    `SELECT p.* FROM favorites f JOIN properties p ON p.id=f.property_id WHERE f.traveler_id=?`,
    [req.session.user.id]
  );
  res.json({ history, favorites: fav });
});

router.get('/owner', requireAuth(['OWNER']), async (req,res)=>{
  const [prev] = await pool.query(
    `SELECT b.*, p.name AS property_name FROM bookings b
     JOIN properties p ON p.id=b.property_id
     WHERE p.owner_id=? AND b.status IN ('ACCEPTED','CANCELLED')
     ORDER BY b.created_at DESC`,
    [req.session.user.id]
  );
  const [incoming] = await pool.query(
    `SELECT b.*, p.name AS property_name FROM bookings b
     JOIN properties p ON p.id=b.property_id
     WHERE p.owner_id=? AND b.status='PENDING'
     ORDER BY b.created_at DESC`,
    [req.session.user.id]
  );
  res.json({ previous: prev, incoming });
});

module.exports = router;
