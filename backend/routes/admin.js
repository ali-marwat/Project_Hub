const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAdmin } = require('../middleware/auth');

router.get('/projects/pending', requireAdmin, (req, res) => {
  db.all(
    'SELECT * FROM projects WHERE status = "pending" ORDER BY submitted_date DESC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

router.post('/projects/:id/approve', requireAdmin, (req, res) => {
  const projectId = req.params.id;

  db.run('UPDATE projects SET status = "approved" WHERE id = ?',
    [projectId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Project approved' });
    }
  );
});

router.post('/projects/:id/reject', requireAdmin, (req, res) => {
  const projectId = req.params.id;

  db.run('UPDATE projects SET status = "rejected" WHERE id = ?',
    [projectId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Project rejected' });
    }
  );
});

module.exports = router;