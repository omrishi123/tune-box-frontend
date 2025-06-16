import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyClxdNo9wm3-cRjpqy7qgOSUGLY53eDJlU",
  authDomain: "music-player-7430b.firebaseapp.com",
  databaseURL: "https://music-player-7430b-default-rtdb.firebaseio.com",
  projectId: "music-player-7430b",
  storageBucket: "music-player-7430b.firebasestorage.app",
  messagingSenderId: "409965217706",
  appId: "1:409965217706:web:a8c31d19789c134bec4dd3",
  measurementId: "G-2DD6C2W4JJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable persistence with better error handling
Promise.all([
  setPersistence(auth, browserLocalPersistence),
  enableMultiTabIndexedDbPersistence(db)
]).catch((error) => {
  if (error.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence enabled in first tab only');
  } else if (error.code === 'unimplemented') {
    console.warn('Browser doesn\'t support persistence');
  }
});

export { auth, db };
