const express = require('express');
const router = express.Router();
const db = require('../database');
const { scrapeGitHubRepo } = require('../utils/githubScraper');
const { requireAuth } = require('../middleware/auth');

router.get('/', (req, res) => {
  const category = req.query.category;
  let query = 'SELECT * FROM projects WHERE status = "approved"';
  const params = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY submitted_date DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

router.get('/my-projects', requireAuth, (req, res) => {
  const userId = req.user.id;

  db.all(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY submitted_date DESC',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const approved = rows.filter(p => p.status === 'approved');
      const pending = rows.filter(p => p.status === 'pending');

      res.json({ approved, pending });
    }
  );
});

router.get('/:id', (req, res) => {
  const projectId = req.params.id;
  const userId = req.headers['user-id'];

  db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.all(
      'SELECT * FROM comments WHERE project_id = ? ORDER BY created_at DESC',
      [projectId],
      (err, comments) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (userId) {
          db.get('SELECT * FROM upvotes WHERE project_id = ? AND user_id = ?',
            [projectId, userId],
            (err, upvote) => {
              db.get('SELECT * FROM bookmarks WHERE project_id = ? AND user_id = ?',
                [projectId, userId],
                (err, bookmark) => {
                  res.json({
                    ...project,
                    comments,
                    userHasUpvoted: !!upvote,
                    userHasBookmarked: !!bookmark
                  });
                }
              );
            }
          );
        } else {
          res.json({ ...project, comments, userHasUpvoted: false, userHasBookmarked: false });
        }
      }
    );
  });
});

router.post('/submit', requireAuth, async (req, res) => {
  const { name, category, github_url, description } = req.body;
  const userId = req.user.id;

  try {
    const githubData = await scrapeGitHubRepo(github_url);

    db.run(
      `INSERT INTO projects (user_id, name, category, github_url, description, author, stars, forks, language, topics, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name || githubData.name, category, github_url, description || githubData.description,
        githubData.author, githubData.stars, githubData.forks, githubData.language,
        githubData.topics, githubData.created_at],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Project submitted for approval', id: this.lastID });
      }
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/upvote', requireAuth, (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  db.get('SELECT * FROM upvotes WHERE project_id = ? AND user_id = ?',
    [projectId, userId],
    (err, row) => {
      if (row) {
        return res.status(400).json({ error: 'Already upvoted' });
      }

      db.run('INSERT INTO upvotes (project_id, user_id) VALUES (?, ?)',
        [projectId, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          db.run('UPDATE projects SET upvotes = upvotes + 1 WHERE id = ?',
            [projectId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ message: 'Upvoted successfully' });
            }
          );
        }
      );
    }
  );
});

router.delete('/:id/upvote', requireAuth, (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  db.run('DELETE FROM upvotes WHERE project_id = ? AND user_id = ?',
    [projectId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(400).json({ error: 'Upvote not found' });
      }

      db.run('UPDATE projects SET upvotes = upvotes - 1 WHERE id = ?',
        [projectId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Upvote removed' });
        }
      );
    }
  );
});

router.post('/:id/comment', requireAuth, (req, res) => {
  const projectId = req.params.id;
  const { comment } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  db.run(
    'INSERT INTO comments (project_id, user_id, username, comment) VALUES (?, ?, ?, ?)',
    [projectId, userId, username, comment],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Comment added', id: this.lastID });
    }
  );
});

router.delete('/comment/:commentId', requireAuth, (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (isAdmin) {
    db.run('DELETE FROM comments WHERE id = ?', [commentId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Comment deleted' });
    });
  } else {
    db.run('DELETE FROM comments WHERE id = ? AND user_id = ?',
      [commentId, userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(403).json({ error: 'Cannot delete this comment' });
        }
        res.json({ message: 'Comment deleted' });
      }
    );
  }
});

module.exports = router;