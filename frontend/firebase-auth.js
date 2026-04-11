// ============================================================
// firebase-auth.js  —  Firebase Client Auth for SACDEV SOMS
// Handles: Google Sign-In + Email/Password (restricted to @my.xu.edu.ph)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── Firebase config for sacdev-soms project ──
// ⚠️  Replace these values with the ones from:
//     Firebase Console → Project Settings → Your apps → Web app → SDK setup
const firebaseConfig = {
  apiKey:            "AIzaSyC5Jr42Aotyjm-8SPFGwGdPiXvnDJ68po8",
  authDomain:        "sacdev-soms.firebaseapp.com",
  projectId:         "sacdev-soms",
  storageBucket:     "sacdev-soms.appspot.com",
  messagingSenderId: "242176258263",
  appId:             "1:242176258263:web:cb9be26b17d6d9e96b8092"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

// Force account chooser every time + restrict to XU domain
provider.setCustomParameters({
  prompt: "select_account",
  hd: "my.xu.edu.ph"          // hint — hard enforcement is done in JS below
});

const ALLOWED_DOMAIN = "@my.xu.edu.ph";

// ── Expose auth functions globally so script.js can call them ──

window._firebaseAuth = auth;

// Called when user clicks the Google button
window.handleGoogleAuth = async function () {
  const btn = document.getElementById("googleSignInBtn");
  const errEl = document.getElementById("authError");
  errEl.classList.add("hidden");

  try {
    btn.disabled = true;
    btn.style.opacity = "0.7";
    document.getElementById("googleBtnText").textContent = "Redirecting…";

    const result = await signInWithPopup(auth, provider);
    const user   = result.user;

    // Hard-enforce domain restriction
    if (!user.email.endsWith(ALLOWED_DOMAIN)) {
      await signOut(auth);
      showAuthError(`Only @my.xu.edu.ph accounts are allowed. You signed in with: ${user.email}`);
      return;
    }

    onLoginSuccess(user.email);
  } catch (err) {
    if (err.code !== "auth/popup-closed-by-user") {
      showAuthError(friendlyError(err));
    }
  } finally {
    btn.disabled = false;
    btn.style.opacity = "1";
    document.getElementById("googleBtnText").textContent = "Continue with Google (@my.xu.edu.ph)";
  }
};

// Called when user submits email/password form
window.handleAuth = async function () {
  const email   = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const confirm  = document.getElementById("authConfirm").value;
  const mode     = window.currentState?.authMode || "register";

  // Validate domain
  if (!email) { showAuthError("Please enter your XU email address."); return; }
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    showAuthError("Please use your official XU email address ending in @my.xu.edu.ph.");
    return;
  }
  if (!password) { showAuthError("Please enter your password."); return; }

  const btn = document.getElementById("authSubmitBtn");
  btn.disabled = true;
  btn.textContent = "Please wait…";

  try {
    if (mode === "register") {
      if (password.length < 6) { showAuthError("Password must be at least 6 characters."); return; }
      if (password !== confirm)  { showAuthError("Passwords do not match."); return; }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      onLoginSuccess(cred.user.email);
    } else {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess(cred.user.email);
    }
  } catch (err) {
    showAuthError(friendlyError(err));
  } finally {
    btn.disabled = false;
    btn.textContent = mode === "register" ? "Register →" : "Log In →";
  }
};

// ── Auth state listener — keeps session across page reloads ──
onAuthStateChanged(auth, (user) => {
  if (user && user.email.endsWith(ALLOWED_DOMAIN)) {
    // User is already signed in — silently restore session state
    if (window.currentState) {
      window.currentState.isLoggedIn = true;
      window.currentState.userEmail  = user.email;
      const navEl = document.getElementById("navbarEmail");
      if (navEl) navEl.textContent = user.email;
    }
  }
});

// ── Shared success handler ──
function onLoginSuccess(email) {
  if (window.currentState) {
    window.currentState.isLoggedIn = true;
    window.currentState.userEmail  = email;
  }
  const navEl = document.getElementById("navbarEmail");
  if (navEl) navEl.textContent = email;
  // Navigate to org type selection (the "login" page in the original flow)
  if (window.goToPage) window.goToPage("login");
}

// ── Sign out (call this from your logout button) ──
window.handleSignOut = async function () {
  await signOut(auth);
  if (window.currentState) {
    window.currentState.isLoggedIn = false;
    window.currentState.userEmail  = null;
  }
  if (window.goToPage) window.goToPage("dashboard");
};

// ── Helper: human-readable Firebase error messages ──
function friendlyError(err) {
  switch (err.code) {
    case "auth/email-already-in-use":   return "This email is already registered. Try logging in instead.";
    case "auth/invalid-email":          return "Invalid email address format.";
    case "auth/wrong-password":         return "Incorrect password. Please try again.";
    case "auth/user-not-found":         return "No account found with this email. Please register first.";
    case "auth/too-many-requests":      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed": return "Network error. Check your internet connection.";
    case "auth/popup-blocked":          return "Popup was blocked. Please allow popups for this site.";
    default:                            return err.message || "An error occurred. Please try again.";
  }
}

// ── Helper: show error banner ──
function showAuthError(msg) {
  const errEl = document.getElementById("authError");
  if (errEl) {
    errEl.textContent = msg;
    errEl.classList.remove("hidden");
  }
}

// Override the original showAuthError so both modules share the same element
window.showAuthError = showAuthError;
