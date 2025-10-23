const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4:uuid } = require('uuid');
const pool = require('../db');
const { requireAuth } = require('../middleware/authGuard');

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (_, file, cb) => cb(null, uuid() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.post('/profile', requireAuth(['TRAVELER']), upload.single('image'), async (req,res)=>{
  await pool.query('UPDATE traveler_profiles SET profile_image_url=? WHERE user_id=?',
    ['/uploads/' + req.file.filename, req.session.user.id]);
  res.json({ url: '/uploads/' + req.file.filename });
});

router.post('/property/:id', requireAuth(['OWNER']), upload.single('image'), async (req,res)=>{
  await pool.query('INSERT INTO property_images(property_id, url) VALUES (?,?)',
    [req.params.id, '/uploads/' + req.file.filename]);
  res.json({ url: '/uploads/' + req.file.filename });
});

module.exports = router;
