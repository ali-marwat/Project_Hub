var API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function () {
  var currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    window.location.href = 'index.html';
    return;
  }

  var githubBtn = document.getElementById('githubLoginBtn');
  if (githubBtn) {
    githubBtn.addEventListener('click', loginWithGitHub);
  }
});

function loginWithGitHub() {
  if (window.location.protocol === 'file:') {
    showNotification('⚠️ Error: Firebase Auth requires a local server. Please use Live Server.', 'error');
    return;
  }

  var provider = new firebase.auth.GithubAuthProvider();

  auth.signInWithPopup(provider)
    .then(function (result) {
      var user = result.user;
      console.log('GitHub Login Success UID:', user.uid);

      var safeName = user.displayName || (user.email ? user.email.split('@')[0] : 'GitHub User');
      var safeEmail = user.email || (user.uid + '@no-email.github');
      var safePhoto = user.photoURL || '';

      // Check if user exists in the SHARED Firestore "users" collection
      db.collection('users').doc(user.uid).get()
        .then((doc) => {
          var userData;
          if (doc.exists) {
            // --- EXISTING USER logic ---
            userData = doc.data();

            // Sync names to match Android expectations (name, photoUrl)
            userData.name = userData.name || safeName;
            userData.photoUrl = userData.photoUrl || safePhoto;

            // Update user profile to keep it fresh
            db.collection('users').doc(user.uid).update({
              name: userData.name,
              email: safeEmail,
              photoUrl: userData.photoUrl
            });

            // Web-specific role sync
            if (userData.isAdmin === true) {
              userData.role = 'admin';
            } else {
              userData.role = userData.role || 'user';
            }

            // Web-specific mapping from Android fields to prevent JS crash on commenting/upvoting
            userData.id = userData.uid || user.uid;
            userData.username = userData.name;

            completeLogin(userData);
          } else {
            // --- NEW USER object - Must match Android AuthViewModel.kt ---
            userData = {
              uid: user.uid,
              name: safeName,           // Android uses 'name'
              email: safeEmail,
              photoUrl: safePhoto,      // Android uses 'photoUrl'
              isAdmin: false,           // Role for both Android and Web
              role: 'user',             // Role for Web logic
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Web-specific mapping
            userData.id = userData.uid;
            userData.username = userData.name;

            console.log('Creating new user in shared Firestore...');
            db.collection('users').doc(user.uid).set(userData)
              .then(function () {
                console.log('User synced to shared Database!');
                completeLogin(userData);
              })
              .catch(function (error) {
                console.error('Error creating user record:', error);
                showNotification('❌ Error creating user profile: ' + error.message, 'error');
              });
          }
        })
        .catch(function (err) {
          console.error('Shared Firestore Fetch Error:', err);
          showNotification('❌ Database Error: ' + err.message, 'error');
        });
    })
    .catch(function (error) {
      console.error('GitHub Login Error:', error);
      showNotification('❌ GitHub Login failed: ' + error.message, 'error');
    });
}

function completeLogin(userData) {
  localStorage.setItem('currentUser', JSON.stringify(userData));
  console.log('Login Complete. Role:', userData.role);

  // Redirect based on role
  if (userData.role === 'admin' || userData.isAdmin === true) {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'index.html';
  }
}
