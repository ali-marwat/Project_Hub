const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all tags with counts
router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM tags ORDER BY count DESC, name ASC',
    [],
    (err, tags) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(tags);
    }
  );
});

// Get projects by tag
router.get('/:tagName/projects', (req, res) => {
  const tagName = req.params.tagName;

  db.all(
    `SELECT p.* FROM projects p
     WHERE p.status = 'approved' 
     AND (p.tags LIKE ? OR p.topics LIKE ?)
     ORDER BY p.submitted_date DESC`,
    [`%${tagName}%`, `%${tagName}%`],
    (err, projects) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(projects);
    }
  );
});

// Get popular tags (tag cloud)
router.get('/cloud/popular', (req, res) => {
  db.all(
    'SELECT name, count FROM tags ORDER BY count DESC LIMIT 30',
    [],
    (err, tags) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(tags);
    }
  );
});

module.exports = router;