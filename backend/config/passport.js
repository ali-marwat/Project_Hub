const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const db = require('../database');

// GitHub OAuth Configuration
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'YOUR_GITHUB_CLIENT_SECRET',
    callbackURL: "http://localhost:3000/api/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // Check if user exists with this GitHub ID
    db.get('SELECT * FROM users WHERE github_id = ?', [profile.id], (err, user) => {
      if (err) return done(err);

      if (user) {
        // User exists, update their info
        db.run(
          `UPDATE users SET 
            github_username = ?,
            avatar_url = ?,
            username = ?,
            email = ?
          WHERE github_id = ?`,
          [profile.username, profile.photos[0]?.value, profile.displayName || profile.username, profile.emails[0]?.value || `${profile.username}@github.com`, profile.id],
          () => {
            return done(null, user);
          }
        );
      } else {
        // Create new user
        db.run(
          `INSERT INTO users (email, username, github_id, github_username, avatar_url, role)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            profile.emails[0]?.value || `${profile.username}@github.com`,
            profile.displayName || profile.username,
            profile.id,
            profile.username,
            profile.photos[0]?.value,
            'user'
          ],
          function(err) {
            if (err) return done(err);
            
            db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
              return done(null, newUser);
            });
          }
        );
      }
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

module.exports = passport;