import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBwYadp8-vDBuKryrg0WwaSd2CLB3ASIKE",
  authDomain: "wholesale-veg-shop.firebaseapp.com",
  projectId: "wholesale-veg-shop",
  storageBucket: "wholesale-veg-shop.firebasestorage.app",
  messagingSenderId: "479014214226",
  appId: "1:479014214226:web:7e052891b1c8ef4d45dd8b",
  measurementId: "G-LQQ220W7D6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;