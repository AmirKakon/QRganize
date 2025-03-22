// firebase initializer

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDS7G2otjWrVY5aHkSDFAX2Ur0sljhZNjg",
  authDomain: "qrganize-f651b.firebaseapp.com",
  projectId: "qrganize-f651b",
  storageBucket: "qrganize-f651b.firebasestorage.app",
  messagingSenderId: "453711120042",
  appId: "1:453711120042:web:0b87452a1b36cfdaa9b2d3",
  measurementId: "G-MGVVDBW5CS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
