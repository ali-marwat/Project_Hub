const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

// Record project view
router.post('/view/:projectId', requireAuth, (req, res) => {
  const userId = req.user.id;
  const projectId = req.params.projectId;
  const today = new Date().toISOString().split('T')[0];

  // Check if already viewed today
  db.get(
    'SELECT * FROM project_views WHERE project_id = ? AND user_id = ? AND view_date = ?',
    [projectId, userId, today],
    (err, view) => {
      if (view) {
        return res.json({ message: 'Already counted today' });
      }

      // Add view record
      db.run(
        'INSERT INTO project_views (project_id, user_id, view_date) VALUES (?, ?, ?)',
        [projectId, userId, today],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Update project view count
          db.run(
            'UPDATE projects SET views = views + 1 WHERE id = ?',
            [projectId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ message: 'View recorded' });
            }
          );
        }
      );
    }
  );
});

// Get trending projects (most viewed in last 7 days)
router.get('/trending', (req, res) => {
  db.all(
    `SELECT p.*, COUNT(pv.id) as recent_views
     FROM projects p
     LEFT JOIN project_views pv ON p.id = pv.project_id 
       AND pv.created_at >= datetime('now', '-7 days')
     WHERE p.status = 'approved'
     GROUP BY p.id
     ORDER BY recent_views DESC, p.upvotes DESC
     LIMIT 10`,
    [],
    (err, projects) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(projects);
    }
  );
});

// Get popular projects (most upvoted)
router.get('/popular', (req, res) => {
  db.all(
    `SELECT * FROM projects 
     WHERE status = 'approved'
     ORDER BY upvotes DESC, views DESC
     LIMIT 10`,
    [],
    (err, projects) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(projects);
    }
  );
});

// Get project analytics
router.get('/project/:projectId', requireAuth, (req, res) => {
  const projectId = req.params.projectId;

  // Get daily views for last 30 days
  db.all(
    `SELECT view_date, COUNT(*) as views
     FROM project_views
     WHERE project_id = ? AND view_date >= date('now', '-30 days')
     GROUP BY view_date
     ORDER BY view_date ASC`,
    [projectId],
    (err, dailyViews) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get total stats
      db.get(
        `SELECT 
          views,
          upvotes,
          (SELECT COUNT(*) FROM comments WHERE project_id = ?) as comment_count,
          (SELECT COUNT(*) FROM bookmarks WHERE project_id = ?) as bookmark_count
        FROM projects WHERE id = ?`,
        [projectId, projectId, projectId],
        (err, stats) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ dailyViews, stats });
        }
      );
    }
  );
});

module.exports = router;