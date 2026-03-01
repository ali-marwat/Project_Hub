const API_URL = CONFIG.API_URL;
let currentUser = null;
let projectId = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  const urlParams = new URLSearchParams(window.location.search);
  projectId = urlParams.get('id');

  if (!projectId) {
    showNotification('No project ID specified', 'error');
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('backToProject').href = `project-details.html?id=${projectId}`;

  loadAnalytics();
});

function checkAuth() {
  const userData = localStorage.getItem('currentUser');

  if (!userData) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = JSON.parse(userData);
  document.getElementById('userGreeting').textContent = `Hello, ${currentUser.username}!`;
}

async function loadAnalytics() {
  try {
    const response = await fetch(`${API_URL}/analytics/project/${projectId}`, {
      headers: {
        'user-id': currentUser.id
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load analytics');
    }

    const data = await response.json();
    displayAnalytics(data);
  } catch (error) {
    console.error('Error loading analytics:', error);
    showNotification('Error loading analytics. Make sure you own this project.', 'error');
    window.location.href = 'dashboard.html';
  }
}

function displayAnalytics(data) {
  const { dailyViews, stats } = data;

  // Display stats
  document.getElementById('totalViews').textContent = stats.views || 0;
  document.getElementById('totalUpvotes').textContent = stats.upvotes || 0;
  document.getElementById('totalComments').textContent = stats.comment_count || 0;
  document.getElementById('totalBookmarks').textContent = stats.bookmark_count || 0;

  // Display views chart
  displayViewsChart(dailyViews);
}

function displayViewsChart(dailyViews) {
  const container = document.getElementById('viewsChart');

  if (dailyViews.length === 0) {
    container.innerHTML = '<p class="empty-state">No view data available yet.</p>';
    return;
  }

  const maxViews = Math.max(...dailyViews.map(d => d.views));

  container.innerHTML = `
    <div class="chart-bars">
      ${dailyViews.map(day => {
    const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
    return `
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: ${height}%;">
              <span class="chart-value">${day.views}</span>
            </div>
            <div class="chart-label">${formatDate(day.view_date)}</div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}
function logout() {
  showConfirm('Are you sure you want to logout?', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });
}