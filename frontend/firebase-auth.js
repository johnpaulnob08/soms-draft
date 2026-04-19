import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

provider.setCustomParameters({
  prompt: "select_account",
  hd: "my.xu.edu.ph"
});

const ALLOWED_DOMAIN = "@my.xu.edu.ph";

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

    const result = await signInWithPopup(auth, provider);
    const user   = result.user;

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

  if (!email) { showAuthError("Please enter your XU email address."); return; }
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    showAuthError("Please use your official XU email address ending in @my.xu.edu.ph.");
    return;
  }
  if (!password) { showAuthError("Please enter your password."); return; }

  // Disable the visible submit button while processing
  const visiblePage  = _getVisibleAuthPage();
  const visibleBtnId = visiblePage === "login" ? "loginSubmitBtn" : "registerSubmitBtn";
  const visibleBtn   = document.getElementById(visibleBtnId);
  if (visibleBtn) { visibleBtn.disabled = true; visibleBtn.textContent = "Please wait…"; }

  try {
    if (mode === "register") {
      if (password.length < 6) { showAuthError("Password must be at least 6 characters."); return; }
      if (password !== confirm) { showAuthError("Passwords do not match."); return; }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      onLoginSuccess(cred.user.email);
    } else {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess(cred.user.email);
    }
  } catch (err) {
    showAuthError(friendlyError(err));
  } finally {
    if (visibleBtn) {
      visibleBtn.disabled = false;
      visibleBtn.textContent = mode === "register" ? "Register →" : "Log In →";
    }
  }
};

onAuthStateChanged(auth, (user) => {
  if (user && user.email.endsWith(ALLOWED_DOMAIN)) {
    if (window.currentState) {
      window.currentState.isLoggedIn = true;
      window.currentState.userEmail  = user.email;
      const navEl = document.getElementById("navbarEmail");
      if (navEl) navEl.textContent = user.email;
    }
  }
});

function onLoginSuccess(email) {
  if (window.currentState) {
    window.currentState.isLoggedIn = true;
    window.currentState.userEmail  = email;
  }
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
  if (window.currentState) {
    window.currentState.isLoggedIn = false;
    window.currentState.userEmail  = null;
  }
  const navEl = document.getElementById("navbarUser");
  if (navEl) navEl.classList.add("hidden");
  window.location.href = 'index.html';
};

window.handlePasswordReset = async function (email) {
  await sendPasswordResetEmail(auth, email);
};

function friendlyError(err) {
  switch (err.code) {
    case "auth/email-already-in-use":   return "This email is already registered. Try logging in instead.";
    case "auth/invalid-email":          return "Invalid email address format.";
    case "auth/wrong-password":         return "Incorrect password. Please try again.";
    case "auth/user-not-found":         return "No account found with this email. Please register first.";
    case "auth/too-many-requests":      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed": return "Network error. Check your internet connection.";
    case "auth/popup-blocked":          return "Popup was blocked. Please allow popups for this site.";
    case "auth/invalid-action-code":    return "The reset link is invalid or has expired. Please request a new one.";
    case "auth/missing-email":          return "Please enter your email address.";
    default:                            return err.message || "An error occurred. Please try again.";
  }
}

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

window.showAuthError = showAuthError;
