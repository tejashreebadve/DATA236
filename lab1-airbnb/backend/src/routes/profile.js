// backend/src/routes/profile.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

function requireAuth(req,res,next){ if(!req.session?.user) return res.status(401).json({error:'auth required'}); next(); }

const uploadDir = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

/**
 * GET /api/profile/me
 * Returns current user details (adaptive: only returns columns that exist)
 */
router.get('/me', requireAuth, async (req,res)=>{
  try{
    const uid = req.session.user.id;
    const [rows] = await pool.query("SELECT * FROM users WHERE id=? LIMIT 1", [uid]);
    if(!rows.length) return res.status(404).json({ error:'not found' });
    const u = rows[0];
    res.json({
      id: u.id,
      role: u.role,
      name: u.name,
      email: u.email,
      phone: u.phone ?? null,
      about: u.about ?? null,
      city: u.city ?? null,
      state: u.state ?? null,
      country: u.country ?? null,
      languages: u.languages ?? null,
      gender: u.gender ?? null,
      avatar: u.avatar ?? null,
    });
  }catch(e){
    console.error('PROFILE /me', e);
    res.status(500).json({ error:'Internal error' });
  }
});

/**
 * PUT /api/profile/me
 * Updates any of: name,email,phone,about,city,state,country,languages,gender
 */
router.put('/me', requireAuth, async (req,res)=>{
  try{
    const uid = req.session.user.id;
    const allowed = ['name','email','phone','about','city','state','country','languages','gender'];
    const fields = [];
    const params = [];
    for(const k of allowed){
      if(Object.prototype.hasOwnProperty.call(req.body,k)){
        fields.push(`${k}=?`);
        params.push(req.body[k]);
      }
    }
    if(!fields.length) return res.json({ ok:true });
    params.push(uid);
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, params);
    res.json({ ok:true });
  }catch(e){
    console.error('PROFILE PUT', e);
    res.status(500).json({ error:'Internal error' });
  }
});

/**
 * POST /api/profile/avatar
 * multipart/form-data: file
 */
router.post('/avatar', requireAuth, upload.single('file'), async (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({ error:'file required' });
    const rel = `/uploads/avatars/${path.basename(req.file.path)}`;
    await pool.execute("UPDATE users SET avatar=? WHERE id=?", [rel, req.session.user.id]);
    res.json({ ok:true, avatar: rel });
  }catch(e){
    console.error('PROFILE AVATAR', e);
    res.status(500).json({ error:'Internal error' });
  }
});

module.exports = router;
