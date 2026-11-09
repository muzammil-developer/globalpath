/* ============================================================
   FIREBASE CONFIGURATION
   ⚠️ Firebase Console se apna config yahan paste karein
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "the-global-path.firebaseapp.com",
  projectId: "the-global-path",
  storageBucket: "the-global-path.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

firebase.initializeApp(firebaseConfig);

window.db = firebase.firestore();
window.auth = firebase.auth();
window.storage = firebase.storage();

console.log('✅ Firebase initialized');