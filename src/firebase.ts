import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkzJzSzSXvbOaSYs7csHLSp-8EgfEY1QQ",
  authDomain: "tacotyper.firebaseapp.com",
  projectId: "tacotyper",
  storageBucket: "tacotyper.firebasestorage.app",
  messagingSenderId: "781290974991",
  appId: "1:781290974991:web:a49d6ca4876fe945a5187a",
  measurementId: "G-FTKXN86V0B"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
