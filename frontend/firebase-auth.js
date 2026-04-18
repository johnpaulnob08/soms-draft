<<<<<<< HEAD
=======
// ============================================================
// firebase-auth.js  —  Firebase Client Auth for SACDEV SOMS
// Handles: Google Sign-In + Email/Password (restricted to @my.xu.edu.ph)
// ============================================================

>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
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

<<<<<<< HEAD
=======
// ── Firebase config for sacdev-soms project ──
// ⚠️  Replace these values with the ones from:
//     Firebase Console → Project Settings → Your apps → Web app → SDK setup
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
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

<<<<<<< HEAD
provider.setCustomParameters({
  prompt: "select_account",
  hd: "my.xu.edu.ph"
=======
// Force account chooser every time + restrict to XU domain
provider.setCustomParameters({
  prompt: "select_account",
  hd: "my.xu.edu.ph"          // hint — hard enforcement is done in JS below
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
});

const ALLOWED_DOMAIN = "@my.xu.edu.ph";

<<<<<<< HEAD
window._firebaseAuth = auth;

// Helper: detect which auth page is currently visible
function _getVisibleAuthPage() {
  const lp = document.getElementById("loginPage");
  const rp = document.getElementById("registerPage");
  if (lp && !lp.classList.contains("hidden")) return "login";
  if (rp && !rp.classList.contains("hidden")) return "register";
  return null;
}

// Helper: clear error on the visible page
function _clearAuthError() {
  const errEl = document.getElementById("loginError");
  if (errEl) { errEl.classList.add("hidden"); errEl.textContent = ""; }
  const errEl2 = document.getElementById("registerError");
  if (errEl2) { errEl2.classList.add("hidden"); errEl2.textContent = ""; }
  const legacy = document.getElementById("authError");
  if (legacy) { legacy.classList.add("hidden"); legacy.textContent = ""; }
}

window.handleGoogleAuth = async function () {
  const visiblePage = _getVisibleAuthPage();
  // Target whichever Google button is currently visible
  const btn   = visiblePage === "login"
    ? document.getElementById("googleSignInBtn")
    : document.getElementById("googleRegisterBtn");
  const txtEl = visiblePage === "login"
    ? document.getElementById("googleBtnText")
    : document.getElementById("googleRegisterBtnText");

  _clearAuthError();

  try {
    if (btn)   { btn.disabled = true; btn.style.opacity = "0.7"; }
    if (txtEl) txtEl.textContent = "Redirecting…";
=======
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
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08

    const result = await signInWithPopup(auth, provider);
    const user   = result.user;

<<<<<<< HEAD
=======
    // Hard-enforce domain restriction
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
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
<<<<<<< HEAD
    if (btn)   { btn.disabled = false; btn.style.opacity = "1"; }
    if (txtEl) txtEl.textContent = "Continue with Google (@my.xu.edu.ph)";
  }
};

window.handleAuth = async function () {
  const email    = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const confirm  = document.getElementById("authConfirm").value;
  const mode     = window.currentState?.authMode || "login";

  _clearAuthError();

=======
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
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
  if (!email) { showAuthError("Please enter your XU email address."); return; }
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    showAuthError("Please use your official XU email address ending in @my.xu.edu.ph.");
    return;
  }
  if (!password) { showAuthError("Please enter your password."); return; }

<<<<<<< HEAD
  // Disable the visible submit button while processing
  const visiblePage  = _getVisibleAuthPage();
  const visibleBtnId = visiblePage === "login" ? "loginSubmitBtn" : "registerSubmitBtn";
  const visibleBtn   = document.getElementById(visibleBtnId);
  if (visibleBtn) { visibleBtn.disabled = true; visibleBtn.textContent = "Please wait…"; }
=======
  const btn = document.getElementById("authSubmitBtn");
  btn.disabled = true;
  btn.textContent = "Please wait…";
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08

  try {
    if (mode === "register") {
      if (password.length < 6) { showAuthError("Password must be at least 6 characters."); return; }
<<<<<<< HEAD
      if (password !== confirm) { showAuthError("Passwords do not match."); return; }
=======
      if (password !== confirm)  { showAuthError("Passwords do not match."); return; }
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      onLoginSuccess(cred.user.email);
    } else {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess(cred.user.email);
    }
  } catch (err) {
    showAuthError(friendlyError(err));
  } finally {
<<<<<<< HEAD
    if (visibleBtn) {
      visibleBtn.disabled = false;
      visibleBtn.textContent = mode === "register" ? "Register →" : "Log In →";
    }
  }
};

onAuthStateChanged(auth, (user) => {
  if (user && user.email.endsWith(ALLOWED_DOMAIN)) {
=======
    btn.disabled = false;
    btn.textContent = mode === "register" ? "Register →" : "Log In →";
  }
};

// ── Auth state listener — keeps session across page reloads ──
onAuthStateChanged(auth, (user) => {
  if (user && user.email.endsWith(ALLOWED_DOMAIN)) {
    // User is already signed in — silently restore session state
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
    if (window.currentState) {
      window.currentState.isLoggedIn = true;
      window.currentState.userEmail  = user.email;
      const navEl = document.getElementById("navbarEmail");
      if (navEl) navEl.textContent = user.email;
    }
  }
});

<<<<<<< HEAD
=======
// ── Shared success handler ──
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
function onLoginSuccess(email) {
  if (window.currentState) {
    window.currentState.isLoggedIn = true;
    window.currentState.userEmail  = email;
  }
<<<<<<< HEAD
  // Persist email so registration.html can restore the navbar
  try { sessionStorage.setItem('sacdev_userEmail', email); } catch(e) {}

  const navUser  = document.getElementById("navbarUser");
  const navEmail = document.getElementById("navbarEmail");
  if (navUser)  navUser.classList.remove("hidden");
  if (navEmail) navEmail.textContent = email;

  // If we are on login.html, navigate to the registration page
  // If goToPage exists and handles 'login', let it decide (registration.html overrides it)
  if (window.location.pathname.includes('login.html') ||
      window.location.pathname === '/' ||
      window.location.pathname === '') {
    window.location.href = 'registration.html';
  } else if (window.goToPage) {
    window.goToPage("login");
  }
}

window.handleSignOut = async function () {
  await signOut(auth);
  try { sessionStorage.removeItem('sacdev_userEmail'); } catch(e) {}
=======
  const navEl = document.getElementById("navbarEmail");
  if (navEl) navEl.textContent = email;
  // Navigate to org type selection (the "login" page in the original flow)
  if (window.goToPage) window.goToPage("login");
}

// ── Sign out (call this from your logout button) ──
window.handleSignOut = async function () {
  await signOut(auth);
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
  if (window.currentState) {
    window.currentState.isLoggedIn = false;
    window.currentState.userEmail  = null;
  }
<<<<<<< HEAD
  const navEl = document.getElementById("navbarUser");
  if (navEl) navEl.classList.add("hidden");
  window.location.href = 'index.html';
};

=======
  if (window.goToPage) window.goToPage("dashboard");
};

// ── Helper: human-readable Firebase error messages ──
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
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

<<<<<<< HEAD
function showAuthError(msg) {
  // Route to the currently visible page's error banner
  const visiblePage = _getVisibleAuthPage();
  const targetId = visiblePage === "login" ? "loginError" : "registerError";
  const errEl = document.getElementById(targetId);
  if (errEl) { errEl.textContent = msg; errEl.classList.remove("hidden"); }
  // Keep legacy authError in sync
  const legacy = document.getElementById("authError");
  if (legacy) { legacy.textContent = msg; legacy.classList.remove("hidden"); }
}

=======
// ── Helper: show error banner ──
function showAuthError(msg) {
  const errEl = document.getElementById("authError");
  if (errEl) {
    errEl.textContent = msg;
    errEl.classList.remove("hidden");
  }
}

// Override the original showAuthError so both modules share the same element
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
window.showAuthError = showAuthError;
