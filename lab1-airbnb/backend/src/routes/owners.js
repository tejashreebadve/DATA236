// backend/src/routes/owners.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

function requireOwner(req,res,next){
  const u=req.session?.user;
  if(!u) return res.status(401).json({error:'auth required'});
  if(u.role!=='OWNER') return res.status(403).json({error:'owner only'});
  next();
}

// owner properties
router.get('/me/properties', requireOwner, async (req,res)=>{
  try{
    const uid = req.session.user.id;
    const [rows] = await pool.query(`
      SELECT p.*, (SELECT url FROM property_images i WHERE i.property_id=p.id ORDER BY id ASC LIMIT 1) AS image_url
      FROM properties p WHERE p.owner_id=? ORDER BY p.created_at DESC
    `, [uid]);
    res.json(rows||[]);
  }catch(e){
    console.error('OWN props', e);
    res.status(500).json({ error:'Internal error' });
  }
});

// owner bookings (incoming + previous)
router.get('/me/bookings', requireOwner, async (req,res)=>{
  try{
    const uid = req.session.user.id;
    const [rows] = await pool.query(`
      SELECT b.*, p.name AS property_name, u.name AS traveler_name, u.email AS traveler_email
      FROM bookings b
      JOIN properties p ON p.id=b.property_id
      JOIN users u ON u.id=b.traveler_id
      WHERE p.owner_id=?
      ORDER BY b.start_date DESC
    `, [uid]);
    res.json(rows||[]);
  }catch(e){
    console.error('OWN bookings', e);
    res.status(500).json({ error:'Internal error' });
  }
});

module.exports = router;
