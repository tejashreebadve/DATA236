const router = require('express').Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/authGuard');

router.get('/profile', requireAuth(['TRAVELER']), async (req,res)=>{
  const [rows] = await pool.query('SELECT * FROM traveler_profiles WHERE user_id=?',[req.session.user.id]);
  res.json(rows[0] || {});
});

router.put('/profile', requireAuth(['TRAVELER']), async (req,res)=>{
  const fields = ['phone','about_me','city','country','state_abbr','languages','gender','profile_image_url'];
  const updates = fields.map(f => `${f}=?`).join(',');
  const values = fields.map(f => req.body[f] ?? null);
  values.push(req.session.user.id);
  await pool.query(`UPDATE traveler_profiles SET ${updates} WHERE user_id=?`, values);
  res.json({ ok:true });
});

module.exports = router;
