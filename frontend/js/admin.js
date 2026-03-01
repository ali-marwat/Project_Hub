const API_URL = CONFIG.API_URL;
var currentUser = null;
var currentStatus = 'PENDING';
var unsubscribeProjects = null;

document.addEventListener('DOMContentLoaded', function () {
  checkAdminAuth();
  loadAdminProjects('PENDING');
  setupRejectModal();
});

function checkAdminAuth() {
  var userData = localStorage.getItem('currentUser');

  if (!userData) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = JSON.parse(userData);

  if (currentUser.role !== 'admin') {
    showNotification('❌ Admin access only!', 'error');
    window.location.href = 'index.html';
    return;
  }

  var greetingElement = document.getElementById('userGreeting');
  if (greetingElement) {
    greetingElement.textContent = 'Admin: ' + currentUser.username;
  }
}

function switchTab(status, btn) {
  currentStatus = status;

  // Update UI
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  loadAdminProjects(status);

  // Auto-scroll so projects are visible below the sticky navbar
  setTimeout(function () {
    var tabsContainer = document.querySelector('.tabs');
    if (tabsContainer) {
      var y = tabsContainer.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, 50);
}

function loadAdminProjects(status) {
  // Unsubscribe from previous listener if exists
  if (unsubscribeProjects) {
    unsubscribeProjects();
  }

  unsubscribeProjects = db.collection('projects')
    .where('status', '==', status)
    .onSnapshot(function (snapshot) {
      var projects = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      // Sort by timestamp descending
      projects.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      displayAdminProjects(projects);
    }, function (error) {
      console.error('Error loading projects:', error);
    });
}

function displayAdminProjects(projects) {
  var container = document.getElementById('pendingProjects'); // Reusing ID to avoid breaking layout

  if (projects.length === 0) {
    container.innerHTML = `<p class="empty-state">No ${currentStatus.toLowerCase()} projects found.</p>`;
    return;
  }

  var html = '';

  for (var i = 0; i < projects.length; i++) {
    var project = projects[i];

    html += '<div class="pending-card" style="border-left: 4px solid ' + getStatusColor(project.status) + '">';
    html += '<h3>' + (project.name || 'Untitled') + '</h3>';
    html += '<p><strong>Category:</strong> ' + project.category + '</p>';
    html += '<p><strong>GitHub:</strong> <a href="' + project.githubLink + '" target="_blank">' + project.githubLink + '</a></p>';
    html += '<p><strong>Description:</strong> ' + (project.description || 'No description') + '</p>';
    html += '<p><strong>Author:</strong> ' + (project.userName || 'Unknown') + '</p>';
    html += '<p><strong>Language:</strong> ' + (project.language || 'N/A') + '</p>';
    html += '<p><strong>Stars:</strong> ' + (project.githubStars || 0) + ' | <strong>Forks:</strong> ' + (project.githubForks || 0) + '</p>';
    html += '<p><strong>Submitted:</strong> ' + new Date(project.timestamp).toLocaleString() + '</p>';

    if (project.status === 'REJECTED' && project.rejectionReason) {
      html += '<div style="margin-top: 10px; padding: 10px; background: rgba(244, 67, 54, 0.1); border-left: 3px solid #f44336; border-radius: 4px; font-size: 14px;">';
      html += '<strong>Rejection Reason:</strong> ' + project.rejectionReason;
      html += '</div>';
    }

    html += '<div class="admin-actions">';

    if (project.status !== 'APPROVED') {
      html += '<button class="btn-primary" onclick="approveProject(\'' + project.id + '\')">✅ Approve</button>';
    }

    if (project.status !== 'REJECTED') {
      html += '<button class="btn-secondary" onclick="rejectProject(\'' + project.id + '\')">❌ Reject</button>';
    }

    html += '<button class="btn-primary" style="background:#444" onclick="window.open(\'' + project.githubLink + '\', \'_blank\')">🔗 View Repo</button>';
    html += '</div>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function getStatusColor(status) {
  switch (status) {
    case 'PENDING': return 'orange';
    case 'APPROVED': return '#4CAF50';
    case 'REJECTED': return '#f44336';
    default: return '#667eea';
  }
}

function approveProject(id) {
  db.collection('projects')
    .doc(id).update({
      status: 'APPROVED',
      approved: true
    })
    .then(function () {
      console.log('✅ Project approved!');
    })
    .catch(function (error) {
      console.error('Error approving project:', error);
      showNotification('Failed to approve project', 'error');
    });
}

let currentRejectId = null;

function setupRejectModal() {
  const modal = document.getElementById('rejectModal');
  const closeBtn = document.getElementById('closeRejectModal');
  const cancelBtn = document.getElementById('cancelRejectBtn');
  const confirmBtn = document.getElementById('confirmRejectBtn');

  if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
  if (cancelBtn) cancelBtn.onclick = () => modal.style.display = 'none';

  window.onclick = (e) => {
    if (e.target == modal) modal.style.display = 'none';
  };

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const reason = document.getElementById('rejectReason').value;
      modal.style.display = 'none';
      processRejection(currentRejectId, reason);
    };
  }
}

function rejectProject(id) {
  currentRejectId = id;
  document.getElementById('rejectReason').value = ''; // clear previous
  document.getElementById('rejectModal').style.display = 'block';
}

function processRejection(id, reason) {
  db.collection('projects')
    .doc(id).update({
      status: 'REJECTED',
      approved: false,
      rejectionReason: reason || ''
    })
    .then(function () {
      console.log('❌ Project rejected');
      if (typeof showNotification === 'function') {
        showNotification('Project rejected successfully', 'success');
      }
    })
    .catch(function (error) {
      console.error('Error rejecting project:', error);
      if (typeof showNotification === 'function') {
        showNotification('Failed to update project', 'error');
      } else {
        showNotification('Failed to update project', 'error');
      }
    });
}

function logout() {
  showConfirm('Are you sure you want to logout?', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });
}
