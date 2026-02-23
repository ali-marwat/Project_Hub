// Firebase Configuration (Single Source of Truth)
const firebaseConfig = {
    apiKey: "AIzaSyDQ4pgPhCyDLjCS93htIe03VvkHM1_q6Zw",
    authDomain: "projectscolab-511bd.firebaseapp.com",
    databaseURL: "https://projectscolab-511bd-default-rtdb.firebaseio.com",
    projectId: "projectscolab-511bd",
    storageBucket: "projectscolab-511bd.firebasestorage.app",
    messagingSenderId: "678948355874",
    appId: "1:678948355874:web:b31876e37ad2dad061af7b"
};

// Initialize Firebase using Namespace SDK (v8) for compatibility with existing scripts
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Export for other scripts to use globally
window.auth = auth;
window.db = db;
