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

  // Determine mode from which page is currently visible — more reliable than authMode state
  const visiblePage = _getVisibleAuthPage();
  const mode = visiblePage === "register" ? "register" : (window.currentState?.authMode || "login");

  _clearAuthError();

  if (!email) { showAuthError("Please enter your XU email address."); return; }
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    showAuthError("Please use your official XU email address ending in @my.xu.edu.ph.");
    return;
  }
  if (!password) { showAuthError("Please enter your password."); return; }

  // Disable the visible submit button while processing
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
    }
    // Ensure sessionStorage is always set so registration.html can identify the user
    try { sessionStorage.setItem('sacdev_userEmail', user.email); } catch(e) {}
    try { localStorage.setItem('sacdev_lastEmail', user.email); } catch(e) {}
    applyNavbarProfile(user.email);
  }
});

// ── USER PROFILE (stored in localStorage keyed by email) ─────────────────────
function getUserProfile(email) {
  try {
    const raw = localStorage.getItem('sacdev_profile_' + email);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function saveUserProfile(email, profile) {
  try {
    localStorage.setItem('sacdev_profile_' + email, JSON.stringify(profile));
  } catch(e) {}
}

function showProfilePrompt(email, onComplete) {
  // Build the modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'profilePromptOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(15,23,42,0.55);
    display:flex;align-items:center;justify-content:center;z-index:99999;
    font-family:inherit;
  `;

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:36px 32px 28px;
                width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:48px;height:48px;background:#eff6ff;border-radius:12px;
                    display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f3a70" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 6px;">Complete Your Profile</h2>
        <p style="font-size:13px;color:#64748b;margin:0;">
          Please provide your details to continue.
        </p>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;">
            Complete Name <span style="color:#dc2626;">*</span>
          </label>
          <input id="profileName" type="text" placeholder="e.g. Juan Dela Cruz"
            style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #e2e8f0;
                   border-radius:8px;font-size:14px;font-family:inherit;color:#0f172a;outline:none;"
            onfocus="this.style.borderColor='#1f3a70'"
            onblur="this.style.borderColor='#e2e8f0'">
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;">
            Organization <span style="color:#dc2626;">*</span>
          </label>
          <input id="profileOrg" type="text" placeholder="e.g. Xavier Computer Enthusiasts' League"
            style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #e2e8f0;
                   border-radius:8px;font-size:14px;font-family:inherit;color:#0f172a;outline:none;"
            onfocus="this.style.borderColor='#1f3a70'"
            onblur="this.style.borderColor='#e2e8f0'">
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;">
            Position <span style="color:#dc2626;">*</span>
          </label>
          <select id="profilePosition"
            style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #e2e8f0;
                   border-radius:8px;font-size:14px;font-family:inherit;color:#0f172a;
                   background:#fff;outline:none;appearance:none;cursor:pointer;"
            onfocus="this.style.borderColor='#1f3a70'"
            onblur="this.style.borderColor='#e2e8f0'">
            <option value="" disabled selected>Select your position</option>
            <option value="President">President</option>
            <option value="Vice President">Vice President</option>
            <option value="Secretary">Secretary</option>
          </select>
        </div>
        <div id="profilePromptError" style="display:none;font-size:13px;color:#dc2626;
             background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:9px 12px;"></div>
        <button id="profileSaveBtn" onclick="submitProfilePrompt('${email}')"
          style="width:100%;padding:12px;background:#1f3a70;color:#fff;border:none;
                 border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;
                 font-family:inherit;margin-top:4px;transition:background 0.15s;"
          onmouseover="this.style.background='#16294f'"
          onmouseout="this.style.background='#1f3a70'">
          Save &amp; Continue →
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  window.submitProfilePrompt = function(emailAddr) {
    const name     = (document.getElementById('profileName').value || '').trim();
    const org      = (document.getElementById('profileOrg').value  || '').trim();
    const position = (document.getElementById('profilePosition').value || '').trim();
    const errEl    = document.getElementById('profilePromptError');
    const btn      = document.getElementById('profileSaveBtn');

    if (!name || !org || !position) {
      errEl.textContent = 'Please fill in all fields before continuing.';
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';
    btn.textContent = 'Saving…';
    btn.disabled = true;

    const profile = { name, org, position, email: emailAddr };
    saveUserProfile(emailAddr, profile);

    document.body.removeChild(overlay);
    onComplete(profile);
  };
}

function applyNavbarProfile(email) {
  const profile = getUserProfile(email);
  const nameEl  = document.getElementById('navbarName');
  const orgEl   = document.getElementById('navbarOrg');
  const userEl  = document.getElementById('navbarUser');

  if (nameEl) nameEl.textContent = profile ? profile.name     : email;
  if (orgEl)  orgEl.textContent  = profile ? profile.org      : '';
  if (userEl) userEl.classList.remove('hidden');

  // Also call the global updater if on index.html
  if (window.updateNavbarProfile && profile) {
    window.updateNavbarProfile(profile);
  }
}

function onLoginSuccess(email) {
  if (window.currentState) {
    window.currentState.isLoggedIn = true;
    window.currentState.userEmail  = email;
  }
  // Persist email so registration.html can restore the navbar
  try { sessionStorage.setItem('sacdev_userEmail', email); } catch(e) {}
  // Also persist to localStorage so status check works after logout
  try { localStorage.setItem('sacdev_lastEmail', email); } catch(e) {}

  const doNavigate = () => {
    if (window.location.pathname.includes('login.html') ||
        window.location.pathname === '/' ||
        window.location.pathname === '') {
      window.location.href = 'registration.html';
    } else if (window.goToPage) {
      window.goToPage("login");
    }
  };

  const proceed = (profile) => {
    applyNavbarProfile(email);
    if (window.syncProgressFromServer) {
      window.syncProgressFromServer(email).then(doNavigate).catch(doNavigate);
    } else {
      doNavigate();
    }
  };

  // Check if we already have a profile saved for this user
  const existingProfile = getUserProfile(email);
  if (existingProfile) {
    proceed(existingProfile);
  } else {
    // First time — show the profile prompt before navigating
    showProfilePrompt(email, proceed);
  }
}

window.handleSignOut = async function () {
  await signOut(auth);
  try { sessionStorage.removeItem('sacdev_userEmail'); } catch(e) {}
  // Note: sacdev_lastEmail in localStorage is intentionally kept so
  // the user can still check submission status after logging out
  if (window.currentState) {
    window.currentState.isLoggedIn = false;
    window.currentState.userEmail  = null;
  }
  const navEl  = document.getElementById("navbarUser");
  const nameEl = document.getElementById("navbarName");
  const orgEl  = document.getElementById("navbarOrg");
  if (navEl)  navEl.classList.add("hidden");
  if (nameEl) nameEl.textContent = '';
  if (orgEl)  orgEl.textContent  = '';
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
    case "auth/invalid-credential":     return "Incorrect email or password. Please try again.";
    case "auth/too-many-requests":      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed": return "Network error. Check your internet connection.";
    case "auth/popup-blocked":          return "Popup was blocked. Please allow popups for this site.";
    case "auth/invalid-action-code":    return "The reset link is invalid or has expired. Please request a new one.";
    case "auth/missing-email":          return "Please enter your email address.";
    case "auth/weak-password":          return "Password must be at least 6 characters.";
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
