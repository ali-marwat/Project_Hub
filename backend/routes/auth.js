const express = require('express');
const router = express.Router();
const db = require('../database');
const { hashPassword } = require('../database');

router.post('/register', (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'All fields required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (user) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = hashPassword(password);

    db.run(
      'INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, username, 'user'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          message: 'Registration successful',
          user: { id: this.lastID, email, username, role: 'user' }
        });
      }
    );
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const hashedPassword = hashPassword(password);

  db.get(
    'SELECT id, email, username, role, bio, avatar_url FROM users WHERE email = ? AND password = ?',
    [email, hashedPassword],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      res.json({ message: 'Login successful', user });
    }
  );
});

module.exports = router;