const councils = {
    CSG: {
        name: 'Central Student Government',
        isCouncilOrg: true,
        orgs: []
    },
    AECO: {
        name: 'Assembly of Extra-Curricular Organizations',
        isCouncilOrg: true,
        orgs: [
            'Atenista Ako Movement (AAM)',
            'Ateneo Camera Club (ACC)',
            'Ateneo Diplomatic Corps (ADC)',
            'Ateneo Mountaineering Society (AMS)',
            'Ateneo Rover Circle (ARC)',
            'Ateneo School for Upcoming Leaders (ASUL)',
            'Association of Xavier University Oro Scholars (AXUOS)',
            'Circulo de Arte (CDA)',
            'Crusader Publication (CRUSADER)',
            'Crusader Yearbook (CYB)',
            'Google Developers Student Clubs (GDSC)',
            'Kaliwat Ki Apu Aguy (KALIWAT)',
            'Nature Crusaders of the Philippines Foundation (NCPF)',
            'Soundtable (SOUNDTABLE)',
            'STREAMS – Pathways to Higher Education (STREAMS)',
            'Xavier Ateneo Film Society (XAFS)',
            'Xavier Campus Esports and Entertainment Development (XCEED)',
            'Xavier Philharmonia (XU PHIL)',
            'Xavier University Band (XU BAND)',
            'Xavier University Cultural Dance Troupe (XUCDT)',
            'Xavier University Glee Club (XUGC)',
            'XU Bullriders (BULLRIDERS)',
            'Xavier University Japan Karate Association (XU JKA)',
            'Xavier University Red Cross Youth (XU RCY)',
            'Graduate School Student Council (GSSC)'
        ]
    },
    ACES: {
        name: 'Association of the College of Engineering Students',
        isCouncilOrg: true,
        orgs: [
            'Institute of Integrated Electrical Engineers (IIEE)',
            'Junior Institute of Electronics Engineers of the Philippines (JIECEP)',
            'Junior Philippine Institute of Chemical Engineers - XU Chapter (JPIChE)',
            'Junior Philippine Society of Mechanical Engineers - XU Chapter (JPSME)',
            'Philippine Institute of Civil Engineers - XU Student Chapter (PICE)',
            'Philippine Institute of Industrial Engineers - XU Student Chapter (PIIE)'
        ]
    },
    ASC: {
        name: 'Agriculture Student Council',
        isCouncilOrg: true,
        orgs: [
            'Ateneo Agri-Business Circle (AAC)',
            'Ateneo Crop Science Society (ACROSS)',
            'Ateneo Society of Agricultural Economists (ASAGE)',
            'Junior Philippine Society of Animal Science (JPSAS)',
            'Philippine Association of Food Technologists (PAFT)',
            'Philippine Society of Agricultural and Biosystems Engineers Pre-Professional Group – XU Chapter (PSABE-PPG)',
            'Philippine Association of Agriculturists – Junior Chapter (PAA Jrs)'
        ]
    },
    CONUS: {
        name: 'Council of Nursing Students',
        isCouncilOrg: true,
        orgs: []
    },
    CSSC: {
        name: 'Computer Studies Student Council',
        isCouncilOrg: true,
        orgs: [
            'Ateneo Information Systems Student Association (AISSA)',
            'Xavier Computer Enthusiasts\' League (XCEL)',
            'Xavier Circle of Information Technology (XCITeS)'
        ]
    },
    SBMSC: {
        name: 'School of Business Management Student Council',
        isCouncilOrg: true,
        orgs: [
            'Junior Financial Executives (JFINEX)',
            'Junior Marketing Association (JMA)',
            'Junior Philippine Institute of Accountants (JPIA)',
            'Junior Philippine Association of Management Accountants – XU Chapter (XU-JPAMA)'
        ]
    },
    TG: {
        name: 'Teacher\'s Guild',
        isCouncilOrg: true,
        orgs: [
            'Kabalikat na Atenista sa Filipino (KAFIL)',
            'Xavier English Language and Literature Organization (XELLO)',
            'Xavier University Association of Science Educators – School of Education (XASED)',
            'Xavier University Holistic Union of General Educators (XU-HUGE)',
            'Xavier University Kapisanan ng mga Atenista sa Araling Panlipunan (XU-KASAPI)',
            'Xavier University Special Educators\' Society (SPEDSOC)',
            'Xavier University School of Education Literary and Communications Society (XUSELICS)'
        ]
    },
    UNITASS: {
        name: 'United Arts and Sciences Student Council',
        isCouncilOrg: true,
        orgs: [
            'Ateneo Diplomatic Corps (ADC)',
            'Ateneo Historical Society (AHS)',
            'Ateneo Philosophy Club (APC)',
            'Chemistry Society (CHEMSOC)',
            'Development Communication Society (DEVCOMSOC)',
            'Economics Society (ECOSOC)',
            'Mathematics Society (MATHSOC)',
            'Biophilic Society (BIOPHILIC)',
            'Xavier International Students Association (XISA)',
            'Xavier University Psychology Society (XUPS)',
            'Xavier Ateneo Sociology Society (XASS)'
        ]
    }
};

// ═══════════════════════════════════════════════════
// CLOUDINARY UPLOAD HELPER
// ═══════════════════════════════════════════════════
const CLOUDINARY_CLOUD   = 'dk5ugzukb';
const CLOUDINARY_PRESET  = 'sacdev_uploads';

async function uploadToCloudinary(file) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const resourceType = isPdf ? 'raw' : 'image';

    // Strip extension for public_id — Cloudinary adds it back for raw files
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
    const publicId  = `sacdev/${safeName}_${Date.now()}`;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
    fd.append('public_id', publicId);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`,
        { method: 'POST', body: fd }
    );
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Cloudinary upload failed: ' + res.statusText);
    }
    const data = await res.json();

    // For PDFs: append .pdf to the secure_url so browsers serve it with correct content-type
    let url = data.secure_url;
    if (isPdf && !url.endsWith('.pdf')) url = url + '.pdf';
    return url;
}



// STATE

let currentState = {
    selectedCouncil: null,
    selectedOrg: null,
    isLoggedIn: false,
    userEmail: null,
    authMode: 'login',        // 'register' | 'login' — login shown first by default
    dashTab: 'home',      // active dashboard tab
    // org info
    orgName: null,
    orgEmail: null,
    orgType: null,
    yearEstablished: null,
    orgCluster: null,
    presidentName: null,
    presidentMobile: null,
    presidentEmail: null,
    presidentStudentId: null,
    moderatorName: null
};

// ROUTING
function goToPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageName).classList.remove('hidden');
    window.scrollTo(0, 0);
    // Persist current page so refresh restores position
    try { sessionStorage.setItem('sacdev_currentPage', pageName); } catch(e) {}

    document.querySelectorAll('[id^="progress-circle-"]').forEach(el => el.remove());

    // Show/hide global form sidebar
    const formPages = ['orgInfo','strategicPlan','presidentProfile','orgOfficers','orgMembers','moderatorProfile','gradeAndDocs','submissionSummary'];
    const sidenav = document.getElementById('formSidenav');
    if (formPages.includes(pageName)) {
        sidenav.classList.remove('hidden');
        document.body.classList.add('has-form-sidenav');
        // Highlight active item
        document.querySelectorAll('.form-sidenav-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.getElementById('snav-' + pageName);
        if (activeItem) activeItem.classList.add('active');
    } else {
        sidenav.classList.add('hidden');
        document.body.classList.remove('has-form-sidenav');
    }

    if (pageName === 'dashboard')     initDashboard();
    if (pageName === 'councilDetail') initCouncilDetail();
    if (pageName === 'loginPage')     { currentState.authMode = 'login';    initLoginPage(); }
    if (pageName === 'registerPage')  { currentState.authMode = 'register'; initRegisterPage(); }
    if (pageName === 'auth')          initAuth();
    if (pageName === 'councilSelect') initCouncilSelect();
    if (pageName === 'orgSelect')     initOrgSelect();
    if (pageName === 'orgInfo')       { initOrgInfo(); initOrgInfoProgress(); }
    if (pageName === 'strategicPlan')   { initStrategicPlan(); createProgressCircle('strategicPlan'); updateStratPlanProgress(); }
    if (pageName === 'presidentProfile') { initPresidentProfile(); createProgressCircle('presidentProfile'); updatePresidentProgress(); }
    if (pageName === 'orgOfficers')      { initOrgOfficers(); createProgressCircle('orgOfficers'); updateOfficersProgress(); }
    if (pageName === 'orgMembers')       { initOrgMembers(); createProgressCircle('orgMembers'); updateMembersProgress(); }
    if (pageName === 'moderatorProfile') { initModeratorProfile(); createProgressCircle('moderatorProfile'); updateModeratorProgress(); }
    if (pageName === 'gradeAndDocs')     { initGradeAndDocs(); createProgressCircle('gradeAndDocs'); updateGradeDocsProgress(); }
}

// Navigate from sidebar — saves current form data first
function snavGo(page) {
    const currentPage = [...document.querySelectorAll('.page')].find(p => !p.classList.contains('hidden'));
    if (currentPage) {
        const id = currentPage.id;
        if (['orgInfo','strategicPlan','presidentProfile','orgOfficers','orgMembers','moderatorProfile','gradeAndDocs'].includes(id)) {
            saveFormData(id);
        }
    }
    goToPage(page);
}

// HELPERS
function getSortedCouncils() {
    const others = Object.keys(councils)
        .filter(k => k !== 'CSG' && k !== 'AECO')
        .sort();
    return ['CSG', 'AECO', ...others];
}

// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// CLUSTER DATA
// ═══════════════════════════════════════════════════
const clusters = {
    'Business Environment': [
        'Junior Financial Executives (JFINEX)',
        'Junior Marketing Association (JMA)',
        'Junior Philippine Institute of Accountants (JPIA)',
        'Junior Philippine Association of Management Accountants – XU Chapter (XU-JPAMA)'
    ],
    'Faith Formation': [
        'Atenista Ako Movement (AAM)',
        'SIRAJ MRO - Xavier University (SIRAJ MRO)'
    ],
    'Food and Agriculture': [
        'Ateneo Agri-Business Circle (AAC)',
        'Ateneo Crop Science Society (ACROSS)',
        'Ateneo Society of Agricultural Economists (ASAGE)',
        'Junior Philippine Society of Animal Science (JPSAS)',
        'Philippine Association of Food Technologists (PAFT)',
        'Philippine Association of Agriculturists – Junior Chapter (PAA Jrs)',
        'Philippine Society of Agricultural and Biosystems Engineers Pre-Professional Group – XU Chapter (PSABE-PPG)'
    ],
    'Governance and Policy Making': [
        'Central Student Government (CSG)',
        'Assembly of Extra-Curricular Organizations (AECO)',
        'Association of the College of Engineering Students (ACES)',
        'Agriculture Student Council (ASC)',
        'Council of Nursing Students (CONUS)',
        'Computer Studies Student Council (CSSC)',
        'School of Business Management Student Council (SBMSC)',
        'Teacher\'s Guild (TG)',
        'United Arts and Sciences Student Council (UNITASS)'
    ],
    'Media and Arts': [
        'Ateneo Camera Club (ACC)',
        'Circulo de Arte (CDA)',
        'Crusader Publication (CRUSADER)',
        'Crusader Yearbook (CYB)',
        'Soundtable (SOUNDTABLE)',
        'Xavier Ateneo Film Society (XAFS)',
        'Xavier Philharmonia (XU PHIL)',
        'Xavier University Band (XU BAND)',
        'Xavier University Cultural Dance Troupe (XUCDT)',
        'Xavier University Glee Club (XUGC)'
    ],
    'Natural Sciences, Engineering and Technology': [
        'Ateneo Information Systems Student Association (AISSA)',
        'Biophilic Society (BIOPHILIC)',
        'Chemistry Society (CHEMSOC)',
        'Google Developers Student Clubs (GDSC)',
        'Institute of Integrated Electrical Engineers (IIEE)',
        'Junior Institute of Electronics Engineers of the Philippines (JIECEP)',
        'Junior Philippine Institute of Chemical Engineers - XU Chapter (JPIChE)',
        'Junior Philippine Society of Mechanical Engineers - XU Chapter (JPSME)',
        'Mathematics Society (MATHSOC)',
        'Philippine Institute of Civil Engineers - XU Student Chapter (PICE)',
        'Philippine Institute of Industrial Engineers - XU Student Chapter (PIIE)',
        'Xavier Circle of Information Technology (XCITeS)',
        'Xavier Computer Enthusiasts\' League (XCEL)'
    ],
    'Program-Based Professional Organization': [
        'Ateneo Historical Society (AHS)',
        'Ateneo Philosophy Club (APC)',
        'Ateneo School for Upcoming Leaders (ASUL)',
        'Development Communication Society (DEVCOMSOC)',
        'Economics Society (ECOSOC)',
        'Graduate School Student Council (GSSC)',
        'Xavier Ateneo Sociology Society (XASS)',
        'Xavier University Psychology Society (XUPS)'
    ],
    'Service-Learning': [
        'Ateneo Rover Circle (ARC)',
        'Nature Crusaders of the Philippines Foundation (NCPF)',
        'STREAMS – Pathways to Higher Education (STREAMS)',
        'Xavier English Language and Literature Organization (XELLO)',
        'Xavier University Association of Science Educators – School of Education (XASED)',
        'Xavier University Holistic Union of General Educators (XU-HUGE)',
        'Xavier University Red Cross Youth (XU RCY)',
        'Xavier University School of Education Literary and Communications Society (XUSELICS)',
        'Xavier University Special Educators\' Society (SPEDSOC)'
    ],
    'Socio-Cultural': [
        'Ateneo Diplomatic Corps (ADC)',
        'Association of Xavier University Oro Scholars (AXUOS)',
        'Kabalikat na Atenista sa Filipino (KAFIL)',
        'Kaliwat Ki Apu Aguy (KALIWAT)',
        'Xavier International Students Association (XISA)',
        'Xavier University Kapisanan ng mga Atenista sa Araling Panlipunan (XU-KASAPI)'
    ],
    'Sports and Recreation': [
        'Ateneo Mountaineering Society (AMS)',
        'Xavier Campus Esports and Entertainment Development (XCEED)',
        'XU Bullriders (BULLRIDERS)',
        'Xavier University Japan Karate Association (XU JKA)'
    ]
};

const councilsOrdered = [
    { key: 'CSG',    name: 'Central Student Government' },
    { key: 'AECO',   name: 'Assembly of Extra-Curricular Organizations' },
    { key: 'ACES',   name: 'Association of the College of Engineering Students' },
    { key: 'ASC',    name: 'Agriculture Student Council' },
    { key: 'CONUS',  name: 'Council of Nursing Students' },
    { key: 'CSSC',   name: 'Computer Studies Student Council' },
    { key: 'SBMSC',  name: 'School of Business Management Student Council' },
    { key: 'TG',     name: 'Teacher\'s Guild' },
    { key: 'UNITASS',name: 'United Arts and Sciences Student Council' }
];

// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════
function initDashboard() {

    const savedTab = (function() {
        try { return sessionStorage.getItem('sacdev_dashTab'); } catch(e) { return null; }
    })();
    switchDashTab(savedTab || currentState.dashTab || 'home');
}

function switchDashTab(tab) {
    currentState.dashTab = tab;
    try { sessionStorage.setItem('sacdev_dashTab', tab); } catch(e) {}

    // Toggle nav button active state
    document.querySelectorAll('.dash-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Toggle tab panels
    document.querySelectorAll('.dash-tab').forEach(el => el.classList.add('hidden'));
    const activePanel = document.getElementById('dashTab-' + tab);
    if (activePanel) activePanel.classList.remove('hidden');

    // Show "Proceed to Registration" only on Home tab
    const proceedBtn = document.querySelector('.dash-proceed');
    if (proceedBtn) proceedBtn.style.display = tab === 'home' ? '' : 'none';

    // Render content
    if (tab === 'directory') renderDirectory('');
    if (tab === 'councils')  renderCouncils();
    if (tab === 'clusters')  renderClusters();
}

async function renderHomeStatus() {
    const section = document.getElementById('applicationStatusSection');
    if (!section) return;

    // Try to get email — works even after logout via localStorage
    const email = (window.currentState && currentState.userEmail)
        || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sacdev_userEmail'))
        || (typeof localStorage  !== 'undefined' && localStorage.getItem('sacdev_lastEmail'));

    if (!email) {
        section.innerHTML = '';
        return;
    }

    section.innerHTML = `<div class="home-status-card home-status-loading">Checking submission status…</div>`;

    try {
        const res  = await fetch('/submission-status?email=' + encodeURIComponent(email));
        const data = await res.json();

        if (!data || !data.found) {
            section.innerHTML = '';
            return;
        }

        const statusMap = {
            approved: { label: 'Approved',     bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
            rejected: { label: 'Not Approved', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
            pending:  { label: 'Under Review', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
            revision: { label: 'For Revision', bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
        };
        const st = statusMap[data.status] || statusMap.pending;

        const revisionBlock = (data.status === 'revision' && data.revisionNotes)
            ? `<div class="home-status-notes">
                <div class="home-status-notes-label">Required Revisions from OSA-SACDEV:</div>
                <div class="home-status-notes-text">${data.revisionNotes}</div>
               </div>` : '';

        const rejectionBlock = (data.status === 'rejected' && data.rejectionReason)
            ? `<div class="home-status-rejection">
                <div class="home-status-notes-label">Reason from OSA-SACDEV:</div>
                <div class="home-status-notes-text">${data.rejectionReason}</div>
               </div>` : '';

        const resubmitBtn = data.status === 'revision'
            ? `<a href="registration.html" class="home-status-resubmit">↩ Go to Resubmit</a>` : '';

        section.innerHTML = `
            <div class="home-status-card" style="border-color:${st.border};">
                <div class="home-status-header">
                    <div class="home-status-org">${data.org || data.orgName || '—'}</div>
                    <span class="home-status-badge" style="background:${st.bg};color:${st.color};border:1.5px solid ${st.border};">${st.label}</span>
                </div>
                <div class="home-status-meta">
                    <span>Submitted: ${data.submittedAt || '—'}</span>
                    <span>Email: ${data.email || data.orgEmail || email}</span>
                </div>
                ${revisionBlock}
                ${rejectionBlock}
                ${resubmitBtn}
            </div>
        `;
    } catch(e) {
        section.innerHTML = '';
    }
}


function renderDirectory(query) {
    const container = document.getElementById('directoryList');
    // Collect all orgs from cluster data, deduplicated, alphabetically sorted
    const allOrgsSet = new Set();
    Object.values(clusters).forEach(orgs => orgs.forEach(o => allOrgsSet.add(o)));
    let allOrgs = [...allOrgsSet].sort((a, b) => a.localeCompare(b));

    const q = (query || '').toLowerCase().trim();
    if (q) allOrgs = allOrgs.filter(o => o.toLowerCase().includes(q));

    container.innerHTML = '';
    if (allOrgs.length === 0) {
        container.innerHTML = '<p class="dash-empty">No organizations found.</p>';
        return;
    }
    allOrgs.forEach(org => {
        const item = document.createElement('div');
        item.className = 'dash-org-item dash-org-item-clickable';
        item.title = 'Click to view strategic plans';
        item.textContent = org;
        item.onclick = () => openOrgPlansModal(org);
        container.appendChild(item);
    });
}

function filterDirectory(value) {
    renderDirectory(value);
}

function renderCouncils() {
    const container = document.getElementById('councilsList');
    container.innerHTML = '';
    councilsOrdered.forEach(c => {
        const item = document.createElement('div');
        item.className = 'dash-council-item dash-org-item-clickable';
        item.title = 'Click to view strategic plans';
        // Use same format as clusters data: "Central Student Government (CSG)"
        // This matches the org names in Directory and Clusters tabs
        const councilOrgName = `${councils[c.key].name} (${c.key})`;
        item.innerHTML = `<span class="dash-council-key">${c.key}</span><span class="dash-council-name">${councils[c.key].name}</span><span class="dash-council-arrow">›</span>`;
        item.onclick = () => openOrgPlansModal(councilOrgName);
        container.appendChild(item);
    });
}

function renderClusters() {
    const container = document.getElementById('clustersList');
    container.innerHTML = '';
    const sortedClusterNames = Object.keys(clusters).sort();
    sortedClusterNames.forEach(clusterName => {
        const block = document.createElement('div');
        block.className = 'dash-cluster-block';
        const sortedOrgs = clusters[clusterName].slice().sort((a, b) => a.localeCompare(b));
        const titleEl = document.createElement('div');
        titleEl.className = 'dash-cluster-title';
        titleEl.textContent = clusterName;
        block.appendChild(titleEl);
        const ul = document.createElement('ul');
        ul.className = 'dash-cluster-orgs';
        sortedOrgs.forEach(org => {
            const li = document.createElement('li');
            li.className = 'dash-cluster-org-item';
            li.title = 'Click to view strategic plans';
            li.textContent = org;
            li.onclick = () => openOrgPlansModal(org);
            ul.appendChild(li);
        });
        block.appendChild(ul);
        container.appendChild(block);
    });
}

function createCouncilCard(key) {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => {
        currentState.selectedCouncil = key;
        goToPage('councilDetail');
    };
    const count = councils[key].orgs.length + (councils[key].isCouncilOrg ? 1 : 0);
    card.innerHTML = `
        <div class="card-icon">›</div>
        <h3>${key}</h3>
        <p>${councils[key].name}</p>
        <div class="card-meta">${count} organization${count !== 1 ? 's' : ''}</div>
    `;
    return card;
}

// ═══════════════════════════════════════════════════
// COUNCIL DETAIL (public view)
// ═══════════════════════════════════════════════════
function initCouncilDetail() {
    const key = currentState.selectedCouncil;
    document.getElementById('councilDetailTitle').textContent = key;
    document.getElementById('councilDetailDesc').textContent = councils[key].name;
    const list = document.getElementById('orgListDetail');
    list.innerHTML = '';
    getOrgChoices(key).forEach(org => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `<span>${org}</span><span>›</span>`;
        list.appendChild(item);
    });
}

// Returns full org list: council una tapos  orgs under niya
function getOrgChoices(key) {
    const councilEntry = `${key} – ${councils[key].name}`;
    const subOrgs = councils[key].orgs.slice().sort();
    return [councilEntry, ...subOrgs];
}

// AUTH — separate Login and Register pages
function initLoginPage() {
    const e = document.getElementById('loginEmail');
    const p = document.getElementById('loginPassword');
    const err = document.getElementById('loginError');
    if (e) e.value = '';
    if (p) p.value = '';
    if (err) { err.classList.add('hidden'); err.textContent = ''; }
    // reset google button label
    const gb = document.getElementById('googleBtnText');
    if (gb) gb.textContent = 'Continue with Google (@my.xu.edu.ph)';
    const gsb = document.getElementById('googleSignInBtn');
    if (gsb) { gsb.disabled = false; gsb.style.opacity = '1'; }
}

function initRegisterPage() {
    const e = document.getElementById('registerEmail');
    const p = document.getElementById('registerPassword');
    const c = document.getElementById('registerConfirm');
    const err = document.getElementById('registerError');
    if (e) e.value = '';
    if (p) p.value = '';
    if (c) c.value = '';
    if (err) { err.classList.add('hidden'); err.textContent = ''; }
    const gb = document.getElementById('googleRegisterBtnText');
    if (gb) gb.textContent = 'Continue with Google (@my.xu.edu.ph)';
    const gsb = document.getElementById('googleRegisterBtn');
    if (gsb) { gsb.disabled = false; gsb.style.opacity = '1'; }
}

// Keep initAuth as no-op for backward-compat (firebase-auth.js may call it indirectly)
function initAuth() {}

// setAuthMode / toggleAuthMode kept for backward-compat with firebase-auth.js
function setAuthMode(mode) { currentState.authMode = mode; }
function toggleAuthMode() {
    goToPage(currentState.authMode === 'register' ? 'loginPage' : 'registerPage');
}

// handleLogin — called by loginPage submit button
function handleLogin() {
    currentState.authMode = 'login';
    // Sync loginPage fields → legacy auth fields that firebase-auth.js reads
    const le = document.getElementById('loginEmail');
    const lp = document.getElementById('loginPassword');
    const ae = document.getElementById('authEmail');
    const ap = document.getElementById('authPassword');
    const ac = document.getElementById('authConfirm');
    if (ae && le) ae.value = le.value;
    if (ap && lp) ap.value = lp.value;
    if (ac) ac.value = '';
    if (window.handleAuth) window.handleAuth();
    else console.warn('handleAuth not ready yet');
}

// handleRegister — called by registerPage submit button
function handleRegister() {
    currentState.authMode = 'register';
    const re = document.getElementById('registerEmail');
    const rp = document.getElementById('registerPassword');
    const rc = document.getElementById('registerConfirm');
    const ae = document.getElementById('authEmail');
    const ap = document.getElementById('authPassword');
    const ac = document.getElementById('authConfirm');
    if (ae && re) ae.value = re.value;
    if (ap && rp) ap.value = rp.value;
    if (ac && rc) ac.value = rc.value;
    if (window.handleAuth) window.handleAuth();
    else console.warn('handleAuth not ready yet');
}

// Route error display to the currently visible auth page
window.showAuthError = function(msg) {
    const loginVisible = document.getElementById('loginPage') &&
                         !document.getElementById('loginPage').classList.contains('hidden');
    const targetId = loginVisible ? 'loginError' : 'registerError';
    const errEl = document.getElementById(targetId);
    if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
    // keep legacy authError in sync so firebase-auth.js internal checks work
    const legacy = document.getElementById('authError');
    if (legacy) { legacy.textContent = msg; legacy.classList.remove('hidden'); }
};


function handleLogout() {
    // Sign out na siya sa Firebase 
    if (window.handleSignOut) {
        window.handleSignOut();
        return;
    }
    currentState.isLoggedIn = false;
    currentState.userEmail  = null;
    document.getElementById('navbarUser').classList.add('hidden');
    document.getElementById('navbarEmail').textContent = '';
    goToPage('dashboard');
}


// COUNCIL SELECT
function initCouncilSelect() {
    const list = document.getElementById('councilSelectList');
    list.innerHTML = '';
    getSortedCouncils().forEach(key => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.onclick = () => {
            currentState.selectedCouncil = key;
            goToPage('orgSelect');
        };
        item.innerHTML = `
            <div>
                <div style="font-weight:600;">${key}</div>
                <div style="font-size:12px;color:#94a3b8;margin-top:4px;">${councils[key].name}</div>
            </div>
            <span>›</span>
        `;
        list.appendChild(item);
    });
}

// ORG SELECT
function initOrgSelect() {
    const key = currentState.selectedCouncil;
    document.getElementById('orgSelectCouncil').textContent = councils[key].name;
    const list = document.getElementById('orgSelectList');
    list.innerHTML = '';

    getOrgChoices(key).forEach((org, idx) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        if (idx === 0) {
            // Council itself — highlight
            item.classList.add('list-item-council');
        }
        item.onclick = () => {
            currentState.selectedOrg = org;
            goToPage('guidelines');
        };
        item.innerHTML = `
            <div>
                <span>${org}</span>
                ${idx === 0 ? '<span class="council-badge">Council</span>' : ''}
            </div>
            <span>›</span>
        `;
        list.appendChild(item);
    });
}

// ═══════════════════════════════════════════════════
// GUIDELINES
// ═══════════════════════════════════════════════════
function proceedWithConfirm() {
    if (confirm('I confirm that I have read and understood all the re-registration guidelines. Proceed?')) {
        goToPage('orgInfo');
    }
}

// ═══════════════════════════════════════════════════
// ORG INFO
// ═══════════════════════════════════════════════════
function initOrgInfo() {
    // Populate org name dropdown grouped by cluster (alphabetical within each)
    const orgSelect = document.getElementById('infoOrgName');
    if (orgSelect && orgSelect.options.length <= 1) {
        const sortedClusters = Object.keys(clusters).sort();
        sortedClusters.forEach(clusterName => {
            const group = document.createElement('optgroup');
            group.label = clusterName;
            const sortedOrgs = clusters[clusterName].slice().sort((a, b) => a.localeCompare(b));
            sortedOrgs.forEach(org => {
                const opt = document.createElement('option');
                opt.value = org;
                opt.textContent = org;
                group.appendChild(opt);
            });
            orgSelect.appendChild(group);
        });
    }
    if (currentState.orgName)         document.getElementById('infoOrgName').value            = currentState.orgName;
    if (currentState.orgEmail)        document.getElementById('infoOrgEmail').value           = currentState.orgEmail;
    if (currentState.orgType)          document.getElementById('infoOrgType').value           = currentState.orgType;
    if (currentState.orgCluster)       document.getElementById('infoCluster').value            = currentState.orgCluster;
    if (currentState.yearEstablished)  document.getElementById('infoYearEstablished').value    = currentState.yearEstablished;
    if (currentState.presidentName)    document.getElementById('infoPresidentName').value      = currentState.presidentName;
    if (currentState.presidentMobile)  document.getElementById('infoPresidentMobile').value    = currentState.presidentMobile;
    if (currentState.presidentEmail)   document.getElementById('infoPresidentEmail').value     = currentState.presidentEmail;
    if (currentState.moderatorName)    document.getElementById('infoModeratorName').value      = currentState.moderatorName;
}

// When org name is selected, auto-populate cluster if it can be determined
function onOrgNameChange(orgName) {
    if (!orgName) return;
    // Find which cluster this org belongs to
    for (const [clusterName, orgs] of Object.entries(clusters)) {
        if (orgs.includes(orgName)) {
            const clusterEl = document.getElementById('infoCluster');
            if (clusterEl) clusterEl.value = clusterName;
            break;
        }
    }
    updateOrgInfoProgress();
}

function submitOrgInfo() {
    const orgName  = document.getElementById('infoOrgName').value.trim();
    const orgEmail = document.getElementById('infoOrgEmail').value.trim();
    const orgType  = document.getElementById('infoOrgType').value.trim();
    const cluster  = document.getElementById('infoCluster').value.trim();
    const yearEst  = document.getElementById('infoYearEstablished').value.trim();
    const presName = document.getElementById('infoPresidentName').value.trim();
    const presMob  = document.getElementById('infoPresidentMobile').value.trim();
    const presEmail= document.getElementById('infoPresidentEmail').value.trim();
    const modName  = document.getElementById('infoModeratorName').value.trim();

    if (!orgName)   { alert('Please select your Organization Name.');      document.getElementById('infoOrgName').focus();         return; }
    if (!orgEmail)  { alert('Please enter the Organization Email.');       document.getElementById('infoOrgEmail').focus();        return; }
    if (!orgType)   { alert('Please select a Type of Organization.');      document.getElementById('infoOrgType').focus();         return; }
    if (!cluster)   { alert('Please select an Org Cluster.');              document.getElementById('infoCluster').focus();         return; }
    if (!presName)  { alert("Please enter the President's Full Name.");    document.getElementById('infoPresidentName').focus();    return; }
    if (!presMob)   { alert("Please enter the President's Mobile Number.");document.getElementById('infoPresidentMobile').focus();  return; }
    if (!presEmail) { alert("Please enter the President's Email Address.");document.getElementById('infoPresidentEmail').focus();   return; }
    if (!modName)   { alert('Please enter the Name of Moderator-Nominee.');document.getElementById('infoModeratorName').focus();   return; }

    currentState.orgName         = orgName;
    currentState.orgEmail        = orgEmail;
    currentState.orgType         = orgType;
    currentState.orgCluster      = cluster;
    currentState.yearEstablished = yearEst;
    currentState.presidentName   = presName;
    currentState.presidentMobile = presMob;
    currentState.presidentEmail  = presEmail;
    currentState.moderatorName   = modName;

    saveFormData('orgInfo');
    // Persist state fields for page refresh restoration
    try {
        sessionStorage.setItem('sacdev_state', JSON.stringify({
            orgName:         currentState.orgName,
            orgEmail:        currentState.orgEmail,
            orgType:         currentState.orgType,
            orgCluster:      currentState.orgCluster,
            yearEstablished: currentState.yearEstablished,
            presidentName:   currentState.presidentName,
            presidentMobile: currentState.presidentMobile,
            presidentEmail:  currentState.presidentEmail,
            moderatorName:   currentState.moderatorName,
            selectedOrg:     currentState.selectedOrg,
            selectedCouncil: currentState.selectedCouncil,
            userEmail:       currentState.userEmail,
            isLoggedIn:      currentState.isLoggedIn,
        }));
    } catch(e) {}
    goToPage('strategicPlan');
}

// ═══════════════════════════════════════════════════
// STRATEGIC PLAN
// ═══════════════════════════════════════════════════
function initStrategicPlan() {
    // Pre-fill org name from orgInfo selection
    const orgNameEl = document.getElementById('stratOrgFullName');
    if (orgNameEl && !orgNameEl.value) {
        orgNameEl.value = currentState.orgName || currentState.selectedOrg || '';
    }
    // Seed rows if empty
    ['bodyOrgDev','bodyStudServ','bodyCommInv'].forEach(id => {
        if (!document.getElementById(id).hasChildNodes()) {
            addRow(id, id.replace('body','total').replace('OrgDev','OrgDev').replace('StudServ','StudServ').replace('CommInv','CommInv'));
            addRow(id, id.replace('body','total').replace('OrgDev','OrgDev').replace('StudServ','StudServ').replace('CommInv','CommInv'));
        }
    });
    // Attach live listeners to core text fields
    ['stratAcronym','stratOrgFullName','stratMission','stratVision'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateStratPlanProgress);
    });
    updateStratPlanProgress();
}

function addRow(bodyId, totalId) {
    const tbody = document.getElementById(bodyId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" class="strat-cell-input"></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><input type="number" class="strat-cell-input strat-budget-cell" placeholder="0.00" min="0" oninput="recalcTotal('${bodyId}','${totalId}')"></td>
        <td><button class="btn-del-row" onclick="deleteRow(this, '${bodyId}', '${totalId}')" title="Remove row">&#215;</button></td>
    `;
    tbody.appendChild(tr);
    // Attach progress listeners to project name cell (2nd td textarea)
    const projectNameTA = tr.querySelector('td:nth-child(2) textarea');
    if (projectNameTA) projectNameTA.addEventListener('input', updateStratPlanProgress);
}

function deleteRow(btn, bodyId, totalId) {
    const tbody = document.getElementById(bodyId);
    if (tbody.rows.length <= 1) { alert('At least one row is required.'); return; }
    btn.closest('tr').remove();
    recalcTotal(bodyId, totalId);
}

function recalcTotal(bodyId, totalId) {
    const tbody = document.getElementById(bodyId);
    let sum = 0;
    tbody.querySelectorAll('.strat-budget-cell').forEach(inp => {
        sum += parseFloat(inp.value) || 0;
    });
    const totalEl = document.getElementById(totalId);
    if (totalEl) totalEl.value = sum > 0 ? 'Php ' + sum.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
    // Sync budget summary from table totals
    syncBudgetSummary();
    updateStratPlanProgress();
}

function syncBudgetSummary() {
    const getTableSum = (bodyId) => {
        let s = 0;
        document.getElementById(bodyId).querySelectorAll('.strat-budget-cell').forEach(inp => {
            s += parseFloat(inp.value) || 0;
        });
        return s;
    };
    const a = getTableSum('bodyOrgDev');
    const b = getTableSum('bodyStudServ');
    const c = getTableSum('bodyCommInv');
    const t = a + b + c;
    const fmt = v => v > 0 ? v.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
    document.getElementById('budgetOrgDev').value  = fmt(a);
    document.getElementById('budgetStudServ').value = fmt(b);
    document.getElementById('budgetCommInv').value  = fmt(c);
    document.getElementById('budgetTotal').value    = fmt(t);
}

function calcBudgetTotal() {
    // Legacy – now handled by syncBudgetSummary; kept for safety
    syncBudgetSummary();
}

function calcFundTotal() {
    const vals = ['fundSOF','fundPTA','fundMembership','fundRaised']
        .map(id => parseFloat(document.getElementById(id).value) || 0);
    const t = vals.reduce((a,b) => a+b, 0);
    document.getElementById('fundTotal').value = t > 0 ? t.toLocaleString('en-PH', {minimumFractionDigits:2}) : '';
    updateStratPlanProgress();
}

function submitStratPlan() {
    const acronym  = document.getElementById('stratAcronym').value.trim();
    const orgName  = document.getElementById('stratOrgFullName').value.trim();
    const mission  = document.getElementById('stratMission').value.trim();
    const vision   = document.getElementById('stratVision').value.trim();

    if (!acronym) {
        alert('Please fill in the Org Acronym before continuing.');
        document.getElementById('stratAcronym').focus();
        return;
    }
    if (!orgName) {
        alert('Please fill in the Complete Name of Organization before continuing.');
        document.getElementById('stratOrgFullName').focus();
        return;
    }
    if (!mission) {
        alert('Please fill in the Mission Statement before continuing.');
        document.getElementById('stratMission').focus();
        return;
    }
    if (!vision) {
        alert('Please fill in the Vision Statement before continuing.');
        document.getElementById('stratVision').focus();
        return;
    }

    saveFormData('strategicPlan');
    goToPage('presidentProfile');
}

// ═══════════════════════════════════════════════════
// PROGRESS TRACKERS
// ═══════════════════════════════════════════════════

function createProgressCircle(containerId) {
    // Remove existing if any
    const existing = document.getElementById('progress-circle-' + containerId);
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 'progress-circle-' + containerId;
    wrap.style.cssText = `
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        pointer-events: none;
    `;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '72');
    svg.setAttribute('height', '72');
    svg.setAttribute('viewBox', '0 0 72 72');

    const r = 30;
    const cx = 36, cy = 36;
    const circumference = 2 * Math.PI * r;

    // Background track
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', cx); bgCircle.setAttribute('cy', cy); bgCircle.setAttribute('r', r);
    bgCircle.setAttribute('fill', 'rgba(255,255,255,0.95)');
    bgCircle.setAttribute('stroke', '#e2e8f0'); bgCircle.setAttribute('stroke-width', '5');
    svg.appendChild(bgCircle);

    // Progress arc
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    arc.setAttribute('cx', cx); arc.setAttribute('cy', cy); arc.setAttribute('r', r);
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#1f3a70'); arc.setAttribute('stroke-width', '5');
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('stroke-dasharray', circumference);
    arc.setAttribute('stroke-dashoffset', circumference);
    arc.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    arc.style.transition = 'stroke-dashoffset 0.4s ease, stroke 0.3s ease';
    arc.id = 'progress-arc-' + containerId;
    svg.appendChild(arc);

    // Percentage text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', cx); text.setAttribute('y', cy + 1);
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '13'); text.setAttribute('font-weight', '700');
    text.setAttribute('fill', '#1f3a70'); text.setAttribute('font-family', 'Inter, sans-serif');
    text.id = 'progress-text-' + containerId;
    text.textContent = '0%';
    svg.appendChild(text);

    wrap.appendChild(svg);

    // Label
    const label = document.createElement('div');
    label.style.cssText = `
        font-size: 10px;
        font-weight: 600;
        color: #475569;
        background: rgba(255,255,255,0.95);
        padding: 2px 8px;
        border-radius: 10px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        white-space: nowrap;
        letter-spacing: 0.3px;
        pointer-events: none;
    `;
    label.id = 'progress-label-' + containerId;
    label.textContent = 'Progress';
    wrap.appendChild(label);

    document.body.appendChild(wrap);
    return { arc, text, label, circumference };
}

function updateCircle(containerId, pct, label) {
    const arc  = document.getElementById('progress-arc-' + containerId);
    const text = document.getElementById('progress-text-' + containerId);
    const lbl  = document.getElementById('progress-label-' + containerId);
    if (!arc) return;
    const r = 30;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - pct / 100);
    arc.setAttribute('stroke-dashoffset', offset);
    arc.setAttribute('stroke', pct >= 100 ? '#16a34a' : pct >= 50 ? '#2563eb' : '#1f3a70');
    text.textContent = Math.round(pct) + '%';
    if (lbl && label) lbl.textContent = label;
}

// ── Org Info progress ──────────────────────────────
function initOrgInfoProgress() {
    createProgressCircle('orgInfo');
    const fields = ['infoOrgName','infoOrgEmail','infoOrgType','infoCluster','infoPresidentName','infoPresidentMobile','infoPresidentEmail','infoModeratorName'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateOrgInfoProgress);
        if (el) el.addEventListener('change', updateOrgInfoProgress);
    });
    updateOrgInfoProgress();
}

function updateOrgInfoProgress() {
    const fields = ['infoOrgName','infoOrgEmail','infoOrgType','infoCluster','infoPresidentName','infoPresidentMobile','infoPresidentEmail','infoModeratorName'];
    let filled = 0;
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });
    const pct = (filled / fields.length) * 100;
    updateCircle('orgInfo', pct, 'Org Info');
}

// ── Strategic Plan progress ────────────────────────
function updateStratPlanProgress() {
    let total = 0, filled = 0;

    // Core fields: acronym, full name, mission, vision (4 fields)
    const coreFields = ['stratAcronym','stratOrgFullName','stratMission','stratVision'];
    coreFields.forEach(id => {
        total++;
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });

    // Each section: count as 1 field if at least 1 row has a project name filled (3 sections)
    ['bodyOrgDev','bodyStudServ','bodyCommInv'].forEach(bodyId => {
        total++;
        const tbody = document.getElementById(bodyId);
        if (!tbody) return;
        const textareas = tbody.querySelectorAll('td:nth-child(2) textarea');
        let hasEntry = false;
        textareas.forEach(ta => { if (ta.value.trim()) hasEntry = true; });
        if (hasEntry) filled++;
    });

    // Sources of funds: at least 1 source filled (1 field)
    total++;
    const fundIds = ['fundSOF','fundPTA','fundMembership','fundRaised'];
    let hasFund = false;
    fundIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim() && parseFloat(el.value) > 0) hasFund = true;
    });
    if (hasFund) filled++;

    const pct = total > 0 ? (filled / total) * 100 : 0;
    updateCircle('strategicPlan', pct, 'Form B-1');
}

// ═══════════════════════════════════════════════════
// ORG PLANS MODAL (public — shown when visitor clicks an org)
// ═══════════════════════════════════════════════════
async function openOrgPlansModal(orgName) {
    // Ensure modal exists in DOM
    let overlay = document.getElementById('orgPlansOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'orgPlansOverlay';
        overlay.className = 'org-plans-overlay';
        overlay.innerHTML = `
            <div class="org-plans-box" id="orgPlansBox">
                <button class="org-plans-close" onclick="closeOrgPlansModal()">✕</button>
                <div id="orgPlansContent"></div>
            </div>`;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeOrgPlansModal();
        });
        document.body.appendChild(overlay);
    }

    const content = document.getElementById('orgPlansContent');
    content.innerHTML = '<div class="org-plans-loading">Loading plans…</div>';
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    try {
        const res = await fetch('/org-plans/' + encodeURIComponent(orgName));
        const data = await res.json();

        if (!data.published || !data.plans) {
            content.innerHTML = `
                <div class="org-plans-header">
                    <div class="org-plans-badge">Strategic Plan 2026–2027</div>
                    <h2 class="org-plans-title">${orgName}</h2>
                </div>
                <div class="org-plans-body">
                    <div class="org-plans-empty">
                        <span style="font-size:40px;">📋</span>
                        <p>No plans published yet.</p>
                        <small>Check back once OSA-SACDEV publishes this organization's strategic plan.</small>
                    </div>
                </div>`;
            return;
        }

        const renderTable = (rows, label) => {
            if (!rows || rows.length === 0) return `<p class="org-plans-none">No entries for ${label}.</p>`;
            return `
                <div class="org-plans-table-wrap">
                    <table class="org-plans-table">
                        <thead>
                            <tr>
                                <th>Target Date</th>
                                <th>Project / Initiative</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(r => `
                                <tr>
                                    <td>${r.date || '—'}</td>
                                    <td><strong>${r.projectName}</strong>${r.objectives ? '<br><small style="color:#64748b;">' + r.objectives + '</small>' : ''}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
        };

        content.innerHTML = `
            <div class="org-plans-header">
                <div class="org-plans-badge">Strategic Plan 2026–2027</div>
                <h2 class="org-plans-title">${data.orgName}</h2>
                <div class="org-plans-meta">
                    ${data.cluster ? `<span>📁 ${data.cluster}</span>` : ''}
                    ${data.orgType ? `<span>🏛️ ${data.orgType}</span>` : ''}
                    ${data.acronym ? `<span>🏷️ ${data.acronym}</span>` : ''}
                </div>
                ${data.mission ? `<div class="org-plans-mv"><strong>Mission:</strong> ${data.mission}</div>` : ''}
                ${data.vision  ? `<div class="org-plans-mv"><strong>Vision:</strong>  ${data.vision}</div>`  : ''}
            </div>
            <div class="org-plans-body">
                <div class="org-plans-section">
                    <div class="org-plans-section-title">
                        <span class="org-plans-section-label">A</span>
                        Organizational Development
                    </div>
                    ${renderTable(data.plans.orgDev, 'Organizational Development')}
                </div>
                <div class="org-plans-section">
                    <div class="org-plans-section-title">
                        <span class="org-plans-section-label">B</span>
                        Student Services
                    </div>
                    ${renderTable(data.plans.studServ, 'Student Services')}
                </div>
                <div class="org-plans-section">
                    <div class="org-plans-section-title">
                        <span class="org-plans-section-label">C</span>
                        Community Involvement
                    </div>
                    ${renderTable(data.plans.commInv, 'Community Involvement')}
                </div>
                <div class="org-plans-footer">Published by OSA-SACDEV${data.publishedAt ? ' · ' + data.publishedAt : ''}</div>
            </div>`;
    } catch (err) {
        content.innerHTML = `<div class="org-plans-empty"><p>Failed to load plans. Please try again.</p></div>`;
        console.error('openOrgPlansModal error:', err);
    }
}

function closeOrgPlansModal() {
    const overlay = document.getElementById('orgPlansOverlay');
    if (overlay) { overlay.style.display = 'none'; }
    document.body.style.overflow = '';
}

window.addEventListener('DOMContentLoaded', () => {
    // Restore persisted currentState fields from sessionStorage
    try {
        const saved = sessionStorage.getItem('sacdev_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(currentState, parsed);
        }
    } catch(e) {}

    if (document.getElementById('dashboard')) {
        goToPage('dashboard');
    }
});


const STORAGE_KEY_PREFIX = 'sacdev_form_';

function _storageKey(formId) {
    const email = (window.currentState && currentState.userEmail)
        || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sacdev_userEmail'))
        || 'guest';
    return STORAGE_KEY_PREFIX + email + '_' + formId;
}

function saveFormData(formId) {
    const data = collectFormData(formId);
    try {
        localStorage.setItem(_storageKey(formId), JSON.stringify(data));
        showSaveToast('Progress saved!');
    } catch(e) {
        console.warn('localStorage save failed:', e);
    }
    // Sync to Firestore for cross-device persistence
    _syncProgressToServer();
}

// Debounced server sync — avoids hammering the server on rapid saves
let _syncTimer = null;
function _syncProgressToServer() {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(async function() {
        const email = (window.currentState && currentState.userEmail)
            || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sacdev_userEmail'));
        if (!email) return;

        try {
            // Collect all form data + officers + currentState into one payload
            const payload = {
                state:           JSON.parse(JSON.stringify(currentState || {})),
                forms: {
                    orgInfo:         JSON.parse(localStorage.getItem(_storageKey('orgInfo'))         || 'null'),
                    strategicPlan:   JSON.parse(localStorage.getItem(_storageKey('strategicPlan'))   || 'null'),
                    presidentProfile:JSON.parse(localStorage.getItem(_storageKey('presidentProfile'))|| 'null'),
                    orgOfficers:     JSON.parse(localStorage.getItem(_storageKey('orgOfficers'))     || 'null'),
                    orgMembers:      JSON.parse(localStorage.getItem(_storageKey('orgMembers'))      || 'null'),
                    moderatorProfile:JSON.parse(localStorage.getItem(_storageKey('moderatorProfile'))|| 'null'),
                    gradeAndDocs:    JSON.parse(localStorage.getItem(_storageKey('gradeAndDocs'))    || 'null'),
                },
                officers: JSON.parse(localStorage.getItem('sacdev_officers_list') || '[]')
            };

            await fetch('/save-progress', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, data: payload })
            });
        } catch(e) {
            console.warn('Server progress sync failed:', e);
        }
    }, 1500); // debounce 1.5s
}

// Restore all form progress from Firestore on login (any device)
window.syncProgressFromServer = async function(email) {
    if (!email) return;
    try {
        const res  = await fetch('/load-progress?email=' + encodeURIComponent(email));
        const json = await res.json();
        if (!json.found || !json.data) return;

        const d = json.data;

        // Restore currentState
        if (d.state) {
            Object.assign(currentState, d.state);
            // Persist to sessionStorage so page refreshes work
            try { sessionStorage.setItem('sacdev_state', JSON.stringify(currentState)); } catch(e) {}
        }

        // Restore each form to localStorage (keyed by email)
        if (d.forms) {
            Object.entries(d.forms).forEach(([formId, formData]) => {
                if (formData) {
                    try {
                        localStorage.setItem(
                            STORAGE_KEY_PREFIX + email.toLowerCase() + '_' + formId,
                            JSON.stringify(formData)
                        );
                    } catch(e) {}
                }
            });
        }

        // Restore officers list
        if (d.officers && Array.isArray(d.officers)) {
            try {
                localStorage.setItem('sacdev_officers_list', JSON.stringify(d.officers));
                _officersList = d.officers;
            } catch(e) {}
        }

    } catch(e) {
        console.warn('syncProgressFromServer failed:', e);
    }
};

function loadFormData(formId) {
    try {
        const raw = localStorage.getItem(_storageKey(formId));
        return raw ? JSON.parse(raw) : null;
    } catch(e) {
        return null;
    }
}

function showSaveToast(msg) {
    let toast = document.getElementById('saveToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'saveToast';
        toast.className = 'save-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = '+ ' + msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function submitAndNext(currentForm, nextPage) {
    // Per-form required-field validation before saving and proceeding
    if (currentForm === 'presidentProfile') {
        const required = [
            { id: 'presFullName',    label: "President's Full Name" },
            { id: 'presCourseYear', label: "Course and Year" },
            { id: 'presBirthday',   label: "Birthday" },
            { id: 'presAge',        label: "Age" },
            { id: 'presSex',        label: "Sex" },
            { id: 'presReligion',   label: "Religion" },
            { id: 'presMobile',     label: "Mobile Number" },
            { id: 'presEmail',      label: "Email Address" },
            { id: 'presIdNumber',   label: "ID Number" },
            { id: 'presHomeAddress',label: "Complete Home Address" },
            { id: 'presCityAddress',label: "Complete City Address" },
            { id: 'presFatherName', label: "Father's Name" },
            { id: 'presMotherName', label: "Mother's Name" },
            { id: 'presHsName',     label: "Name of High School" },
            { id: 'presGsName',     label: "Name of Grade School" },
            { id: 'presSkills',     label: "Skills, Hobbies and Interests" },
        ];
        for (const f of required) {
            const el = document.getElementById(f.id);
            if (!el || !el.value.trim()) {
                alert('Please fill in the required field: ' + f.label);
                if (el) el.focus();
                return;
            }
        }
        const sig = document.getElementById('presSignaturePreview');
        if (!sig || !sig.src || sig.classList.contains('hidden')) {
            alert("Please upload the President's E-Signature before proceeding.");
            return;
        }

        // Store president's Student ID so officer table can auto-fill it
        const presIdEl = document.getElementById('presIdNumber');
        if (presIdEl && presIdEl.value.trim()) {
            currentState.presidentStudentId = presIdEl.value.trim();
            // Update the president row in officers list if already seeded
            try {
                var saved = localStorage.getItem('sacdev_officers_list');
                var list  = saved ? JSON.parse(saved) : [];
                var presRow = list.find(function(o) { return (o.position || '').toLowerCase() === 'president'; });
                if (presRow) {
                    presRow.studentId = currentState.presidentStudentId;
                    presRow.name      = presRow.name || currentState.presidentName || '';
                    presRow.mobile    = presRow.mobile || currentState.presidentMobile || '';
                    presRow.course    = presRow.course || document.getElementById('presCourseYear')?.value?.trim() || '';
                    localStorage.setItem('sacdev_officers_list', JSON.stringify(list));
                    _officersList = list;
                }
            } catch(e) {}
        }
    }
    if (currentForm === 'orgOfficers') {
        if (!_officersList || _officersList.length === 0) {
            alert('Please add at least one officer before proceeding.');
            return;
        }
    }
    if (currentForm === 'moderatorProfile') {
        const required = [
            { id: 'modFullName',       label: "Moderator's Full Name" },
            { id: 'modNominatingOrg',  label: "Nominating Organization" },
            { id: 'modBirthday',       label: "Birthday" },
            { id: 'modAge',            label: "Age" },
            { id: 'modSex',            label: "Sex" },
            { id: 'modReligion',       label: "Religion" },
            { id: 'modDesignation',    label: "Official University Designation" },
            { id: 'modDepartment',     label: "Unit / College / Department" },
            { id: 'modStatus',         label: "Status" },
            { id: 'modYearsService',   label: "Years of Service in the University" },
            { id: 'modMobile',         label: "Moderator's Mobile Number" },
            { id: 'modEmail',          label: "Moderator's Email" },
            { id: 'modCityAddress',    label: "Complete City Address" },
            { id: 'modSpecialSkills',  label: "Special Skills or Interests" },
        ];
        for (const f of required) {
            const el = document.getElementById(f.id);
            if (!el || !el.value.trim()) {
                alert('Please fill in the required field: ' + f.label);
                if (el) el.focus();
                return;
            }
        }
        const sig = document.getElementById('modSignaturePreview');
        if (!sig || !sig.src || sig.classList.contains('hidden')) {
            alert("Please upload the Moderator's E-Signature before proceeding.");
            return;
        }
    }
    saveFormData(currentForm);
    goToPage(nextPage);
}

// ── Generic field collector ───────────────────────
function collectFormData(formId) {
    const container = document.getElementById(formId);
    if (!container) return {};
    const data = {};
    container.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
        data[el.id] = el.value;
    });
    // Collect table rows as arrays
    container.querySelectorAll('tbody[id]').forEach(tbody => {
        data['__table_' + tbody.id] = collectTableRows(tbody);
    });
    // Collect image previews (base64)
    container.querySelectorAll('img.upload-preview[id]').forEach(img => {
        if (!img.classList.contains('hidden') && img.src) {
            data['__img_' + img.id] = img.src;
        }
    });
    return data;
}

function collectTableRows(tbody) {
    const rows = [];
    tbody.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('input, select, textarea').forEach(el => {
            cells.push(el.value);
        });
        rows.push(cells);
    });
    return rows;
}

function restoreFormData(formId) {
    const data = loadFormData(formId);
    if (!data) return;
    const container = document.getElementById(formId);
    if (!container) return;
    // Restore simple fields
    container.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
        if (data[el.id] !== undefined) el.value = data[el.id];
    });
    // Restore images
    container.querySelectorAll('img.upload-preview[id]').forEach(img => {
        const key = '__img_' + img.id;
        if (data[key]) {
            img.src = data[key];
            img.classList.remove('hidden');
            const placeholderId = img.id.replace('Preview', 'Placeholder');
            const ph = document.getElementById(placeholderId);
            if (ph) ph.style.display = 'none';
        }
    });
    // Restore file upload names
    if (data['__file_constitutionFileName']) {
        const el = document.getElementById('constitutionFileName');
        if (el) el.textContent = data['__file_constitutionFileName'];
    }
}

async function handleImageUpload(inputId, previewId, placeholderId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];

    // Show local preview immediately while uploading
    const reader = new FileReader();
    reader.onload = e => {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        if (placeholder) placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);

    // Show uploading indicator
    const box = input.closest('.upload-box') || input.previousElementSibling;
    if (box) { box.classList.add('has-file'); box.dataset.uploading = '1'; }
    if (placeholder) placeholder.textContent = 'Uploading…';

    try {
        const url = await uploadToCloudinary(file);
        // Store Cloudinary URL on the preview element as data attribute
        preview.dataset.cloudinaryUrl = url;
        // Also store on the input for easy retrieval
        input.dataset.cloudinaryUrl = url;
        if (box) delete box.dataset.uploading;
        console.log('[Cloudinary] Uploaded:', inputId, '->', url);
    } catch(err) {
        console.error('[Cloudinary] Upload failed:', err);
        alert('File upload failed. Please try again.');
        if (box) box.classList.remove('has-file');
        preview.classList.add('hidden');
        if (placeholder) { placeholder.style.display = ''; placeholder.textContent = 'Drop file here or click to upload'; }
    }

    // Trigger progress update
    const pageEl = input.closest('.page');
    if (pageEl) triggerProgressUpdate(pageEl.id);
}

async function handleFileUpload(inputId, fileNameElId, boxId) {
    const input = document.getElementById(inputId);
    const nameEl = document.getElementById(fileNameElId);
    const box = document.getElementById(boxId);
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];

    if (nameEl) nameEl.textContent = 'Uploading ' + file.name + '…';
    if (box) { box.classList.add('has-file'); box.dataset.uploading = '1'; }

    try {
        const url = await uploadToCloudinary(file);
        input.dataset.cloudinaryUrl = url;
        if (nameEl) nameEl.textContent = '+ ' + file.name;
        if (box) delete box.dataset.uploading;
        console.log('[Cloudinary] Uploaded PDF:', inputId, '->', url);
    } catch(err) {
        console.error('[Cloudinary] PDF upload failed:', err);
        alert('File upload failed. Please try again.');
        if (nameEl) nameEl.textContent = '';
        if (box) box.classList.remove('has-file');
    }

    const pageEl = input.closest('.page');
    if (pageEl) triggerProgressUpdate(pageEl.id);
}

function triggerProgressUpdate(pageId) {
    if (pageId === 'presidentProfile') updatePresidentProgress();
    else if (pageId === 'orgOfficers') updateOfficersProgress();
    else if (pageId === 'orgMembers') updateMembersProgress();
    else if (pageId === 'moderatorProfile') updateModeratorProgress();
    else if (pageId === 'gradeAndDocs') updateGradeDocsProgress();
}

// ═══════════════════════════════════════════════════
// PRESIDENT'S PROFILE (Form B-2)
// ═══════════════════════════════════════════════════

function initPresidentProfile() {
    // Pre-fill from orgInfo if available
    if (currentState.presidentName && !document.getElementById('presFullName').value) {
        document.getElementById('presFullName').value = currentState.presidentName;
    }
    if (currentState.presidentMobile && !document.getElementById('presMobile').value) {
        document.getElementById('presMobile').value = currentState.presidentMobile;
    }
    if (currentState.presidentEmail && !document.getElementById('presEmail').value) {
        document.getElementById('presEmail').value = currentState.presidentEmail;
    }

    // Seed leadership table if empty
    const lb = document.getElementById('presLeadershipBody');
    if (lb && lb.children.length === 0) {
        addLeadershipRow('presLeadershipBody');
        addLeadershipRow('presLeadershipBody');
    }
    const ab = document.getElementById('presAwardsBody');
    if (ab && ab.children.length === 0) {
        addAwardsRow('presAwardsBody');
        addAwardsRow('presAwardsBody');
    }

    // Restore saved data
    restoreFormData('presidentProfile');

    // Attach progress listeners
    ['presFullName','presCourseYear','presBirthday','presAge','presSex','presReligion',
     'presMobile','presEmail','presIdNumber','presHomeAddress','presCityAddress',
     'presFatherName','presMotherName','presHsName','presGsName','presSkills'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', updatePresidentProgress); el.addEventListener('change', updatePresidentProgress); }
    });
    updatePresidentProgress();
}

function addLeadershipRow(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="strat-cell-input" placeholder="Organization name"></td>
        <td><input type="text" class="strat-cell-input" placeholder="Position held"></td>
        <td><input type="text" class="strat-cell-input" placeholder="Address / School / City"></td>
        <td><input type="text" class="strat-cell-input" placeholder="e.g. 2022–2024"></td>
        <td><button class="btn-del-row" onclick="deleteSimpleRow(this)" title="Remove">&#215;</button></td>
    `;
    tbody.appendChild(tr);
}

function addAwardsRow(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="strat-cell-input" placeholder="Name of award"></td>
        <td><textarea class="strat-cell-textarea" rows="2" placeholder="Description of award"></textarea></td>
        <td><input type="text" class="strat-cell-input" placeholder="Conferring organization/institution"></td>
        <td><input type="text" class="strat-cell-input" placeholder="Date received"></td>
        <td><button class="btn-del-row" onclick="deleteSimpleRow(this)" title="Remove">&#215;</button></td>
    `;
    tbody.appendChild(tr);
}

function deleteSimpleRow(btn) {
    const tbody = btn.closest('tbody');
    if (tbody && tbody.rows.length <= 1) { alert('At least one row is required.'); return; }
    btn.closest('tr').remove();
}

function updatePresidentProgress() {
    const required = [
        'presFullName','presCourseYear','presBirthday','presAge','presSex',
        'presReligion','presMobile','presEmail','presIdNumber',
        'presHomeAddress','presCityAddress','presFatherName','presMotherName',
        'presHsName','presGsName','presSkills'
    ];
    let filled = 0;
    required.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });
    // Check signature
    const sig = document.getElementById('presSignaturePreview');
    if (sig && !sig.classList.contains('hidden') && sig.src) filled++;
    const total = required.length + 1; // +1 for signature
    updateCircle('presidentProfile', (filled / total) * 100, 'Form B-2');
}

// ═══════════════════════════════════════════════════
// ORGANIZATION OFFICERS (Form B-3)
// ═══════════════════════════════════════════════════

// ── Officers data store (in-memory, persisted to localStorage) ───────────────
var _officersList  = []; // array of {position, studentId, name, course, qpi1, qpi2, qpiInt, mobile}
var _editingOfficerIdx = -1; // -1 = adding new, >=0 = editing existing

function initOrgOfficers() {
    // Try to restore from localStorage
    try {
        var saved = localStorage.getItem('sacdev_officers_list');
        if (saved) _officersList = JSON.parse(saved) || [];
    } catch(e) { _officersList = []; }

    // Pre-seed president if list is empty
    if (_officersList.length === 0 && currentState.presidentName) {
        const presCourseEl = document.getElementById('presCourseYear');
        _officersList.push({
            position:  'President',
            studentId: currentState.presidentStudentId || '',
            name:      currentState.presidentName,
            course:    (presCourseEl && presCourseEl.value.trim()) || currentState.presCourseYear || '',
            qpi1:      '',
            qpi2:      '',
            qpiInt:    '',
            mobile:    currentState.presidentMobile || ''
        });
        _saveOfficersList();
    } else if (_officersList.length > 0) {
        // If list exists but president row has no studentId yet, update it now
        var presRow = _officersList.find(function(o) { return (o.position || '').toLowerCase() === 'president'; });
        if (presRow && !presRow.studentId && currentState.presidentStudentId) {
            presRow.studentId = currentState.presidentStudentId;
            _saveOfficersList();
        }
    }

    _editingOfficerIdx = -1;
    _renderOfficersTable();
    _updateOfficerCardButtons();
}

function _saveOfficersList() {
    try { localStorage.setItem('sacdev_officers_list', JSON.stringify(_officersList)); } catch(e) {}
}

function addOfficerFromCard() {
    var position  = (document.getElementById('newOfficerPosition')?.value || '').trim();
    var studentId = (document.getElementById('newOfficerStudentId')?.value || '').trim();
    var name      = (document.getElementById('newOfficerName')?.value || '').trim();
    var course    = (document.getElementById('newOfficerCourse')?.value || '').trim();
    var qpi1      = (document.getElementById('newOfficerQpi1')?.value || '').trim();
    var qpi2      = (document.getElementById('newOfficerQpi2')?.value || '').trim();
    var qpiInt    = (document.getElementById('newOfficerQpiInt')?.value || '').trim();
    var mobile    = (document.getElementById('newOfficerMobile')?.value || '').trim();

    if (!position || !studentId || !name) {
        if (!position) { alert('Position is required.'); document.getElementById('newOfficerPosition')?.focus(); return; }
        if (!studentId) { alert('Student ID is required.'); document.getElementById('newOfficerStudentId')?.focus(); return; }
        if (!name) { alert('Full Name is required.'); document.getElementById('newOfficerName')?.focus(); return; }
    }

    // Validate Student ID — digits only
    if (!/^\d+$/.test(studentId)) {
        alert('Student ID must contain digits only — no dashes, spaces, or letters (e.g. 20230028975).');
        document.getElementById('newOfficerStudentId')?.focus();
        return;
    }

    if (_editingOfficerIdx >= 0) {
        // Save edit
        _officersList[_editingOfficerIdx] = { position, studentId, name, course, qpi1, qpi2, qpiInt, mobile };
        _editingOfficerIdx = -1;
    } else {
        // Add new
        _officersList.push({ position, studentId, name, course, qpi1, qpi2, qpiInt, mobile });
    }

    _saveOfficersList();
    _renderOfficersTable();
    clearOfficerCard();
    _updateOfficerCardButtons();
    updateOfficersProgress();
}

function clearOfficerCard() {
    ['newOfficerPosition','newOfficerStudentId','newOfficerName','newOfficerCourse',
     'newOfficerQpi1','newOfficerQpi2','newOfficerQpiInt','newOfficerMobile'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });
    _editingOfficerIdx = -1;
    _updateOfficerCardButtons();
    // Remove editing highlight from card
    var card = document.getElementById('officerInputCard');
    if (card) card.classList.remove('is-editing');
}

function editOfficerRow(idx) {
    var o = _officersList[idx];
    if (!o) return;

    // Populate card fields
    var set = function(id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
    set('newOfficerPosition',  o.position);
    set('newOfficerStudentId', o.studentId);
    set('newOfficerName',      o.name);
    set('newOfficerCourse',    o.course);
    set('newOfficerQpi1',      o.qpi1);
    set('newOfficerQpi2',      o.qpi2);
    set('newOfficerQpiInt',    o.qpiInt);
    set('newOfficerMobile',    o.mobile);

    _editingOfficerIdx = idx;
    _updateOfficerCardButtons();

    // Highlight card as editing mode
    var card = document.getElementById('officerInputCard');
    if (card) {
        card.classList.add('is-editing');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function deleteOfficerRow(idx) {
    if (_editingOfficerIdx === idx) {
        clearOfficerCard();
    }
    _officersList.splice(idx, 1);
    _saveOfficersList();
    _renderOfficersTable();
    _updateOfficerCardButtons();
    updateOfficersProgress();
}

function _updateOfficerCardButtons() {
    var addBtn    = document.getElementById('officerCardAddBtn');
    var saveBtn   = document.getElementById('officerCardSaveBtn');
    var cancelBtn = document.getElementById('officerCardCancelBtn');
    var cardTitle = document.getElementById('officerCardTitle');
    var isEditing = _editingOfficerIdx >= 0;

    if (addBtn)    addBtn.style.display    = isEditing ? 'none' : '';
    if (saveBtn)   saveBtn.style.display   = isEditing ? '' : 'none';
    if (cancelBtn) cancelBtn.style.display = isEditing ? '' : 'none';
    if (cardTitle) cardTitle.textContent   = isEditing
        ? '✏️ Editing Officer — ' + (_officersList[_editingOfficerIdx]?.name || '')
        : 'ADD OFFICER';
}

function _renderOfficersTable() {
    var tbody    = document.getElementById('officersTableBody');
    var emptyMsg = document.getElementById('officersEmptyMsg');
    var badge    = document.getElementById('officerCountBadge');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (_officersList.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (badge)    badge.textContent = '0 added';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (badge)    badge.textContent = _officersList.length + ' added';

    _officersList.forEach(function(o, idx) {
        var isBeingEdited = idx === _editingOfficerIdx;
        var tr = document.createElement('tr');
        if (isBeingEdited) tr.classList.add('officer-row-editing');
        tr.innerHTML =
            '<td>' + _esc(o.position) + '</td>' +
            '<td><span class="officer-id-badge">' + _esc(o.studentId) + '</span></td>' +
            '<td>' + _esc(o.name) + '</td>' +
            '<td>' + _esc(o.course) + '</td>' +
            '<td>' + _esc(o.qpi1) + '</td>' +
            '<td>' + _esc(o.qpi2) + '</td>' +
            '<td>' + _esc(o.qpiInt) + '</td>' +
            '<td>' + _esc(o.mobile) + '</td>' +
            '<td style="white-space:nowrap;">' +
                '<button class="btn-edit-row" onclick="editOfficerRow(' + idx + ')" title="Edit">✏️</button> ' +
                '<button class="btn-del-row"  onclick="deleteOfficerRow(' + idx + ')" title="Remove">&#215;</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function _esc(str) {
    return (str || '').toString()
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function updateOfficersProgress() {
    const total    = 1; // at least 1 officer beyond president required
    const nonPres  = _officersList.filter(function(o) { return (o.position || '').toLowerCase() !== 'president'; });
    const filled   = nonPres.length > 0 ? 1 : 0;
    const pct      = (filled / total) * 100;
    updateCircle('orgOfficers', pct, 'Form B-3');
}

// Legacy stub kept so nothing else breaks
function addOfficerRow() { /* replaced by card UI — no-op */ }

// ═══════════════════════════════════════════════════
// ORGANIZATION MEMBERS (Form B-4)
// ═══════════════════════════════════════════════════

function initOrgMembers() {
    const isExtraCurricular = (currentState.orgType || '').toLowerCase() === 'extra-curricular';
    const notApplicable = document.getElementById('orgMembersNotApplicable');
    const membersForm   = document.getElementById('orgMembersForm');
    if (notApplicable) notApplicable.classList.toggle('hidden', isExtraCurricular);
    if (membersForm)   membersForm.classList.toggle('hidden', !isExtraCurricular);

    if (isExtraCurricular) {
        const tbody = document.getElementById('membersTableBody');
        if (tbody && tbody.children.length === 0) {
            addMemberRow();
            addMemberRow();
        }
        restoreFormData('orgMembers');
    }
    updateMembersProgress();
}

function addMemberRow() {
    const tbody = document.getElementById('membersTableBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="strat-cell-input" placeholder="Last Name, First Name, MI"></td>
        <td><input type="text" class="strat-cell-input" placeholder="e.g. BS CS, 3rd Year"></td>
        <td><input type="number" class="strat-cell-input" placeholder="0.00" step="0.01" min="0" max="4"></td>
        <td><input type="tel" class="strat-cell-input" placeholder="09XXXXXXXXX"></td>
        <td><button class="btn-del-row" onclick="deleteSimpleRow(this)" title="Remove">&#215;</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateMembersProgress));
}

function updateMembersProgress() {
    const tbody = document.getElementById('membersTableBody');
    let filledRows = 0;
    if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
            const first = tr.querySelector('input');
            if (first && first.value.trim()) filledRows++;
        });
    }
    const pct = filledRows > 0 ? Math.min(filledRows * 10, 100) : 0;
    updateCircle('orgMembers', pct, 'Form B-4');
}

// ═══════════════════════════════════════════════════
// MODERATOR PROFILE (Form B-5.1)
// ═══════════════════════════════════════════════════

function initModeratorProfile() {
    // Pre-fill nominating org
    if (currentState.selectedOrg && !document.getElementById('modNominatingOrg').value) {
        document.getElementById('modNominatingOrg').value = currentState.selectedOrg;
    }
    if (currentState.moderatorName && !document.getElementById('modFullName').value) {
        document.getElementById('modFullName').value = currentState.moderatorName;
    }

    const lb = document.getElementById('modLeadershipBody');
    if (lb && lb.children.length === 0) {
        addLeadershipRow('modLeadershipBody');
        addLeadershipRow('modLeadershipBody');
    }
    restoreFormData('moderatorProfile');

    ['modFullName','modNominatingOrg','modBirthday','modAge','modSex','modReligion',
     'modDesignation','modDepartment','modStatus','modYearsService',
     'modMobile','modEmail','modCityAddress','modSpecialSkills'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', updateModeratorProgress); el.addEventListener('change', updateModeratorProgress); }
    });
    updateModeratorProgress();
}

function updateModeratorProgress() {
    const required = [
        'modFullName','modNominatingOrg','modBirthday','modAge','modSex',
        'modReligion','modDesignation','modDepartment','modStatus',
        'modYearsService','modMobile','modEmail','modCityAddress','modSpecialSkills'
    ];
    let filled = 0;
    required.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });
    const sig = document.getElementById('modSignaturePreview');
    if (sig && !sig.classList.contains('hidden') && sig.src) filled++;
    const total = required.length + 1;
    updateCircle('moderatorProfile', (filled / total) * 100, 'Form B-5.1');
}

// ═══════════════════════════════════════════════════
// GRADE SLIPS + DOCS (Combined)
// ═══════════════════════════════════════════════════

function initGradeAndDocs() {
    restoreFormData('gradeAndDocs');
    updateGradeDocsProgress();
}

function updateGradeDocsProgress() {
    let filled = 0;
    const total = 2;

    const constBox = document.getElementById('constitutionBox');
    if (constBox && constBox.classList.contains('has-file')) filled++;

    const logoPreview = document.getElementById('orgLogoPreview');
    if (logoPreview && !logoPreview.classList.contains('hidden') && logoPreview.src) filled++;

    updateCircle('gradeAndDocs', (filled / total) * 100, 'Documents');
}

function submitAllForms() {
    // Save final form
    saveFormData('gradeAndDocs');
    const constBox    = document.getElementById('constitutionBox');
    const logoPreview = document.getElementById('orgLogoPreview');

    if (!constBox.classList.contains('has-file') || logoPreview.classList.contains('hidden')) {
        if (!confirm('Some documents are still missing. Submit anyway?')) return;
    }
    alert('All requirements have been submitted successfully!\n\nPlease ensure you have completed all forms and uploaded all required documents. OSA-SACDEV will evaluate your re-registration requirements before granting recognition.');
}

// ═══════════════════════════════════════════════════
// SUBMISSION SUMMARY
// ═══════════════════════════════════════════════════

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return false;
}

function goToSummary() {
    saveFormData('gradeAndDocs');
    buildSummary();
    goToPage('submissionSummary');
}

function buildSummary() {
    const container = document.getElementById('summaryContent');
    const warning   = document.getElementById('summaryWarning');
    const submitBtn = document.getElementById('finalSubmitBtn');
    const missingFields = [];

    container.innerHTML = '';

    // ── Helper ──────────────────────────────────────
    function val(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }
    function imgFilled(previewId) {
        const el = document.getElementById(previewId);
        return el && !el.classList.contains('hidden') && el.src && el.src !== window.location.href;
    }
    function fileFilled(boxId) {
        const el = document.getElementById(boxId);
        return el && el.classList.contains('has-file');
    }

    function buildSection(title, badge, fields, sectionId) {
        const section = document.createElement('div');
        section.className = 'summary-section';
        if (sectionId) section.id = sectionId;

        const titleEl = document.createElement('div');
        titleEl.className = 'summary-section-title';
        titleEl.innerHTML = title + (badge ? ` <span class="summary-badge">${badge}</span>` : '');
        section.appendChild(titleEl);

        const body = document.createElement('div');
        body.className = 'summary-section-body';

        fields.forEach(f => {
            const div = document.createElement('div');
            div.className = 'summary-field' + (f.fullWidth ? ' summary-full-width' : '');
            const lbl = document.createElement('div');
            lbl.className = 'summary-field-label';
            lbl.textContent = f.label;
            const valDiv = document.createElement('div');
            if (f.value) {
                valDiv.className = 'summary-field-value filled';
                valDiv.textContent = f.value;
            } else if (f.required) {
                valDiv.className = 'summary-field-value missing';
                valDiv.innerHTML = '! Not filled in';
                missingFields.push(f.label);
            } else {
                valDiv.className = 'summary-field-value';
                valDiv.textContent = '—';
                valDiv.style.color = '#94a3b8';
            }
            div.appendChild(lbl);
            div.appendChild(valDiv);
            body.appendChild(div);
        });

        section.appendChild(body);
        return section;
    }

    // ── Account Info ────────────────────────────────
    container.appendChild(buildSection('ACCOUNT', null, [
        { label: 'XU Email', value: currentState.userEmail || '(logged in via Google / will be recorded on submit)', required: false },
    ], 'summary-account'));

    // ── Org Info ────────────────────────────────────
    container.appendChild(buildSection('ORGANIZATION INFORMATION', null, [
        { label: 'Organization Name',     value: currentState.orgName  || val('infoOrgName'),  required: true },
        { label: 'Organization Email',    value: currentState.orgEmail || val('infoOrgEmail'), required: true },
        { label: 'Type of Organization',  value: currentState.orgType  || val('infoOrgType'),  required: true },
        { label: 'Org Cluster',           value: val('infoCluster'),   required: true },
        { label: 'Year Established',      value: currentState.yearEstablished || val('infoYearEstablished'), required: false },
        { label: "President's Name",     value: val('infoPresidentName'),   required: true },
        { label: "President's Mobile",   value: val('infoPresidentMobile'), required: true },
        { label: "President's Email",    value: val('infoPresidentEmail'),  required: true },
        { label: 'Moderator Nominee',     value: val('infoModeratorName'),   required: true },
    ], 'summary-orginfo'));

    // ── Form B-1 ─────────────────────────────────
    container.appendChild(buildSection('STRATEGIC PLAN', 'Form B-1', [
        { label: 'Org Acronym', value: val('stratAcronym'), required: true },
        { label: 'Full Org Name', value: val('stratOrgFullName'), required: true },
        { label: 'Mission Statement', value: val('stratMission') ? '+ Filled' : '', required: true },
        { label: 'Vision Statement', value: val('stratVision') ? '+ Filled' : '', required: true },
    ], 'summary-b1'));

    // ── Form B-2 ─────────────────────────────────
    container.appendChild(buildSection("PRESIDENT'S PROFILE", 'Form B-2', [
        { label: 'Full Name', value: val('presFullName'), required: true },
        { label: 'Course and Year', value: val('presCourseYear'), required: true },
        { label: 'Mobile Number', value: val('presMobile'), required: true },
        { label: 'Email', value: val('presEmail'), required: true },
        { label: 'E-Signature', value: imgFilled('presSignaturePreview') ? '+ Uploaded' : '', required: true },
        { label: 'Photo ID', value: imgFilled('presPhotoPreview') ? '+ Uploaded' : '', required: false },
    ], 'summary-b2'));

    // ── Form B-3 ─────────────────────────────────
    var _officersForSummary = [];
    try {
        var _savedOff = localStorage.getItem('sacdev_officers_list');
        _officersForSummary = _savedOff ? JSON.parse(_savedOff) : (_officersList || []);
    } catch(e) { _officersForSummary = _officersList || []; }
    var officerCount = _officersForSummary.filter(function(o){ return o.position && o.name; }).length;
    container.appendChild(buildSection('ORGANIZATION OFFICERS', 'Form B-3', [
        { label: 'Officers Listed',  value: officerCount > 0 ? `${officerCount} officer(s)` : '', required: true },
        { label: 'Student IDs',      value: officerCount > 0 ? 'Provided for all officers' : '', required: false },
    ], 'summary-b3'));

    // ── Form B-4 ─────────────────────────────────
    const memberRows = document.getElementById('membersTableBody')?.querySelectorAll('tr') || [];
    let memberCount = 0;
    memberRows.forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        if (inputs[0]?.value.trim()) memberCount++;
    });
    const isExtraCurricular = (currentState.orgType || '').toLowerCase() === 'extra-curricular';
    container.appendChild(buildSection('ORGANIZATION MEMBERS', 'Form B-4', [
        { label: 'Applicable',     value: isExtraCurricular ? 'Yes (Extra-Curricular)' : 'Not required for this org type', required: false },
        { label: 'Members Listed', value: isExtraCurricular ? (memberCount > 0 ? `${memberCount} member(s)` : '') : 'N/A', required: isExtraCurricular },
    ], 'summary-b4'));

    // ── Form B-5.1 ───────────────────────────────
    container.appendChild(buildSection("MODERATOR'S PROFILE", 'Form B-5.1', [
        { label: 'Full Name', value: val('modFullName'), required: true },
        { label: 'Nominating Org', value: val('modNominatingOrg'), required: true },
        { label: 'Designation', value: val('modDesignation'), required: true },
        { label: 'Department', value: val('modDepartment'), required: true },
        { label: 'Mobile Number', value: val('modMobile'), required: true },
        { label: 'Email', value: val('modEmail'), required: true },
        { label: 'E-Signature', value: imgFilled('modSignaturePreview') ? '+ Uploaded' : '', required: true },
    ], 'summary-b5'));

    // ── Form B-6 & Documents ─────────────────────
    container.appendChild(buildSection('CONSTITUTION & ORGANIZATION LOGO', 'Documents', [
        { label: 'Organization Constitution', value: fileFilled('constitutionBox') ? '+ Uploaded' : '', required: true },
        { label: 'Organization Logo / Seal',  value: imgFilled('orgLogoPreview')   ? '+ Uploaded' : '', required: true },
    ], 'summary-b6'));

    // ── Warning banner ───────────────────────────
    if (missingFields.length > 0) {
        warning.classList.remove('hidden');
        document.getElementById('summaryWarningText').innerHTML =
            `<strong>${missingFields.length} required field(s) are incomplete:</strong> ${missingFields.join(', ')}. Please go back and fill in all required fields before submitting.`;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    } else {
        warning.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
        submitBtn.style.cursor = '';
    }
}

// Override submitAllForms to use summary page gate
async function submitAllForms() {
    const submitBtn = document.getElementById('finalSubmitBtn');
    if (submitBtn && submitBtn.disabled) {
        alert('Please fill in all required fields before submitting.');
        return;
    }
    saveFormData('gradeAndDocs');

    // Build submission payload — include ALL form data for full admin visibility
    const _spData  = loadFormData('strategicPlan')     || {};
    const _presData = loadFormData('presidentProfile') || {};
    const _modData  = loadFormData('moderatorProfile') || {};
    const _offData  = loadFormData('orgOfficers')      || {};
    const _memData  = loadFormData('orgMembers')       || {};
    const _docData  = loadFormData('gradeAndDocs')     || {};

    // Helper to pull a field value from a form data object
    const fv = (obj, id) => (obj[id] || '').toString().trim();

    const submission = {
        // ── Core / org info ──────────────────────────────────
        org:             currentState.selectedOrg  || currentState.orgName || '—',
        orgName:         currentState.orgName      || currentState.selectedOrg || '—',
        orgEmail:        currentState.orgEmail     || '—',
        orgType:         currentState.orgType      || '—',
        council:         currentState.selectedCouncil || '—',
        cluster:         document.getElementById('infoCluster')?.value || currentState.orgCluster || '—',
        yearEstablished: currentState.yearEstablished || '',

        // ── President profile (B-2) — all fields ─────────────
        president:         document.getElementById('presFullName')?.value?.trim() || currentState.presidentName || '—',
        presFullName:      fv(_presData, 'presFullName')      || document.getElementById('presFullName')?.value?.trim()      || '',
        presCourseYear:    fv(_presData, 'presCourseYear')    || document.getElementById('presCourseYear')?.value?.trim()    || '',
        presBirthday:      fv(_presData, 'presBirthday')      || document.getElementById('presBirthday')?.value?.trim()      || '',
        presAge:           fv(_presData, 'presAge')           || document.getElementById('presAge')?.value?.trim()           || '',
        presSex:           fv(_presData, 'presSex')           || document.getElementById('presSex')?.value?.trim()           || '',
        presReligion:      fv(_presData, 'presReligion')      || document.getElementById('presReligion')?.value?.trim()      || '',
        email:             (currentState.userEmail
                           || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sacdev_userEmail'))
                           || (typeof localStorage !== 'undefined' && localStorage.getItem('sacdev_lastEmail'))
                           || '—').toLowerCase(),
        presidentMobile:   currentState.presidentMobile || fv(_presData, 'presMobile') || '—',
        presidentEmail:    currentState.presidentEmail  || fv(_presData, 'presEmail')  || '—',
        presMobile:        fv(_presData, 'presMobile')        || document.getElementById('presMobile')?.value?.trim()        || '',
        presEmail:         fv(_presData, 'presEmail')         || document.getElementById('presEmail')?.value?.trim()         || '',
        presIdNumber:      fv(_presData, 'presIdNumber')      || document.getElementById('presIdNumber')?.value?.trim()      || '',
        presidentStudentId: currentState.presidentStudentId   || fv(_presData, 'presIdNumber') || document.getElementById('presIdNumber')?.value?.trim() || '',
        presLandlineCity:  fv(_presData, 'presLandlineCity')  || document.getElementById('presLandlineCity')?.value?.trim()  || '',
        presLandlineProv:  fv(_presData, 'presLandlineProv')  || document.getElementById('presLandlineProv')?.value?.trim()  || '',
        presFacebook:      fv(_presData, 'presFacebook')      || document.getElementById('presFacebook')?.value?.trim()      || '',
        presHomeAddress:   fv(_presData, 'presHomeAddress')   || document.getElementById('presHomeAddress')?.value?.trim()   || '',
        presCityAddress:   fv(_presData, 'presCityAddress')   || document.getElementById('presCityAddress')?.value?.trim()   || '',
        presFatherName:    fv(_presData, 'presFatherName')    || document.getElementById('presFatherName')?.value?.trim()    || '',
        presFatherOcc:     fv(_presData, 'presFatherOccupation') || document.getElementById('presFatherOccupation')?.value?.trim() || '',
        presFatherMobile:  fv(_presData, 'presFatherMobile')  || document.getElementById('presFatherMobile')?.value?.trim()  || '',
        presMotherName:    fv(_presData, 'presMotherName')    || document.getElementById('presMotherName')?.value?.trim()    || '',
        presMotherOcc:     fv(_presData, 'presMotherOccupation') || document.getElementById('presMotherOccupation')?.value?.trim() || '',
        presMotherMobile:  fv(_presData, 'presMotherMobile')  || document.getElementById('presMotherMobile')?.value?.trim()  || '',
        presGuardianName:  fv(_presData, 'presGuardianName')  || document.getElementById('presGuardianName')?.value?.trim()  || '',
        presGuardianRel:   fv(_presData, 'presGuardianRelation') || document.getElementById('presGuardianRelation')?.value?.trim() || '',
        presGuardianMobile:fv(_presData, 'presGuardianMobile')|| document.getElementById('presGuardianMobile')?.value?.trim() || '',
        presSiblings:      fv(_presData, 'presSiblings')      || document.getElementById('presSiblings')?.value?.trim()      || '',
        presHsName:        fv(_presData, 'presHsName')        || document.getElementById('presHsName')?.value?.trim()        || '',
        presHsAddress:     fv(_presData, 'presHsAddress')     || document.getElementById('presHsAddress')?.value?.trim()     || '',
        presHsGrad:        fv(_presData, 'presHsGrad')        || document.getElementById('presHsGrad')?.value?.trim()        || '',
        presGsName:        fv(_presData, 'presGsName')        || document.getElementById('presGsName')?.value?.trim()        || '',
        presGsAddress:     fv(_presData, 'presGsAddress')     || document.getElementById('presGsAddress')?.value?.trim()     || '',
        presGsGrad:        fv(_presData, 'presGsGrad')        || document.getElementById('presGsGrad')?.value?.trim()        || '',
        presScholarship:   fv(_presData, 'presScholarship')   || document.getElementById('presScholarship')?.value?.trim()   || '',
        presScholarshipYr: fv(_presData, 'presScholarshipYear') || document.getElementById('presScholarshipYear')?.value?.trim() || '',
        presSkills:        fv(_presData, 'presSkills')        || document.getElementById('presSkills')?.value?.trim()        || '',

        // ── Moderator profile (B-5.1) — all fields ───────────
        moderatorName:     currentState.moderatorName || fv(_modData, 'modFullName') || '—',
        modFullName:       fv(_modData, 'modFullName')       || document.getElementById('modFullName')?.value?.trim()       || '',
        modNominatingOrg:  fv(_modData, 'modNominatingOrg')  || document.getElementById('modNominatingOrg')?.value?.trim()  || '',
        modBirthday:       fv(_modData, 'modBirthday')       || document.getElementById('modBirthday')?.value?.trim()       || '',
        modAge:            fv(_modData, 'modAge')            || document.getElementById('modAge')?.value?.trim()            || '',
        modSex:            fv(_modData, 'modSex')            || document.getElementById('modSex')?.value?.trim()            || '',
        modReligion:       fv(_modData, 'modReligion')       || document.getElementById('modReligion')?.value?.trim()       || '',
        modDesignation:    fv(_modData, 'modDesignation')    || document.getElementById('modDesignation')?.value?.trim()    || '',
        modDepartment:     fv(_modData, 'modDepartment')     || document.getElementById('modDepartment')?.value?.trim()     || '',
        modStatus:         fv(_modData, 'modStatus')         || document.getElementById('modStatus')?.value?.trim()         || '',
        modYearsService:   fv(_modData, 'modYearsService')   || document.getElementById('modYearsService')?.value?.trim()   || '',
        modMobile:         fv(_modData, 'modMobile')         || document.getElementById('modMobile')?.value?.trim()         || '',
        modEmail:          fv(_modData, 'modEmail')          || document.getElementById('modEmail')?.value?.trim()          || '',
        modLandline:       fv(_modData, 'modLandline')       || document.getElementById('modLandline')?.value?.trim()       || '',
        modFacebook:       fv(_modData, 'modFacebook')       || document.getElementById('modFacebook')?.value?.trim()       || '',
        modCityAddress:    fv(_modData, 'modCityAddress')    || document.getElementById('modCityAddress')?.value?.trim()    || '',
        modSpecialSkills:  fv(_modData, 'modSpecialSkills')  || document.getElementById('modSpecialSkills')?.value?.trim()  || '',
        modWasModBefore:   fv(_modData, 'modWasModBefore')   || document.getElementById('modWasModBefore')?.value?.trim()   || '',
        modPrevOrgName:    fv(_modData, 'modPrevOrgName')    || document.getElementById('modPrevOrgName')?.value?.trim()    || '',
        modIsModOfNom:     fv(_modData, 'modIsModOfNominating') || document.getElementById('modIsModOfNominating')?.value?.trim() || '',
        modYearsAsModNom:  fv(_modData, 'modYearsAsModNominating') || document.getElementById('modYearsAsModNominating')?.value?.trim() || '',

        // ── Strategic plan (B-1) ─────────────────────────────
        stratAcronym:    _spData.stratAcronym    || '',
        stratOrgFullName:_spData.stratOrgFullName || '',
        stratMission:    _spData.stratMission    || '',
        stratVision:     _spData.stratVision     || '',
        'table_bodyOrgDev':   _spData['__table_bodyOrgDev']   || [],
        'table_bodyStudServ': _spData['__table_bodyStudServ']  || [],
        'table_bodyCommInv':  _spData['__table_bodyCommInv']   || [],
        // Budget fields
        budgetOrgDev:    _spData.budgetOrgDev   || '',
        budgetStudServ:  _spData.budgetStudServ || '',
        budgetCommInv:   _spData.budgetCommInv  || '',
        budgetTotal:     _spData.budgetTotal    || '',
        fundSOF:         _spData.fundSOF        || '',
        fundPTA:         _spData.fundPTA        || '',
        fundMembership:  _spData.fundMembership || '',
        fundRaised:      _spData.fundRaised     || '',
        fundTotal:       _spData.fundTotal      || '',

        // ── President leadership & awards tables (B-2) ───────
        'table_presLeadershipBody': _presData['__table_presLeadershipBody'] || [],
        'table_presAwardsBody':     _presData['__table_presAwardsBody']     || [],

        // ── Officers & Members ───────────────────────────────
        officers: (function() {
            try {
                var saved = localStorage.getItem('sacdev_officers_list');
                return saved ? JSON.parse(saved) : (_officersList || []);
            } catch(e) { return _officersList || []; }
        })(),
        officerCount: (function() {
            try {
                var saved = localStorage.getItem('sacdev_officers_list');
                var list = saved ? JSON.parse(saved) : (_officersList || []);
                return list.filter(function(o) { return o.position; }).length;
            } catch(e) { return (_officersList || []).length; }
        })(),
        // Members list (B-4)
        members: (function() {
            var tb = document.getElementById('membersTableBody');
            if (!tb) return [];
            var rows = [];
            tb.querySelectorAll('tr').forEach(function(tr) {
                var inputs = tr.querySelectorAll('input');
                var name   = inputs[0]?.value.trim() || '';
                if (!name) return;
                rows.push({
                    name:   name,
                    course: inputs[1]?.value.trim() || '',
                    qpi:    inputs[2]?.value.trim() || '',
                    mobile: inputs[3]?.value.trim() || ''
                });
            });
            return rows;
        })(),
        memberCount: (() => {
            const tb = document.getElementById('membersTableBody');
            let n = 0;
            if (tb) tb.querySelectorAll('tr').forEach(tr => {
                if (tr.querySelectorAll('input')[0]?.value.trim()) n++;
            });
            return n;
        })(),

        // ── Moderator leadership table (B-5.1) ───────────────
        'table_modLeadershipBody': _modData['__table_modLeadershipBody'] || [],

        // ── Documents ────────────────────────────────────────
        constitutionFileName: document.getElementById('constitutionFileName')?.textContent?.trim() || '',
        constitutionUrl:  document.getElementById('constitutionInput')?.dataset?.cloudinaryUrl || '',
        presPhotoUrl:     document.getElementById('presPhotoInput')?.dataset?.cloudinaryUrl || '',
        presSignatureUrl: document.getElementById('presSignatureInput')?.dataset?.cloudinaryUrl || '',
        modPhotoUrl:      document.getElementById('modPhotoInput')?.dataset?.cloudinaryUrl || '',
        modSignatureUrl:  document.getElementById('modSignatureInput')?.dataset?.cloudinaryUrl || '',
        orgLogoUrl:       document.getElementById('orgLogoInput')?.dataset?.cloudinaryUrl || '',
        submittedAt: new Date().toLocaleString('en-PH')
    };

    // Submit to Firebase via backend
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';
    }

    try {
        const res = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Server error');
        }

        const result = await res.json();

        // Navigate to application status page
        const statusData = {
            found:       true,
            status:      'pending',
            org:         submission.org,
            orgName:     submission.orgName,
            email:       submission.email,
            orgEmail:    submission.orgEmail,
            submittedAt: submission.submittedAt
        };

        if (window.populateStatusPage) window.populateStatusPage(statusData);

        // Store the submission ID so refresh can find it later
        try { sessionStorage.setItem('sacdev_submissionId', result.id || ''); } catch(e) {}
        try { sessionStorage.setItem('sacdev_currentPage', 'submissionConfirmation'); } catch(e) {}

        if (window.goToPage) {
            window.goToPage('submissionConfirmation');
        } else {
            alert('All requirements have been submitted successfully!\n\nOSA-SACDEV will evaluate your re-registration requirements before granting recognition.');
            goToPage('dashboard');
        }
    } catch (e) {
        console.error('Submission failed:', e);
        alert('Submission failed: ' + e.message + '\n\nPlease check your connection and try again.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
    }
}
