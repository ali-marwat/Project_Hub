const API_URL = 'http://localhost:3000/api';
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadBookmarks();
});

function checkAuth() {
  const userData = localStorage.getItem('currentUser');
  
  if (!userData) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = JSON.parse(userData);
  document.getElementById('userGreeting').textContent = `Hello, ${currentUser.username}!`;
  
  if (currentUser.role === 'admin') {
    document.getElementById('adminLink').style.display = 'inline-block';
  }
}

async function loadBookmarks() {
  try {
    const response = await fetch(`${API_URL}/bookmarks`, {
      headers: {
        'user-id': currentUser.id
      }
    });

    const bookmarks = await response.json();
    displayBookmarks(bookmarks);
  } catch (error) {
    console.error('Error loading bookmarks:', error);
  }
}

function displayBookmarks(bookmarks) {
  const container = document.getElementById('bookmarksContainer');

  if (bookmarks.length === 0) {
    container.innerHTML = '<p class="empty-state">No bookmarks yet. Start exploring projects!</p>';
    return;
  }

  container.innerHTML = bookmarks.map(project => {
    const screenshots = project.screenshots ? JSON.parse(project.screenshots) : [];
    
    return `
      <div class="project-card">
        ${screenshots[0] ? `<img src="${screenshots[0]}" alt="${project.name}" class="project-thumbnail">` : ''}
        <h3>${project.name}</h3>
        <p>${project.description}</p>
        
        <div class="project-meta">
          <span class="badge badge-category">${project.category}</span>
          ${project.language ? `<span class="badge badge-language">${project.language}</span>` : ''}
        </div>

        <div class="project-stats">
          <span class="stat">👁️ ${project.views || 0}</span>
          <span class="stat">⭐ ${project.stars || 0}</span>
          <span class="stat">👍 ${project.upvotes || 0}</span>
        </div>

        <div style="margin-top: 15px; display: flex; gap: 10px;">
          <button class="btn-primary" onclick="window.location.href='project-details.html?id=${project.id}'">
            View Details
          </button>
          <button class="btn-secondary" onclick="removeBookmark(${project.id})">
            Remove Bookmark
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function removeBookmark(projectId) {
  if (!confirm('Remove this bookmark?')) return;

  try {
    const response = await fetch(`${API_URL}/bookmarks/${projectId}`, {
      method: 'DELETE',
      headers: {
        'user-id': currentUser.id
      }
    });

    if (response.ok) {
      alert('✅ Bookmark removed');
      loadBookmarks();
    }
  } catch (error) {
    console.error('Error removing bookmark:', error);
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

