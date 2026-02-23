const db = require('../database');

function requireAuth(req, res, next) {
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = user;
    next();
  });
}

module.exports = { requireAuth, requireAdmin };