const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'student-showcase-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Serve static files
// Serve static files with NO CACHE
app.use(express.static(path.join(__dirname, '../frontend'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import database
require('./database');

// Import routes
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const adminRouter = require('./routes/admin');
const profileRouter = require('./routes/profile');
const bookmarksRouter = require('./routes/bookmarks');
const analyticsRouter = require('./routes/analytics');
const tagsRouter = require('./routes/tags');

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/profile', profileRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/github', require('./routes/github'));

// Root route - serve login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, 'uploads')}`);
});