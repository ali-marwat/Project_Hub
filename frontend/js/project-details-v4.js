var API_URL = CONFIG.API_URL;
var urlParams = new URLSearchParams(window.location.search);
var projectId = urlParams.get('id');
var currentUser = null;
var currentProject = null;

document.addEventListener('DOMContentLoaded', function () {
  console.log("PROJECT DETAILS V4 LOADED");
  // alert("DEBUG: Version 4 Loaded!"); 
  checkAuth();

  // Set up backlink to Dashboard
  var fromTab = urlParams.get('from');
  if (fromTab) {
    var dashLink = document.getElementById('navDashboardLink');
    if (dashLink) {
      dashLink.href = 'dashboard.html?from=' + fromTab;
    }
  }

  loadProjectDetails();
  document.getElementById('commentForm').addEventListener('submit', postComment);
});

function checkAuth() {
  var userData = localStorage.getItem('currentUser');

  if (!userData) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = JSON.parse(userData);

  var greetingElement = document.getElementById('userGreeting');
  if (greetingElement) {
    greetingElement.textContent = 'Hello, ' + currentUser.username + '!';
  }

  // Load GitHub avatar into header
  var avatarEl = document.getElementById('userAvatar');
  if (avatarEl) {
    var photoUrl = currentUser.photoUrl || currentUser.photoURL || '';
    if (photoUrl) {
      avatarEl.src = photoUrl;
      avatarEl.style.display = 'inline-block';
    } else {
      avatarEl.src = 'https://github.com/' + encodeURIComponent(currentUser.username) + '.png?size=48';
      avatarEl.style.display = 'inline-block';
      avatarEl.onerror = function() { this.style.display = 'none'; };
    }
  }

  var adminLink = document.getElementById('adminLink');
  if (adminLink && currentUser.role === 'admin') {
    adminLink.style.display = 'inline-block';
  }
}

function loadProjectDetails() {
  // Load Project Details from 'projects' collection (matching Android repo code)
  db.collection('projects').doc(projectId).onSnapshot(function (doc) {
    if (!doc.exists) {
      showNotification('Project not found', 'error');
      window.location.href = 'index.html';
      return;
    }
    currentProject = { ...doc.data(), id: doc.id };

    // Check if user has liked (likes is a list of user IDs in Android model)
    const userLikes = currentProject.likes || [];
    currentProject.userHasUpvoted = userLikes.includes(currentUser.id);

    renderProjectV4(currentProject);
    displayComments(currentProject.comments || []);
  }, function (error) {
    console.error('Error loading project details:', error);
  });
}

// function loadProjectDetails() needs to be updated too, to call this async or handle it.
// Actually, let's update displayProject to be async or fetch inside it.
// Better: Update loadProjectDetails to fetch user data.

async function renderProjectV4(project) {
  console.log("Rendering Project V4:", project); // Debug log
  var html = '';
  html += '<h1>' + (project.name || 'Untitled') + '</h1>';
  html += '<p><strong>Category:</strong> ' + (project.category || 'Uncategorized') + '</p>';

  // Improved N/A handling
  if (project.projectType) {
    html += '<p><strong>Type:</strong> ' + project.projectType + '</p>';
  }
  if (project.timePeriod) {
    html += '<p><strong>Time Period:</strong> ' + project.timePeriod + '</p>';
  }
  if (project.supervisorName) {
    html += '<p><strong>Assigned Supervisor:</strong> ' + project.supervisorName + '</p>';
  }

  // Fetch Author Name if it looks like a UID
  let authorName = project.userName || 'Unknown';
  if (project.userId) {
    try {
      // Attempt to fetch real user name
      const userDoc = await db.collection('users').doc(project.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        authorName = userData.name || userData.username || authorName;
      }
    } catch (e) {
      console.warn('Could not fetch author details:', e);
    }
  }

  html += '<p><strong>Author:</strong> ' + authorName + '</p>';
  html += '<div id="languageBarContainer" class="github-languages-section"><p style="color:#999;font-size:14px;">Loading languages...</p></div>';
  html += '<hr style="opacity: 0.1; margin: 15px 0;">';
  html += '<p class="description">' + (project.description || 'No description').replace(/\n/g, '<br>') + '</p>';

  html += '<div class="project-stats" style="margin-top: 20px;">';
  html += '<span class="stat">⭐ ' + (project.githubStars || 0) + ' Stars</span>';
  html += '<span class="stat">🍴 ' + (project.githubForks || 0) + ' Forks</span>';
  html += '<span class="stat"><span style="font-size: 1.5em; margin-right: 5px;">❤️</span> ' + (project.likes ? project.likes.length : 0) + ' Upvotes</span>';
  html += '</div>';

  html += '<div style="margin-top: 25px;">';
  html += '<button class="btn-primary" onclick="toggleUpvote()" id="upvoteBtn">';
  html += project.userHasUpvoted ? '<span style="font-size: 1.2em;">❤️</span> Remove Upvote' : '<span style="font-size: 1.2em;">❤️</span> Upvote';
  html += '</button>';
  html += '<button class="btn-primary" style="background:#24292e;" onclick="window.open(\'' + project.githubLink + '\', \'_blank\')"><svg style="width:18px;height:18px;vertical-align:middle;margin-right:6px;fill:white;" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>View on GitHub</button>';
  html += '<button class="btn-primary" style="background: #28a745; margin-left: 10px;" onclick="window.open(\'' + project.githubLink + '/archive/HEAD.zip\', \'_blank\')">💾 Download Code</button>';
  html += '</div>';

  document.getElementById('projectDetails').innerHTML = html;

  if (project.githubLink) {
    fetchAndRenderLanguages(project.githubLink);
  }
}

async function fetchAndRenderLanguages(githubLink) {
  const container = document.getElementById('languageBarContainer');
  if (!container) return;

  // Extract owner and repo from githubLink
  let owner, repo;
  try {
    const urlParts = new URL(githubLink).pathname.split('/').filter(Boolean);
    if (urlParts.length >= 2) {
      owner = urlParts[0];
      repo = urlParts[1];
    } else {
      throw new Error("Invalid GitHub link format");
    }
  } catch (e) {
    console.error("URL Error:", e);
    container.innerHTML = '<p><strong>Language Error:</strong> Invalid GitHub Link</p>';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/github/languages/${owner}/${repo}`);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Status ${response.status}: ${errText}`);
    }
    const languages = await response.json();
    
    if (Object.keys(languages).length === 0) {
      container.innerHTML = '<p><strong>Language:</strong> N/A (No languages found)</p>';
      return;
    }

    // GitHub Language Colors (simplified map)
    const langColors = {
      "JavaScript": "#f1e05a",
      "HTML": "#e34c26",
      "CSS": "#563d7c",
      "Python": "#3572A5",
      "Java": "#b07219",
      "C++": "#f34b7d",
      "TypeScript": "#3178c6",
      "C#": "#178600",
      "PHP": "#4F5D95",
      "Ruby": "#701516",
      "C": "#555555",
      "Swift": "#F05138",
      "Kotlin": "#A97BFF",
      "Dart": "#00B4AB",
      "Go": "#00ADD8",
      "Rust": "#dea584",
      "Vue": "#41b883",
      "Jupyter Notebook": "#DA5B0B",
      "Shell": "#89e051"
    };

    let totalBytes = 0;
    for (let lang in languages) {
      totalBytes += languages[lang];
    }

    let progressHtml = '<div class="lang-progress-bar">';
    let legendHtml = '<div class="lang-legend">';

    for (let lang in languages) {
      const percentage = ((languages[lang] / totalBytes) * 100).toFixed(1);
      const color = langColors[lang] || "#" + Math.floor(Math.random()*16777215).toString(16); // Default to random if not in map
      
      progressHtml += `<div class="lang-progress-segment" style="width: ${percentage}%; background-color: ${color};" title="${lang} ${percentage}%"></div>`;
      legendHtml += `<span class="lang-legend-item"><span class="lang-dot" style="background-color: ${color};"></span>${lang} <span style="color:#666; font-size: 0.9em; margin-left:2px;">${percentage}%</span></span>`;
    }

    progressHtml += '</div>';
    legendHtml += '</div>';

    container.innerHTML = `<p><strong>Languages</strong></p>` + progressHtml + legendHtml;

  } catch (error) {
    console.error('Error fetching languages:', error);
    container.innerHTML = `<p style="color:red"><strong>Language Error:</strong> ${error.message}</p><p style="font-size:12px">Did you restart your backend Node server after I added the route?</p>`;
  }
}

function displayComments(comments) {
  var container = document.getElementById('commentsContainer');

  if (!comments || comments.length === 0) {
    container.innerHTML = '<p class="empty-state">No comments yet. Be the first to comment!</p>';
    return;
  }

  // Sort comments by timestamp descending for web view
  const sortedComments = [...comments].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  var html = '';
  for (var i = 0; i < sortedComments.length; i++) {
    var comment = sortedComments[i];

    html += '<div class="comment">';
    html += '<div class="comment-header">';
    html += '<div class="comment-author">' + (comment.userName || 'Unknown') + '</div>';
    html += '<div class="comment-actions">';

    if (comment.userId === currentUser.id || currentUser.role === 'admin') {
      // Note: Deleting nested comments requires array manipulation
      html += '<button onclick="deleteComment(\'' + (comment.id || i) + '\')" class="btn-small btn-danger">Delete</button>';
    }

    html += '</div>';
    html += '</div>';
    html += '<div class="comment-text">' + (comment.text || '') + '</div>';
    html += '<div class="comment-meta">' + new Date(comment.timestamp).toLocaleString() + '</div>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function toggleUpvote() {
  let likes = currentProject.likes || [];

  if (currentProject.userHasUpvoted) {
    likes = likes.filter(id => id !== currentUser.id);
  } else {
    likes.push(currentUser.id);
  }

  db.collection('projects').doc(projectId).update({
    likes: likes
  })
    .then(() => {
      // onSnapshot will update UI
    })
    .catch(error => {
      console.error('Error toggling upvote:', error);
      showNotification('Failed to update upvote', 'error');
    });
}

function postComment(e) {
  e.preventDefault();

  var commentText = document.getElementById('commentText').value;

  // Diagnostic Reporting
  console.log('[DEBUG] Attempting to post comment');
  if (!auth.currentUser) {
    console.error('[DEBUG] Firebase Auth CurrentUser is null! Rules will reject this.');
    showNotification('Session expired or invalid. Please logout and login again.', 'error');
    return;
  }
  console.log('[DEBUG] Auth User UID:', auth.currentUser.uid);
  var comments = currentProject.comments || [];

  var newComment = {
    id: db.collection('dummy').doc().id, // Generate a unique ID
    userId: currentUser.id,
    userName: currentUser.username,
    text: commentText,
    timestamp: Date.now()
  };

  comments.push(newComment);

  db.collection('projects').doc(projectId).update({
    comments: comments
  })
    .then(function () {
      document.getElementById('commentForm').reset();
      // Optimistically add to UI or wait for snapshot
    })
    .catch(function (error) {
      console.error('Error posting comment:', error);
      showNotification('Failed to post comment: ' + error.message, 'error');
    });
}

function deleteComment(commentId) {
  showConfirm('Are you sure you want to delete this comment?', () => {
    let comments = currentProject.comments || [];
    comments = comments.filter(c => c.id !== commentId);

    db.collection('projects').doc(projectId).update({
      comments: comments
    })
      .then(() => {
        showNotification('Comment deleted!', 'success');
      })
      .catch(error => {
        console.error('Error deleting comment:', error);
        showNotification('Failed to delete comment', 'error');
      });
  });
}

function logout() {
  showConfirm('Are you sure you want to logout?', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });
}