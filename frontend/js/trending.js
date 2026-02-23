const API_URL = 'http://localhost:3000/api';
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadTrending();
  loadPopular();
  loadTagCloud();
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

async function loadTrending() {
  try {
    const response = await fetch(`${API_URL}/analytics/trending`);
    const projects = await response.json();
    displayProjects(projects, 'trendingProjects');
  } catch (error) {
    console.error('Error loading trending projects:', error);
  }
}

async function loadPopular() {
  try {
    const response = await fetch(`${API_URL}/analytics/popular`);
    const projects = await response.json();
    displayProjects(projects, 'popularProjects');
  } catch (error) {
    console.error('Error loading popular projects:', error);
  }
}

async function loadTagCloud() {
  try {
    const response = await fetch(`${API_URL}/tags/cloud/popular`);
    const tags = await response.json();
    displayTagCloud(tags);
  } catch (error) {
    console.error('Error loading tag cloud:', error);
  }
}

function displayProjects(projects, containerId) {
  const container = document.getElementById(containerId);

  if (projects.length === 0) {
    container.innerHTML = '<p class="empty-state">No projects found.</p>';
    return;
  }

  container.innerHTML = projects.map((project, index) => {
    const screenshots = project.screenshots ? JSON.parse(project.screenshots) : [];
    const rank = index + 1;
    
    return `
      <div class="project-card trending-card">
        <div class="trending-rank">#${rank}</div>
        ${screenshots[0] ? `<img src="${screenshots[0]}" alt="${project.name}" class="project-thumbnail">` : ''}
        <h3>${project.name}</h3>
        <p>${project.description}</p>
        
        <div class="project-meta">
          <span class="badge badge-category">${project.category}</span>
          ${project.language ? `<span class="badge badge-language">${project.language}</span>` : ''}
        </div>

        <div class="project-stats">
          <span class="stat">👁️ ${project.views || 0} views</span>
          <span class="stat">⭐ ${project.stars || 0} stars</span>
          <span class="stat">👍 ${project.upvotes || 0} upvotes</span>
          ${project.recent_views ? `<span class="stat trending-badge">🔥 ${project.recent_views} this week</span>` : ''}
        </div>

        <p style="font-size: 12px; color: #999;">
          By ${project.author} • ${new Date(project.submitted_date).toLocaleDateString()}
        </p>

        <div style="margin-top: 15px;">
          <button class="btn-primary" onclick="window.location.href='project-details.html?id=${project.id}'">
            View Project
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function displayTagCloud(tags) {
  const container = document.getElementById('tagCloud');

  if (tags.length === 0) {
    container.innerHTML = '<p>No tags available</p>';
    return;
  }

  // Calculate font sizes based on count
  const maxCount = Math.max(...tags.map(t => t.count));
  const minCount = Math.min(...tags.map(t => t.count));

  container.innerHTML = tags.map(tag => {
    const fontSize = calculateFontSize(tag.count, minCount, maxCount);
    return `
      <span class="tag-cloud-item" 
            style="font-size: ${fontSize}px;" 
            onclick="filterByTag('${tag.name}')">
        ${tag.name} <span class="tag-count">(${tag.count})</span>
      </span>
    `;
  }).join('');
}

function calculateFontSize(count, min, max) {
  const minSize = 14;
  const maxSize = 32;
  
  if (max === min) return minSize;
  
  const ratio = (count - min) / (max - min);
  return Math.round(minSize + (ratio * (maxSize - minSize)));
}

function filterByTag(tagName) {
  window.location.href = `index.html?tag=${tagName}`;
}

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  if (tabName === 'trending') {
    document.getElementById('trendingTab').classList.add('active');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
  } else {
    document.getElementById('popularTab').classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  }
}