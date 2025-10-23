const router = require('express').Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/authGuard');

router.post('/:propertyId', requireAuth(['TRAVELER']), async (req,res)=>{
  await pool.query('REPLACE INTO favorites(traveler_id, property_id) VALUES (?,?)',
    [req.session.user.id, req.params.propertyId]);
  res.json({ ok:true });
});

router.delete('/:propertyId', requireAuth(['TRAVELER']), async (req,res)=>{
  await pool.query('DELETE FROM favorites WHERE traveler_id=? AND property_id=?',
    [req.session.user.id, req.params.propertyId]);
  res.json({ ok:true });
});

router.get('/', requireAuth(['TRAVELER']), async (req,res)=>{
  const [rows] = await pool.query(
    `SELECT p.* FROM favorites f JOIN properties p ON p.id=f.property_id WHERE f.traveler_id=?`,
    [req.session.user.id]
  );
  res.json(rows);
});

module.exports = router;
