// backend/src/routes/bookings.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

function requireAuth(req,res,next){ if(!req.session?.user) return res.status(401).json({error:'auth required'}); next(); }

const STATUS = { PENDING:'PENDING', ACCEPTED:'ACCEPTED', CANCELLED:'CANCELLED' };

// Traveler creates booking (PENDING)
router.post('/', requireAuth, async (req,res)=>{
  try{
    const uid = req.session.user.id;
    const { propertyId, guests, startDate, endDate, checkIn, checkOut } = req.body || {};
    const start = startDate || checkIn;
    const end = endDate || checkOut;
    if(!propertyId || !start || !end || !guests) return res.status(400).json({ error:'propertyId, dates, guests required' });

    const [[p]] = await pool.query('SELECT id,max_guests FROM properties WHERE id=?', [propertyId]);
    if(!p) return res.status(404).json({ error:'property not found' });
    if(p.max_guests && Number(guests) > p.max_guests) return res.status(400).json({ error:`Max guests ${p.max_guests}` });

    // refuse overlap with ACCEPTED bookings
    const [over] = await pool.query(`
      SELECT 1 FROM bookings
      WHERE property_id=?
        AND status='ACCEPTED'
        AND NOT (end_date <= ? OR start_date >= ?)
      LIMIT 1
    `, [propertyId, start, end]);
    if(over.length) return res.status(400).json({ error:'Dates not available' });

    const [r] = await pool.execute(`
      INSERT INTO bookings (property_id, traveler_id, start_date, end_date, guests, status)
      VALUES (?,?,?,?,?, 'PENDING')
    `, [propertyId, uid, start, end, Number(guests)]);
    res.status(201).json({ ok:true, bookingId: r.insertId });
  }catch(e){
    console.error('BOOKINGS POST', e);
    res.status(500).json({ error:'Booking failed' });
  }
});

// Traveler: my bookings (pending/accepted/cancelled)
router.get('/mine', requireAuth, async (req,res)=>{
  try{
    const uid = req.session.user.id;
    const [rows] = await pool.query(`
      SELECT b.*, p.name AS property_name, p.location, p.country
      FROM bookings b JOIN properties p ON p.id=b.property_id
      WHERE b.traveler_id=?
      ORDER BY b.start_date DESC
    `, [uid]);
    res.json(rows||[]);
  }catch(e){
    console.error('BOOKINGS /mine', e);
    res.status(500).json({ error:'Internal error' });
  }
});

// Owner: incoming + previous
router.get('/owner', requireAuth, async (req,res)=>{
  try{
    if(req.session.user.role!=='OWNER') return res.status(403).json({ error:'owner only' });
    const uid = req.session.user.id;
    const [rows] = await pool.query(`
      SELECT b.*, p.name AS property_name, u.name AS traveler_name, u.email AS traveler_email
      FROM bookings b
      JOIN properties p ON p.id=b.property_id
      JOIN users u ON u.id=b.traveler_id
      WHERE p.owner_id=?
      ORDER BY b.start_date ASC
    `, [uid]);
    res.json(rows||[]);
  }catch(e){
    console.error('BOOKINGS /owner', e);
    res.status(500).json({ error:'Internal error' });
  }
});

// Owner: accept
router.post('/:id/accept', requireAuth, async (req,res)=>{
  try{
    if(req.session.user.role!=='OWNER') return res.status(403).json({ error:'owner only' });
    const id = Number(req.params.id);
    // ensure this booking belongs to one of the owner's properties
    const [[row]] = await pool.query(`
      SELECT b.id, b.property_id, b.start_date, b.end_date
      FROM bookings b JOIN properties p ON p.id=b.property_id
      WHERE b.id=? AND p.owner_id=?
    `, [id, req.session.user.id]);
    if(!row) return res.status(404).json({ error:'not found' });

    // refuse overlap with other ACCEPTED bookings
    const [over] = await pool.query(`
      SELECT 1 FROM bookings
      WHERE property_id=?
        AND status='ACCEPTED'
        AND id<>?
        AND NOT (end_date <= ? OR start_date >= ?)
      LIMIT 1
    `, [row.property_id, id, row.start_date, row.end_date]);
    if(over.length) return res.status(400).json({ error:'Dates now blocked' });

    await pool.execute(`UPDATE bookings SET status='ACCEPTED' WHERE id=?`, [id]);
    res.json({ ok:true });
  }catch(e){
    console.error('BOOKINGS accept', e);
    res.status(500).json({ error:'Internal error' });
  }
});

// Owner/Traveler: cancel
router.post('/:id/cancel', requireAuth, async (req,res)=>{
  try{
    const id = Number(req.params.id);
    // owner can cancel if owns property; traveler can cancel if owns booking
    const uid = req.session.user.id;
    const role = req.session.user.role;

    if(role==='OWNER'){
      const [[row]] = await pool.query(`
        SELECT b.id
        FROM bookings b JOIN properties p ON p.id=b.property_id
        WHERE b.id=? AND p.owner_id=?`, [id, uid]);
      if(!row) return res.status(403).json({ error:'not owner' });
    } else {
      const [[row]] = await pool.query(`SELECT id FROM bookings WHERE id=? AND traveler_id=?`, [id, uid]);
      if(!row) return res.status(403).json({ error:'not traveler' });
    }
    await pool.execute(`UPDATE bookings SET status='CANCELLED' WHERE id=?`, [id]);
    res.json({ ok:true });
  }catch(e){
    console.error('BOOKINGS cancel', e);
    res.status(500).json({ error:'Internal error' });
  }
});

module.exports = router;
