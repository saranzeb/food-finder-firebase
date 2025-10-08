// lib/firebase.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCIK2EoftL9GsYfewjcOud66xWKVT67CI4",
  authDomain: "food-finder-firebase-22160.firebaseapp.com",
  projectId: "food-finder-firebase-22160",
  storageBucket: "food-finder-firebase-22160.firebasestorage.app",
  messagingSenderId: "547278791981",
  appId: "1:547278791981:web:6825ccd274ccba523a1fa4",
  measurementId: "G-FJEVCM122W"
};



const app = initializeApp(firebaseConfig);

export default app;