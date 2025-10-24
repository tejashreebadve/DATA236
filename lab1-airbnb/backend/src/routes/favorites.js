// backend/src/routes/favorites.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

function requireAuth(req,res,next){ if(!req.session?.user) return res.status(401).json({error:'auth required'}); next(); }

// add
router.post('/:propertyId', requireAuth, async (req,res)=>{
  try{
    const uid = req.session.user.id;
    const pid = Number(req.params.propertyId);
    await pool.execute(`INSERT IGNORE INTO favorites (traveler_id, property_id) VALUES (?,?)`, [uid, pid]);
    res.json({ ok:true });
  }catch(e){
    console.error('FAV add', e);
    res.status(500).json({ error:'Internal error' });
  }
});

// remove
router.delete('/:propertyId', requireAuth, async (req,res)=>{
  try{
    const uid = req.session.user.id;
    const pid = Number(req.params.propertyId);
    await pool.execute(`DELETE FROM favorites WHERE traveler_id=? AND property_id=?`, [uid, pid]);
    res.json({ ok:true });
  }catch(e){
    console.error('FAV del', e);
    res.status(500).json({ error:'Internal error' });
  }
});

// list
router.get('/mine', requireAuth, async (req,res)=>{
  try{
    const uid = req.session.user.id;
    const [rows] = await pool.query(`
      SELECT p.*, (SELECT url FROM property_images i WHERE i.property_id=p.id ORDER BY id ASC LIMIT 1) AS image_url
      FROM favorites f JOIN properties p ON p.id=f.property_id
      WHERE f.traveler_id=?
    `, [uid]);
    res.json(rows||[]);
  }catch(e){
    console.error('FAV mine', e);
    res.status(500).json({ error:'Internal error' });
  }
});

module.exports = router;
