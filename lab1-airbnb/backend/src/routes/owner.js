const router = require('express').Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/authGuard');

router.get('/profile', requireAuth(['OWNER']), async (req,res)=>{
  const [rows] = await pool.query('SELECT * FROM owner_profiles WHERE user_id=?',[req.session.user.id]);
  res.json(rows[0] || {});
});

router.put('/profile', requireAuth(['OWNER']), async (req,res)=>{
  const { location, contact_info, images } = req.body;
  await pool.query('UPDATE owner_profiles SET location=?, contact_info=?, images=? WHERE user_id=?',
    [location||'', contact_info||'', JSON.stringify(images||null), req.session.user.id]);
  res.json({ ok:true });
});

module.exports = router;
