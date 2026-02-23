const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get user profile by ID
router.get('/:userId', (req, res) => {
  const userId = req.params.userId;

  db.get(
    'SELECT id, email, username, role, bio, avatar_url, github_username, location, website, created_at FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's approved projects
      db.all(
        'SELECT * FROM projects WHERE user_id = ? AND status = "approved" ORDER BY submitted_date DESC',
        [userId],
        (err, projects) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get user stats
          db.get(
            `SELECT 
              COUNT(*) as total_projects,
              SUM(upvotes) as total_upvotes,
              SUM(views) as total_views
            FROM projects 
            WHERE user_id = ? AND status = "approved"`,
            [userId],
            (err, stats) => {
              res.json({
                user,
                projects,
                stats: stats || { total_projects: 0, total_upvotes: 0, total_views: 0 }
              });
            }
          );
        }
      );
    }
  );
});

// Update user profile
router.put('/update', requireAuth, (req, res) => {
  const { username, bio, location, website } = req.body;
  const userId = req.user.id;

  db.run(
    'UPDATE users SET username = ?, bio = ?, location = ?, website = ? WHERE id = ?',
    [username, bio, location, website, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Upload avatar
router.post('/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  db.run(
    'UPDATE users SET avatar_url = ? WHERE id = ?',
    [avatarUrl, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Avatar updated', avatar_url: avatarUrl });
    }
  );
});

module.exports = router;