// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";




  const firebaseConfig = {
    apiKey: "AIzaSyB3e-1ItiBHSVPdj9LOeENydtuKGDlSiuA",
    authDomain: "login-auth-c50dd.firebaseapp.com",
    projectId: "login-auth-c50dd",
    storageBucket: "login-auth-c50dd.firebasestorage.app",
    messagingSenderId: "783769997119",
    appId: "1:783769997119:web:c6ab4be5ad5b990c320d8a",
    measurementId: "G-TCD848G1VE"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
const db = getFirestore(app);



export { db };