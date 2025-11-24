import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDgpFvgEyRf-WywNcH7gQhsbSW9lIDgl5U",
  authDomain: "patrolisatpam.firebaseapp.com",
  databaseURL: "https://patrolisatpam-default-rtdb.firebaseio.com",
  projectId: "patrolisatpam",
  storageBucket: "patrolisatpam.firebasestorage.app",
  messagingSenderId: "666207998880",
  appId: "1:666207998880:web:52de2fef89475336268ac5",
  measurementId: "G-ELQC500KJC"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
