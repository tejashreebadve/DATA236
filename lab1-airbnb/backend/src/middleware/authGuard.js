module.exports.requireAuth = (roles=[]) => (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  if (roles.length && !roles.includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
