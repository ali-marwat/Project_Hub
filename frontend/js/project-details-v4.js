var API_URL = 'http://localhost:3000/api';
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

  var adminLink = document.getElementById('adminLink');
  if (adminLink && currentUser.role === 'admin') {
    adminLink.style.display = 'inline-block';
  }
}

function loadProjectDetails() {
  // Load Project Details from 'projects' collection (matching Android repo code)
  db.collection('projects').doc(projectId).onSnapshot(function (doc) {
    if (!doc.exists) {
      alert('Project not found');
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
  html += '<p><strong>Language:</strong> ' + (project.language || 'N/A') + '</p>';
  html += '<hr style="opacity: 0.1; margin: 15px 0;">';
  html += '<p class="description">' + (project.description || 'No description').replace(/\n/g, '<br>') + '</p>';

  html += '<div class="project-stats" style="margin-top: 20px;">';
  html += '<span class="stat">⭐ ' + (project.githubStars || 0) + ' Stars</span>';
  html += '<span class="stat">🍴 ' + (project.githubForks || 0) + ' Forks</span>';
  html += '<span class="stat">👍 ' + (project.likes ? project.likes.length : 0) + ' Upvotes</span>';
  html += '</div>';

  html += '<div style="margin-top: 25px;">';
  html += '<button class="btn-primary" onclick="toggleUpvote()" id="upvoteBtn">';
  html += project.userHasUpvoted ? '❤️ Remove Upvote' : '👍 Upvote';
  html += '</button>';
  html += '<button class="btn-primary" onclick="window.open(\'' + project.githubLink + '\', \'_blank\')">View on GitHub</button>';
  html += '</div>';

  document.getElementById('projectDetails').innerHTML = html;
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
      alert('Failed to update upvote');
    });
}

function postComment(e) {
  e.preventDefault();

  var commentText = document.getElementById('commentText').value;

  // Diagnostic Reporting
  console.log('[DEBUG] Attempting to post comment');
  if (!auth.currentUser) {
    console.error('[DEBUG] Firebase Auth CurrentUser is null! Rules will reject this.');
    alert('Session expired or invalid. Please logout and login again.');
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
      alert('Failed to post comment: ' + error.message);
    });
}

function deleteComment(commentId) {
  if (!confirm('Are you sure you want to delete this comment?')) {
    return;
  }

  let comments = currentProject.comments || [];
  comments = comments.filter(c => c.id !== commentId);

  db.collection('projects').doc(projectId).update({
    comments: comments
  })
    .then(() => {
      alert('✅ Comment deleted!');
    })
    .catch(error => {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    });
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  }
}