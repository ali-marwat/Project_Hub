const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let profileUserId = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  // Get user ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  profileUserId = urlParams.get('id') || new URLSearchParams(window.location.pathname).get('id');

  if (!profileUserId) {
    // If no ID, show current user's profile
    profileUserId = currentUser.id;
  }

  loadProfile();
  setupEventListeners();
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

function setupEventListeners() {
  const modal = document.getElementById('editProfileModal');
  const btn = document.getElementById('editProfileBtn');
  const span = document.getElementsByClassName('close')[0];

  if (btn) {
    btn.onclick = () => {
      populateEditForm();
      modal.style.display = 'block';
    };
  }

  if (span) {
    span.onclick = () => modal.style.display = 'none';
  }

  window.onclick = (e) => {
    if (e.target == modal) modal.style.display = 'none';
  };

  document.getElementById('editProfileForm').addEventListener('submit', updateProfile);
}

async function loadProfile() {
  try {
    // Load User Data from Firestore
    db.collection('users').doc(profileUserId).onSnapshot(async (doc) => {
      if (!doc.exists) {
        alert('Profile not found');
        window.location.href = 'index.html';
        return;
      }
      const user = doc.data();

      // Load User Projects
      const projectsSnapshot = await db.collection('projects')
        .where('user_id', '==', profileUserId)
        .get();

      const projects = projectsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      // Calculate Stats
      const stats = {
        total_projects: projects.length,
        total_upvotes: projects.reduce((acc, curr) => acc + (curr.upvotes || 0), 0),
        total_views: projects.reduce((acc, curr) => acc + (curr.views || 0), 0)
      };

      displayProfile({ user, projects, stats });
    }, error => {
      console.error('Error loading profile:', error);
    });
  } catch (error) {
    console.error('Error in loadProfile:', error);
  }
}

function displayProfile(data) {
  const { user, projects, stats } = data;

  // Show edit button if viewing own profile
  if (currentUser.id == profileUserId) {
    document.getElementById('editProfileBtn').style.display = 'block';
  }

  // Profile info
  document.getElementById('profileUsername').textContent = user.username;
  document.getElementById('profileBio').textContent = user.bio || 'No bio yet';

  if (user.avatar_url) {
    document.getElementById('profileAvatar').querySelector('img').src = user.avatar_url;
  }

  // Meta info
  const metaHtml = [];
  if (user.location) metaHtml.push(`📍 ${user.location}`);
  if (user.website) metaHtml.push(`🌐 <a href="${user.website}" target="_blank">${user.website}</a>`);
  if (user.github_username) metaHtml.push(`💻 <a href="https://github.com/${user.github_username}" target="_blank">@${user.github_username}</a>`);

  document.getElementById('profileLocation').innerHTML = metaHtml.join(' • ');

  // Stats
  document.getElementById('totalProjects').textContent = stats.total_projects || 0;
  document.getElementById('totalUpvotes').textContent = stats.total_upvotes || 0;
  document.getElementById('totalViews').textContent = stats.total_views || 0;

  // Projects
  displayProjects(projects);
}

function displayProjects(projects) {
  const container = document.getElementById('userProjects');

  if (projects.length === 0) {
    container.innerHTML = '<p class="empty-state">No projects yet.</p>';
    return;
  }

  container.innerHTML = projects.map(project => `
    <div class="project-card" onclick="window.location.href='project-details.html?id=${project.id}'">
      ${project.screenshots && JSON.parse(project.screenshots)[0] ?
      `<img src="${JSON.parse(project.screenshots)[0]}" alt="${project.name}" class="project-thumbnail">` :
      ''}
      <h3>${project.name}</h3>
      <p>${project.description}</p>
      
      <div class="project-meta">
        <span class="badge badge-category">${project.category}</span>
        ${project.projectType ? `<span class="badge badge-type" style="background: rgba(102,126,234,0.1); color: #667eea; border: 1px solid rgba(102,126,234,0.3);">${project.projectType}</span>` : ''}
        ${project.timePeriod ? `<span class="badge badge-time" style="background: rgba(236,201,75,0.1); color: #d69e2e; border: 1px solid rgba(236,201,75,0.3);">${project.timePeriod}</span>` : ''}
        ${project.supervisorName ? `<span class="badge badge-supervisor" style="background: rgba(156,39,176,0.1); color: #9c27b0; border: 1px solid rgba(156,39,176,0.3);">👤 ${project.supervisorName}</span>` : ''}
        ${project.language ? `<span class="badge badge-language">${project.language}</span>` : ''}
      </div>

      <div class="project-stats">
        <span class="stat">👁️ ${project.views || 0}</span>
        <span class="stat">⭐ ${project.stars || 0}</span>
        <span class="stat">👍 ${project.upvotes || 0}</span>
      </div>
    </div>
  `).join('');
}

function populateEditForm() {
  document.getElementById('editUsername').value = currentUser.username || '';
  document.getElementById('editBio').value = currentUser.bio || '';
  document.getElementById('editLocation').value = currentUser.location || '';
  document.getElementById('editWebsite').value = currentUser.website || '';
}

async function updateProfile(e) {
  e.preventDefault();

  const profileData = {
    username: document.getElementById('editUsername').value,
    bio: document.getElementById('editBio').value,
    location: document.getElementById('editLocation').value,
    website: document.getElementById('editWebsite').value
  };

  try {
    await db.collection('users').doc(currentUser.id).update(profileData);

    alert('✅ Profile updated!');
    document.getElementById('editProfileModal').style.display = 'none';

    // Update currentUser local state
    Object.assign(currentUser, profileData);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Note: Avatar upload usually requires Firebase Storage, 
    // for now we stick to text data sync.
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('❌ Error updating profile');
  }
}

async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await fetch(`${API_URL}/profile/avatar`, {
      method: 'POST',
      headers: {
        'user-id': currentUser.id
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      currentUser.avatar_url = data.avatar_url;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
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