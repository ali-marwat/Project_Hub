const API_URL = CONFIG.API_URL;
var allProjects = [];
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
  console.log('Logged in as:', currentUser.username, 'ID:', currentUser.id, 'Role:', currentUser.role);

  var greetingElement = document.getElementById('userGreeting');
  if (greetingElement) {
    greetingElement.textContent = 'Hello, ' + currentUser.username + '!';
    if (currentUser.role === 'admin') {
      greetingElement.innerHTML += ' <span style="color:#ffd700; font-size:10px;">(ADMIN)</span>';
    }
  }

  // Load GitHub avatar into header
  var avatarEl = document.getElementById('userAvatar');
  if (avatarEl) {
    var photoUrl = currentUser.photoUrl || currentUser.photoURL || '';
    if (photoUrl) {
      avatarEl.src = photoUrl;
      avatarEl.style.display = 'inline-block';
    } else {
      // Fallback: try GitHub API with username
      avatarEl.src = 'https://github.com/' + encodeURIComponent(currentUser.username) + '.png?size=48';
      avatarEl.style.display = 'inline-block';
      avatarEl.onerror = function() { this.style.display = 'none'; };
    }
  }

  var adminLink = document.getElementById('adminLink');
  if (adminLink) {
    if (currentUser.role === 'admin') {
      adminLink.style.display = 'inline-block';
    } else {
      adminLink.style.display = 'none';
      console.warn('Admin link hidden. Current role is:', currentUser.role);
    }
  }

  loadProjects();
  setupEventListeners();
}

var currentStep = 1;

function setupEventListeners() {
  function initToggle(btnId, wrapperId, displayType) {
    var btn = document.getElementById(btnId);
    var wrapper = document.getElementById(wrapperId);
    if (btn && wrapper) {
      btn.addEventListener('click', function () {
        this.classList.toggle('open');
        if (wrapper.classList.contains('expanded')) {
          wrapper.classList.remove('expanded');
          setTimeout(() => { wrapper.style.display = 'none'; }, 300);
        } else {
          wrapper.style.display = displayType;
          setTimeout(() => { wrapper.classList.add('expanded'); }, 10);
        }
      });
    }
  }

  initToggle('categoryToggleBtn', 'categoryTabsWrapper', 'block');
  initToggle('sortToggleBtn', 'sortTabsWrapper', 'flex');

  function scrollToProjects() {
    var container = document.getElementById('projectsContainer');
    if (container) {
      const yOffset = -150; // offset value to prevent hiding the first row
      const y = container.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  var categoryTabs = document.querySelectorAll('.category-tab');
  if (categoryTabs.length > 0) {
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        categoryTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        applyFilters();

        // Auto-scroll to projects container with offset
        scrollToProjects();
      });
    });
  }
  var searchBar = document.getElementById('searchBar');
  if (searchBar) {
    searchBar.addEventListener('input', applyFilters);
  }
  var sortTabs = document.querySelectorAll('.sort-tab');
  if (sortTabs.length > 0) {
    sortTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        sortTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        applyFilters();

        // Auto-scroll to projects container with offset
        scrollToProjects();
      });
    });
  }

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
    document.getElementById('step4-indicator').classList.add('active'); // Changed to step4
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

function loadProjects() {
  let query = db.collection('projects').where('status', '==', 'APPROVED');

  query.onSnapshot(function (snapshot) {
    allProjects = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));

    applyFilters();
  }, function (error) {
    console.error('Error loading projects:', error);
    var container = document.getElementById('projectsContainer');
    if (container) {
      container.innerHTML = '<p class="empty-state">Error loading projects. Please check console.</p>';
    }
  });
}

function applyFilters() {
  const activeSortTab = document.querySelector('.sort-tab.active');
  const sortValue = activeSortTab ? activeSortTab.dataset.value : 'newest';
  const activeTab = document.querySelector('.category-tab.active');
  const selectedCategory = activeTab ? activeTab.dataset.value.toLowerCase() : 'all';
  const searchBar = document.getElementById('searchBar');
  const searchQuery = searchBar ? searchBar.value.trim().toLowerCase() : '';

  let filtered = allProjects.filter(project => {
    if (selectedCategory === 'all') return true;

    let projCat = (project.category || '').toLowerCase();

    if (selectedCategory === 'other') {
      const mainCategories = ['web', 'ai/ml', 'game', 'mobile', 'data', 'cybersec', 'devops', 'iot', 'blockchain'];
      return !mainCategories.some(c => projCat.includes(c));
    }

    if (selectedCategory.includes('web')) return projCat.includes('web');
    if (selectedCategory.includes('game')) return projCat.includes('game');
    if (selectedCategory.includes('mobile')) return projCat.includes('mobile');

    return projCat.includes(selectedCategory);
  });

  if (searchQuery) {
    filtered = filtered.filter(project => {
      var nameMatch = (project.name || '').toLowerCase().includes(searchQuery);
      var descMatch = (project.description || '').toLowerCase().includes(searchQuery);
      var userMatch = (project.userName || '').toLowerCase().includes(searchQuery);
      var supMatch = (project.supervisorName || '').toLowerCase().includes(searchQuery);
      var catMatch = (project.category || '').toLowerCase().includes(searchQuery);
      return nameMatch || descMatch || userMatch || supMatch || catMatch;
    });
  }

  if (sortValue === 'stars') {
    filtered.sort((a, b) => (b.githubStars || 0) - (a.githubStars || 0));
  } else {
    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  displayProjects(filtered);
}

function displayProjects(projects) {
  var container = document.getElementById('projectsContainer');

  if (!container) {
    console.error('Projects container not found');
    return;
  }

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state-illustration fade-in-up">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 7H3C1.89543 7 1 7.89543 1 9V19C1 20.1046 1.89543 21 3 21H21C22.1046 21 23 20.1046 23 19V9C23 7.89543 22.1046 7 21 7Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 3H8L6 7H18L16 3Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="empty-state-text">No projects found</div>
        <div class="empty-state-subtext">Be the first to submit a project or try a different category!</div>
      </div>
    `;
    return;
  }

  var html = '';

  for (var i = 0; i < projects.length; i++) {
    var project = projects[i];
    // Staggered animation delay
    var delay = i * 0.1;

    html += '<div class="project-card fade-in-up" style="animation-delay: ' + delay + 's" onclick="viewProject(\'' + project.id + '\')">';
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

    html += '</div>';
    html += '<div class="project-stats">';
    html += '<span class="stat">⭐ ' + (project.githubStars || 0) + '</span>';
    html += '<span class="stat">🍴 ' + (project.githubForks || 0) + '</span>';
    html += '<span class="stat">❤️ ' + (project.likes ? project.likes.length : 0) + '</span>';
    html += '</div>';
    // Extract GitHub username from the repo link for avatar
    var ghUser = '';
    if (project.githubLink) {
      try { ghUser = new URL(project.githubLink).pathname.split('/').filter(Boolean)[0]; } catch(e) {}
    }
    var avatarHtml = ghUser ? '<img class="project-author-avatar" src="https://github.com/' + ghUser + '.png?size=44" onerror="this.style.display=\'none\'" alt="">' : '';
    html += '<div class="project-author-row">' + avatarHtml + '<span>By ' + (project.userName || 'Unknown') + ' • ' + new Date(project.timestamp).toLocaleDateString() + '</span></div>';
    html += '<div style="margin-top: 15px;">';
    html += '<button class="btn-primary" style="background:#24292e;" onclick="event.stopPropagation(); window.open(\'' + project.githubLink + '\', \'_blank\')"><svg style="width:16px;height:16px;vertical-align:middle;margin-right:5px;fill:white;" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>View on GitHub</button>';
    html += '</div>';
    html += '</div>';
  }

  container.innerHTML = html;
}



function viewProject(id) {
  window.location.href = 'project-details.html?id=' + id;
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
    id: "", // Typically set by Firestore auto-id, but good for model match
    userId: currentUser.uid || currentUser.id,
    userName: currentUser.name || currentUser.username,
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
    githubStars: parseInt(window.selectedRepoData ? window.selectedRepoData.stars : 0),
    githubForks: parseInt(window.selectedRepoData ? window.selectedRepoData.forks : 0),
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

function logout() {
  showConfirm('Are you sure you want to logout?', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });
}