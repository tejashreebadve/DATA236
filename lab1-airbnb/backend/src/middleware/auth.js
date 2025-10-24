// src/middleware/auth.js
module.exports.requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'auth required' });
  next();
};

module.exports.requireOwner = (req, res, next) => {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'auth required' });
  if (req.session.user.role !== 'OWNER') return res.status(403).json({ error: 'owner only' });
  next();
};
