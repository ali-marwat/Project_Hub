var API_URL = CONFIG.API_URL;
var currentUser = null;

document.addEventListener('DOMContentLoaded', function () {
  checkAuth();
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

  var adminLink = document.getElementById('adminLink');
  if (adminLink && currentUser.role === 'admin') {
    adminLink.style.display = 'inline-block';
  }

  loadMyProjects();
  setupEventListeners();

  // Check if returning from a specific tab
  var urlParams = new URLSearchParams(window.location.search);
  var fromTab = urlParams.get('from') || sessionStorage.getItem('activeDashboardTab');
  if (fromTab === 'pending') {
    // Need a slight delay to let elements render before switching
    setTimeout(() => {
      showTab('pending');
    }, 100);
  }
}

var currentStep = 1;

function setupEventListeners() {
  // Modal controls
  var modal = document.getElementById('submitModal');
  var btn = document.getElementById('submitBtn');
  var span = document.getElementsByClassName('close')[0];

  if (btn) {
    btn.onclick = function () {
      resetSubmitModal();
      modal.style.display = 'block';
    };
  }
  if (span) {
    span.onclick = () => modal.style.display = 'none';
  }
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  // Step logic
  document.getElementById('btnNextStep').onclick = nextStep;
  document.getElementById('btnPrevStep').onclick = prevStep;

  // Category selection Grid
  document.querySelectorAll('.cat-item').forEach(item => {
    item.addEventListener('click', function () {
      document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      document.getElementById('projectCategory').value = this.dataset.value;
      document.getElementById('step1-indicator').classList.add('completed');
    });
  });

  // Custom Type Toggle
  const customTypeInput = document.getElementById('customProjectType');
  if (customTypeInput) {
    customTypeInput.addEventListener('input', function () {
      if (document.querySelector('input[name="projectType"]:checked').value === 'Custom') {
        document.getElementById('projectType').value = this.value;
      }
    });
  }

  // GitHub Repo Fetch Logic
  document.getElementById('btnFetchRepos').onclick = fetchGitHubRepos;
  document.getElementById('btnClearRepo').onclick = clearSelectedRepo;

  document.getElementById('submitForm').onsubmit = submitProject;

}

function selectType(element, value) {
  // Visual selection
  document.querySelectorAll('.type-card').forEach(c => {
    c.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    c.style.background = 'rgba(255, 255, 255, 0.4)';
  });

  // Element IS the card
  element.style.borderColor = '#667eea';
  element.style.background = 'rgba(102, 126, 234, 0.15)';

  // Set value logic
  const supContainer = document.getElementById('supervisorContainer');
  if (supContainer) supContainer.style.display = (value === 'FYP') ? 'block' : 'none';

  if (value === 'Custom') {
    document.getElementById('customTypeContainer').style.display = 'block';
    document.getElementById('projectType').value = document.getElementById('customProjectType').value;
  } else {
    document.getElementById('customTypeContainer').style.display = 'none';
    document.getElementById('projectType').value = value;
  }
}

function nextStep() {
  if (currentStep === 1) {
    if (!document.getElementById('projectCategory').value) {
      showSubmitError('Please select a category first.');
      return;
    }
    document.getElementById('section-category').style.display = 'none';
    document.getElementById('section-repo').style.display = 'block'; // Show Repo Section
    document.getElementById('step2-indicator').classList.add('active');
    document.getElementById('step1-indicator').classList.add('completed');
    document.getElementById('btnPrevStep').style.display = 'block';
    currentStep = 2;
    hideSubmitError();

    // Auto-fetch if not already selected
    if (!document.getElementById('githubUrl').value) {
      document.getElementById('githubUsernameSearch').value = currentUser.username.replace(/\s+/g, '');
      fetchGitHubRepos();
    }
  } else if (currentStep === 2) {
    // Validate Repo
    const ghUrl = document.getElementById('githubUrl').value;

    if (!ghUrl) {
      showSubmitError('Please select a repository first.');
      return;
    }

    document.getElementById('section-repo').style.display = 'none';
    document.getElementById('section-type').style.display = 'block'; // Show Type Section
    document.getElementById('step3-indicator').classList.add('active');
    document.getElementById('step2-indicator').classList.add('completed');
    currentStep = 3;
    hideSubmitError();
  } else if (currentStep === 3) {
    // Validate Type & Time
    const pType = document.getElementById('projectType').value;
    const tPeriod = document.getElementById('timePeriod').value;

    if (!pType) {
      showSubmitError('Please select a project type.');
      return;
    }
    if (!tPeriod) {
      showSubmitError('Please enter a time period (e.g. Fall 2023).');
      return;
    }

    document.getElementById('section-type').style.display = 'none';
    document.getElementById('section-review').style.display = 'block';
    document.getElementById('btnNextStep').style.display = 'none';
    document.getElementById('btnSubmitProject').style.display = 'block';
    document.getElementById('step4-indicator').classList.add('active');
    document.getElementById('step3-indicator').classList.add('completed');
    currentStep = 4;
    hideSubmitError();
  }
}

function prevStep() {
  if (currentStep === 2) {
    document.getElementById('section-repo').style.display = 'none';
    document.getElementById('section-category').style.display = 'block';
    document.getElementById('btnPrevStep').style.display = 'none';
    document.getElementById('step2-indicator').classList.remove('active');
    document.getElementById('step1-indicator').classList.remove('completed');
    currentStep = 1;
  } else if (currentStep === 3) {
    document.getElementById('section-type').style.display = 'none';
    document.getElementById('section-repo').style.display = 'block';
    document.getElementById('step3-indicator').classList.remove('active');
    document.getElementById('step2-indicator').classList.remove('completed');
    currentStep = 2;
  } else if (currentStep === 4) {
    document.getElementById('section-review').style.display = 'none';
    document.getElementById('section-type').style.display = 'block';
    document.getElementById('btnNextStep').style.display = 'block';
    document.getElementById('btnSubmitProject').style.display = 'none';
    document.getElementById('step4-indicator').classList.remove('active');
    document.getElementById('step3-indicator').classList.remove('completed');
    currentStep = 3;
  }
}

function fetchGitHubRepos() {
  var input = document.getElementById('githubUsernameSearch').value.trim();
  if (!input) {
    showNotification('Please enter a GitHub username or paste a repository URL', 'warning');
    return;
  }

  // SMART EXTRACTION
  var username = input;

  // Handle full URLs like https://github.com/username
  // or https://github.com/username/repo
  if (input.includes('github.com/')) {
    try {
      const urlObj = new URL(input);
      const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
      if (pathParts.length > 0) {
        username = pathParts[0];
      }
    } catch (e) {
      // Fallback for non-standard URLs or partials
      var parts = input.split('github.com/')[1].split('/');
      username = parts[0];
    }
  }

  // Additional cleanup
  username = username.replace(/[/?#].*$/, ''); // Remove query params/hashes

  console.log('[DEBUG] Input:', input);
  console.log('[DEBUG] Extracted Username:', username);

  var repoList = document.getElementById('repoList');
  repoList.innerHTML = '<div class="repo-item" style="text-align:center">🔍 Loading projects for ' + username + '...</div>';

  fetch('http://localhost:3000/api/github/repos/' + username)
    .then(async res => {
      console.log('[DEBUG] GitHub API Status:', res.status);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(repos => {
      if (repos.length === 0) {
        repoList.innerHTML = '<div class="repo-item">No public repositories found.</div>';
        return;
      }
      displayRepoList(repos);
    })
    .catch(err => {
      repoList.innerHTML = '<div class="error-msg" style="display:block">' + err.message + '</div>';
    });
}

async function displayRepoList(repos) {
  var repoList = document.getElementById('repoList');
  repoList.innerHTML = '<div class="repo-item" style="text-align:center">Checking submission status...</div>';

  let submittedLinks = new Set();
  try {
    const uidTarget = currentUser.uid || currentUser.id;
    const snapshot = await db.collection('projects').where('userId', '==', uidTarget).get();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.githubLink) submittedLinks.add(data.githubLink.toLowerCase());
    });
  } catch (e) { console.error('Error fetching user projects:', e); }

  repoList.innerHTML = repos.map(repo => {
    const isSubmitted = submittedLinks.has(repo.html_url.toLowerCase());
    const disableAttr = isSubmitted ? 'style="opacity:0.5; cursor:not-allowed;"' : `onclick="selectRepo(${JSON.stringify(repo).replace(/"/g, '&quot;')})"`;
    const statusTag = isSubmitted ? '<span class="badge badge-pending" style="float:right; background:#e0e0e0; color:#555">Already Submitted</span>' : '';

    return `
    <div class="repo-item" ${disableAttr}>
      ${statusTag}
      <strong>📦 ${repo.name}</strong>
      <span>${repo.description || 'No description available'}</span>
      <div class="repo-meta">
        <span>⭐ ${repo.stargazers_count}</span>
        <span>🍴 ${repo.forks_count}</span>
        <span>${repo.language || 'Code'}</span>
      </div>
    </div>
  `}).join('');
}

function selectRepo(repo) {
  document.getElementById('projectName').value = repo.name;
  document.getElementById('githubUrl').value = repo.html_url;
  document.getElementById('projectDescription').value = repo.description || '';

  document.getElementById('displayRepoName').textContent = repo.name;
  document.getElementById('displayRepoUrl').textContent = repo.html_url;

  document.getElementById('repoList').style.display = 'none';
  document.querySelector('.repo-search-box').style.display = 'none';
  document.getElementById('selectedRepoInfo').style.display = 'flex';

  window.selectedRepoData = {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language
  };
  hideSubmitError();
}

function clearSelectedRepo() {
  document.getElementById('githubUrl').value = '';
  document.getElementById('selectedRepoInfo').style.display = 'none';
  document.querySelector('.repo-search-box').style.display = 'flex';
  document.getElementById('repoList').style.display = 'block';
  window.selectedRepoData = null;
}

function resetSubmitModal() {
  currentStep = 1;
  document.getElementById('submitForm').reset();
  document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('selected'));
  document.querySelectorAll('.step').forEach(s => {
    s.classList.remove('active', 'completed');
  });
  document.getElementById('step1-indicator').classList.add('active');
  document.getElementById('section-category').style.display = 'block';
  document.getElementById('section-repo').style.display = 'none';
  document.getElementById('section-type').style.display = 'none';
  document.getElementById('section-review').style.display = 'none';
  document.getElementById('btnPrevStep').style.display = 'none';
  document.getElementById('btnNextStep').style.display = 'block';
  document.getElementById('btnSubmitProject').style.display = 'none';
  document.getElementById('selectedRepoInfo').style.display = 'none';
  document.querySelector('.repo-search-box').style.display = 'flex';
  document.getElementById('repoList').style.display = 'block';
  document.getElementById('repoList').innerHTML = '';
  hideSubmitError();
}

function hideSubmitError() {
  document.getElementById('submitError').style.display = 'none';
}

function loadMyProjects() {
  db.collection('projects')
    .where('userId', '==', currentUser.id)
    .onSnapshot(function (snapshot) {
      var allMyProjects = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      var approved = allMyProjects.filter(p => p.status === 'APPROVED');
      var pending = allMyProjects.filter(p => p.status === 'PENDING');
      var rejected = allMyProjects.filter(p => p.status === 'REJECTED');

      displayProjects(approved, 'approvedProjects');
      displayProjects(pending, 'pendingProjects');
      displayProjects(rejected, 'rejectedProjects');

      var approvedCountElement = document.getElementById('approvedCount');
      var pendingCountElement = document.getElementById('pendingCount');
      var rejectedCountElement = document.getElementById('rejectedCount');

      if (approvedCountElement) {
        approvedCountElement.textContent = approved.length;
      }
      if (pendingCountElement) {
        pendingCountElement.textContent = pending.length;
      }
      if (rejectedCountElement) {
        rejectedCountElement.textContent = rejected.length;
      }
    }, function (error) {
      console.error('Error loading my projects:', error);
    });
}

function displayProjects(projects, containerId) {
  var container = document.getElementById(containerId);

  if (!container) {
    return;
  }

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state-illustration fade-in-up">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4V16M12 16L8 12M12 16L16 12M4 20H20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="empty-state-text">No projects yet</div>
        <div class="empty-state-subtext">Click the + button to submit your first project!</div>
      </div>
    `;
    return;
  }

  var html = '';

  for (var i = 0; i < projects.length; i++) {
    var project = projects[i];
    var delay = i * 0.1;
    var fromState = project.status === 'PENDING' ? 'pending' : (project.status === 'REJECTED' ? 'rejected' : 'approved');

    html += '<div class="project-card fade-in-up" style="animation-delay: ' + delay + 's" onclick="viewProject(\'' + project.id + '\', \'' + fromState + '\')">';
    html += '<h3>' + (project.name || 'Untitled') + '</h3>';
    html += '<p>' + (project.description || 'No description') + '</p>';
    html += '<div class="project-meta">';
    html += '<span class="badge badge-category">' + project.category + '</span>';

    // START: Added Project Type & Time Period
    if (project.projectType) {
      html += '<span class="badge badge-type" style="background: rgba(102,126,234,0.1); color: #667eea; border: 1px solid rgba(102,126,234,0.3);">' + project.projectType + '</span>';
    }
    if (project.timePeriod) {
      html += '<span class="badge badge-time" style="background: rgba(236,201,75,0.1); color: #d69e2e; border: 1px solid rgba(236,201,75,0.3);">' + project.timePeriod + '</span>';
    }
    if (project.supervisorName) {
      html += '<span class="badge badge-supervisor" style="background: rgba(156,39,176,0.1); color: #9c27b0; border: 1px solid rgba(156,39,176,0.3);">👤 ' + project.supervisorName + '</span>';
    }
    // END: Added Project Type & Time Period

    if (project.language) {
      html += '<span class="badge badge-language">' + project.language + '</span>';
    }

    if (project.status === 'PENDING') {
      html += '<span class="badge badge-pending">⏳ Pending</span>';
    } else if (project.status === 'REJECTED') {
      html += '<span class="badge badge-rejected" style="background: #ffcdd2; color: #d32f2f;">❌ Rejected</span>';
    }

    html += '</div>';

    if (project.status === 'REJECTED' && project.rejectionReason) {
      html += '<div style="margin-top: 10px; padding: 10px; background: rgba(244, 67, 54, 0.1); border-left: 3px solid #f44336; border-radius: 4px; font-size: 13px;">';
      html += '<strong>Rejection Reason:</strong> ' + project.rejectionReason;
      html += '</div>';
    }
    html += '<div class="project-stats">';
    html += '<span class="stat">⭐ ' + (project.githubStars || 0) + '</span>';
    html += '<span class="stat">🍴 ' + (project.githubForks || 0) + '</span>';
    html += '<span class="stat">❤️ ' + (project.likes ? project.likes.length : 0) + '</span>';
    html += '</div>';
    html += '<p style="font-size: 12px; color: #555;">Submitted: ' + new Date(project.timestamp).toLocaleDateString() + '</p>';
    html += '<div style="margin-top: 15px;">';
    html += '<button class="btn-primary" onclick="event.stopPropagation(); window.open(\'' + project.githubLink + '\', \'_blank\')">View on GitHub</button>';
    html += '</div>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function showTab(tabName) {
  var tabs = document.querySelectorAll('.tab-content');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('active');
  }

  var buttons = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('active');
  }

  if (tabName === 'approved') {
    document.getElementById('approvedTab').classList.add('active');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
  } else if (tabName === 'rejected') {
    document.getElementById('rejectedTab').classList.add('active');
    document.querySelectorAll('.tab-btn')[2].classList.add('active');
  } else {
    document.getElementById('pendingTab').classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
  }

  // Remember the active tab for back button navigation
  sessionStorage.setItem('activeDashboardTab', tabName);

  // Auto-scroll so projects are visible below the sticky navbar
  setTimeout(function () {
    var tabsContainer = document.querySelector('.tabs');
    if (tabsContainer) {
      var y = tabsContainer.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, 50);
}

async function submitProject(e) {
  e.preventDefault();

  var category = document.getElementById('projectCategory').value;
  var githubUrl = document.getElementById('githubUrl').value;
  var isConfirmed = document.getElementById('confirmGuidelines').checked;
  var errorMsg = document.getElementById('submitError');

  if (!category) {
    showSubmitError('Please select a category');
    return;
  }
  if (!githubUrl) {
    showSubmitError('Please select a repository');
    return;
  }
  if (!isConfirmed) {
    showSubmitError('Please confirm the guidelines');
    return;
  }

  // Final Validation: Check for README (Matching Android logic)
  let hasReadme = true;
  let githubValidated = true;

  try {
    const urlParts = githubUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];

    const readmeResponse = await fetch(`http://localhost:3000/api/github/readme/${owner}/${repo}`);
    if (!readmeResponse.ok) {
      showSubmitError('Your repository must have a README file to be submitted.');
      return;
    }
  } catch (err) {
    console.warn('Skipping strict README check due to error:', err);
    // Verify simple URL format at least
    if (!githubUrl.includes('github.com')) {
      showSubmitError('Invalid GitHub URL');
      return;
    }
  }

  const projectData = {
    userId: currentUser.id,
    userName: currentUser.username,
    name: document.getElementById('projectName').value,
    category: category,
    projectType: document.getElementById('projectType').value,
    timePeriod: document.getElementById('timePeriod').value,
    supervisorName: document.getElementById('projectType').value === 'FYP' ? document.getElementById('supervisorName').value : "",
    githubLink: githubUrl,
    description: document.getElementById('projectDescription').value,
    status: 'PENDING',
    approved: false,
    timestamp: Date.now(),
    githubStars: window.selectedRepoData ? window.selectedRepoData.stars : 0,
    githubForks: window.selectedRepoData ? window.selectedRepoData.forks : 0,
    language: window.selectedRepoData ? window.selectedRepoData.language : 'Unknown',
    likes: [],
    comments: [],
    githubValidated: githubValidated,
    hasReadme: hasReadme,
    rejectionReason: ""
  };

  db.collection('projects').add(projectData)
    .then(function (docRef) {
      showNotification('Project submitted successfully!', 'success');
      document.getElementById('submitModal').style.display = 'none';
      document.getElementById('submitForm').reset();
      clearSelectedRepo();
      // Redirect to the new project details
      window.location.href = 'project-details.html?id=' + docRef.id;
    })
    .catch(function (error) {
      showSubmitError('Failed to submit: ' + error.message);
    });
}

function showSubmitError(msg) {
  var errorEl = document.getElementById('submitError');
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

function viewProject(id, fromTab) {
  let url = 'project-details.html?id=' + id;
  if (fromTab) {
    url += '&from=' + fromTab;
  }
  window.location.href = url;
}

function logout() {
  showConfirm('Are you sure you want to logout?', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });
}