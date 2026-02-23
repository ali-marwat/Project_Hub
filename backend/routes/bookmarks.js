const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

// Get user's bookmarks
router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT p.* FROM projects p
     INNER JOIN bookmarks b ON p.id = b.project_id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC`,
    [userId],
    (err, bookmarks) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(bookmarks);
    }
  );
});

// Add bookmark
router.post('/:projectId', requireAuth, (req, res) => {
  const userId = req.user.id;
  const projectId = req.params.projectId;

  db.run(
    'INSERT INTO bookmarks (user_id, project_id) VALUES (?, ?)',
    [userId, projectId],
    (err) => {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Already bookmarked' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Bookmark added' });
    }
  );
});

// Remove bookmark
router.delete('/:projectId', requireAuth, (req, res) => {
  const userId = req.user.id;
  const projectId = req.params.projectId;

  db.run(
    'DELETE FROM bookmarks WHERE user_id = ? AND project_id = ?',
    [userId, projectId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Bookmark not found' });
      }
      res.json({ message: 'Bookmark removed' });
    }
  );
});

// Check if project is bookmarked
router.get('/check/:projectId', requireAuth, (req, res) => {
  const userId = req.user.id;
  const projectId = req.params.projectId;

  db.get(
    'SELECT * FROM bookmarks WHERE user_id = ? AND project_id = ?',
    [userId, projectId],
    (err, bookmark) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ bookmarked: !!bookmark });
    }
  );
});

module.exports = router;