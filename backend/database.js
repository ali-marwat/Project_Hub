const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'showcase.db');
const db = new sqlite3.Database(dbPath);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      username TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      bio TEXT,
      avatar_url TEXT,
      github_username TEXT,
      github_id TEXT UNIQUE,
      location TEXT,
      website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      github_url TEXT NOT NULL,
      description TEXT,
      author TEXT,
      stars INTEGER DEFAULT 0,
      forks INTEGER DEFAULT 0,
      language TEXT,
      topics TEXT,
      tags TEXT,
      screenshots TEXT,
      demo_url TEXT,
      views INTEGER DEFAULT 0,
      created_at TEXT,
      status TEXT DEFAULT 'pending',
      upvotes INTEGER DEFAULT 0,
      submitted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Comments table
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      user_id INTEGER,
      username TEXT NOT NULL,
      comment TEXT NOT NULL,
      comment_html TEXT,
      is_markdown INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      edited_at DATETIME,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Upvotes table
  db.run(`
    CREATE TABLE IF NOT EXISTS upvotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(project_id, user_id)
    )
  `);

  // Bookmarks table
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      project_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      UNIQUE(user_id, project_id)
    )
  `);

  // Project Views table
  db.run(`
    CREATE TABLE IF NOT EXISTS project_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      user_id INTEGER,
      view_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tags table
  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  createDefaultUsers();
});

function createDefaultUsers() {
  db.get('SELECT * FROM users WHERE email = ?', ['admin@showcase.com'], (err, row) => {
    if (!row) {
      const adminPassword = hashPassword('admin123');
      db.run(
        'INSERT INTO users (email, password, username, role, bio) VALUES (?, ?, ?, ?, ?)',
        ['admin@showcase.com', adminPassword, 'Admin', 'admin', 'Platform Administrator'],
        () => console.log('✅ Admin created: admin@showcase.com / admin123')
      );
    }
  });

  db.get('SELECT * FROM users WHERE email = ?', ['demo@student.com'], (err, row) => {
    if (!row) {
      const demoPassword = hashPassword('demo123');
      db.run(
        'INSERT INTO users (email, password, username, role, bio, location) VALUES (?, ?, ?, ?, ?, ?)',
        ['demo@student.com', demoPassword, 'Demo Student', 'user', 'Full-stack developer passionate about web and AI', 'San Francisco, CA'],
        function() {
          console.log('✅ Demo user created: demo@student.com / demo123');
          setTimeout(seedDemoData, 500);
        }
      );
    } else {
      db.get('SELECT COUNT(*) as count FROM projects', (err, row) => {
        if (row && row.count === 0) {
          seedDemoData();
        }
      });
    }
  });
}

function seedDemoData() {
  const projects = [
    // Web Development Projects
    {
      user_id: 2, name: "Portfolio Website", category: "Web Development",
      github_url: "https://github.com/example/portfolio",
      description: "A modern, responsive portfolio website built with HTML, CSS, and JavaScript. Features smooth scrolling, dark mode toggle, and contact form.",
      author: "Demo Student", stars: 45, forks: 12, language: "JavaScript",
      topics: "portfolio, responsive, dark-mode", tags: "html, css, javascript, responsive",
      status: "approved", upvotes: 23, views: 450,
      demo_url: "https://demo-portfolio.netlify.app",
      created_at: "2024-01-15T10:30:00Z"
    },
    {
      user_id: 2, name: "Task Manager App", category: "Web Development",
      github_url: "https://github.com/example/task-manager",
      description: "Full-stack task management application with user authentication, real-time updates, and priority sorting. Built with Node.js and MongoDB.",
      author: "Demo Student", stars: 78, forks: 34, language: "JavaScript",
      topics: "nodejs, mongodb, crud, authentication", tags: "nodejs, mongodb, express, react",
      status: "approved", upvotes: 56, views: 820,
      demo_url: "https://task-manager-demo.herokuapp.com",
      created_at: "2024-02-10T14:20:00Z"
    },
    {
      user_id: 2, name: "Weather Forecast App", category: "Web Development",
      github_url: "https://github.com/example/weather-app",
      description: "Real-time weather application using OpenWeather API. Shows 7-day forecast, hourly updates, and location-based weather with beautiful animations.",
      author: "Demo Student", stars: 92, forks: 28, language: "JavaScript",
      topics: "api, weather, geolocation", tags: "api, javascript, react, weather",
      status: "approved", upvotes: 67, views: 1100,
      demo_url: null, created_at: "2024-01-28T09:15:00Z"
    },
    {
      user_id: 2, name: "E-Commerce Platform", category: "Web Development",
      github_url: "https://github.com/example/ecommerce",
      description: "Full-featured online store with shopping cart, payment integration using Stripe, product search, and admin dashboard for inventory management.",
      author: "Demo Student", stars: 156, forks: 67, language: "JavaScript",
      topics: "ecommerce, stripe, shopping", tags: "react, nodejs, stripe, ecommerce",
      status: "approved", upvotes: 89, views: 1450,
      demo_url: "https://shop-demo.vercel.app",
      created_at: "2024-02-20T11:00:00Z"
    },

    // AI/ML Projects
    {
      user_id: 2, name: "Image Classifier AI", category: "AI/ML",
      github_url: "https://github.com/example/image-classifier",
      description: "Deep learning model for image classification using TensorFlow. Trained on 10,000+ images with 95% accuracy. Includes web interface for real-time predictions.",
      author: "Demo Student", stars: 134, forks: 45, language: "Python",
      topics: "machine-learning, tensorflow, computer-vision", tags: "python, tensorflow, ai, cnn",
      status: "approved", upvotes: 78, views: 980,
      demo_url: null, created_at: "2024-02-15T16:45:00Z"
    },
    {
      user_id: 2, name: "Sentiment Analysis Bot", category: "AI/ML",
      github_url: "https://github.com/example/sentiment-bot",
      description: "NLP-based sentiment analysis tool for social media posts. Uses BERT model to classify emotions with 92% accuracy. Twitter API integration included.",
      author: "Demo Student", stars: 98, forks: 32, language: "Python",
      topics: "nlp, sentiment-analysis, bert", tags: "python, nlp, bert, twitter",
      status: "approved", upvotes: 54, views: 720,
      demo_url: null, created_at: "2024-03-05T11:30:00Z"
    },
    {
      user_id: 2, name: "ChatBot Assistant", category: "AI/ML",
      github_url: "https://github.com/example/chatbot",
      description: "Intelligent chatbot using GPT-based architecture. Can answer questions, provide recommendations, and learn from conversations. Built with Python and PyTorch.",
      author: "Demo Student", stars: 203, forks: 78, language: "Python",
      topics: "chatbot, gpt, nlp", tags: "python, gpt, nlp, ai, pytorch",
      status: "approved", upvotes: 145, views: 2100,
      demo_url: null, created_at: "2024-01-20T14:00:00Z"
    },

    // Game Development Projects
    {
      user_id: 2, name: "2D Platformer Game", category: "Game Development",
      github_url: "https://github.com/example/platformer-game",
      description: "Retro-style platformer with 15 levels, power-ups, and boss battles. Built with Unity and C#. Features custom pixel art and chiptune music.",
      author: "Demo Student", stars: 167, forks: 56, language: "C#",
      topics: "unity, game-dev, platformer, 2d", tags: "unity, csharp, game-dev, 2d",
      status: "approved", upvotes: 124, views: 1750,
      demo_url: "https://platformer-game.itch.io",
      created_at: "2024-01-10T13:00:00Z"
    },
    {
      user_id: 2, name: "Puzzle Quest RPG", category: "Game Development",
      github_url: "https://github.com/example/puzzle-quest",
      description: "Match-3 puzzle game with RPG elements. Character progression, daily challenges, and multiplayer mode. Built with Godot Engine.",
      author: "Demo Student", stars: 143, forks: 41, language: "GDScript",
      topics: "godot, puzzle, rpg, multiplayer", tags: "godot, game-dev, puzzle, rpg",
      status: "approved", upvotes: 98, views: 1320,
      demo_url: null, created_at: "2024-02-14T15:20:00Z"
    },

    // Mobile App Projects
    {
      user_id: 2, name: "Fitness Tracker", category: "Mobile App",
      github_url: "https://github.com/example/fitness-tracker",
      description: "Cross-platform fitness app with workout plans, calorie counter, progress charts, and social features. Built with React Native and Firebase.",
      author: "Demo Student", stars: 189, forks: 67, language: "JavaScript",
      topics: "react-native, firebase, fitness", tags: "react-native, firebase, mobile, health",
      status: "approved", upvotes: 112, views: 1580,
      demo_url: null, created_at: "2024-03-01T10:00:00Z"
    },
    {
      user_id: 2, name: "Recipe Sharing App", category: "Mobile App",
      github_url: "https://github.com/example/recipe-app",
      description: "Social recipe platform with photo uploads, ingredient lists, cooking timers, and user ratings. Features cloud sync and offline mode. Built with Flutter.",
      author: "Demo Student", stars: 145, forks: 38, language: "Dart",
      topics: "flutter, firebase, recipes, social", tags: "flutter, dart, firebase, mobile",
      status: "approved", upvotes: 87, views: 1240,
      demo_url: null, created_at: "2024-01-25T14:30:00Z"
    },

    // Other Category Projects
    {
      user_id: 2, name: "Blockchain Voting System", category: "Other",
      github_url: "https://github.com/example/blockchain-voting",
      description: "Decentralized voting system using Ethereum smart contracts. Ensures transparency, prevents fraud, and maintains voter anonymity. Includes web interface.",
      author: "Demo Student", stars: 234, forks: 89, language: "Solidity",
      topics: "blockchain, ethereum, smart-contracts", tags: "blockchain, ethereum, solidity, web3",
      status: "approved", upvotes: 178, views: 2400,
      demo_url: null, created_at: "2024-01-20T16:00:00Z"
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO projects (user_id, name, category, github_url, description, author, stars, forks, 
    language, topics, tags, status, upvotes, views, demo_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  projects.forEach(p => {
    stmt.run(p.user_id, p.name, p.category, p.github_url, p.description, p.author,
      p.stars, p.forks, p.language, p.topics, p.tags, p.status, p.upvotes, p.views,
      p.demo_url, p.created_at);
  });

  stmt.finalize(() => {
    console.log('✅ 12 demo projects seeded successfully!');
    seedDemoComments();
  });
}

function seedDemoComments() {
  const comments = [
    { project_id: 1, user_id: 2, username: "Demo Student", comment: "Love the clean design! The dark mode is perfect." },
    { project_id: 1, user_id: 2, username: "Demo Student", comment: "This helped me learn responsive design. Thank you!" },
    { project_id: 2, user_id: 2, username: "Demo Student", comment: "Great use of MongoDB. The authentication is solid." },
    { project_id: 3, user_id: 2, username: "Demo Student", comment: "The animations are so smooth! How did you do that?" },
    { project_id: 4, user_id: 2, username: "Demo Student", comment: "Best e-commerce tutorial I've found. Great documentation!" },
    { project_id: 5, user_id: 2, username: "Demo Student", comment: "Impressive accuracy! What dataset did you use for training?" },
    { project_id: 6, user_id: 2, username: "Demo Student", comment: "The BERT implementation is excellent. Works really well!" },
    { project_id: 7, user_id: 2, username: "Demo Student", comment: "This chatbot is amazing! Very natural conversations." },
    { project_id: 8, user_id: 2, username: "Demo Student", comment: "Nostalgic gameplay! The pixel art is beautiful." },
    { project_id: 9, user_id: 2, username: "Demo Student", comment: "Addictive puzzle mechanics. Love the RPG elements!" },
    { project_id: 10, user_id: 2, username: "Demo Student", comment: "Using this daily! The UI is very intuitive." },
    { project_id: 11, user_id: 2, username: "Demo Student", comment: "Great recipe collection. The timer feature is super helpful." },
    { project_id: 12, user_id: 2, username: "Demo Student", comment: "Revolutionary concept! Smart contract implementation is solid." }
  ];

  const stmt = db.prepare(`
    INSERT INTO comments (project_id, user_id, username, comment)
    VALUES (?, ?, ?, ?)
  `);

  comments.forEach(c => {
    stmt.run(c.project_id, c.user_id, c.username, c.comment);
  });

  stmt.finalize(() => {
    console.log('✅ Demo comments added!');
  });
}

module.exports = db;
module.exports.hashPassword = hashPassword;