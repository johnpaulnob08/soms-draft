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

// STATE

let currentState = {
    selectedCouncil: null,
    selectedOrg: null,
    isLoggedIn: false,
    userEmail: null,
    authMode: 'login',        
    dashTab: 'home',      

    orgName: null,
    orgType: null,
    yearEstablished: null,
    orgCluster: null,
    presidentName: null,
    presidentMobile: null,
    presidentEmail: null,
    moderatorName: null
};

// ROUTING
function goToPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageName).classList.remove('hidden');
    window.scrollTo(0, 0);

    document.querySelectorAll('[id^="progress-circle-"]').forEach(el => el.remove());


    const formPages = ['orgInfo','strategicPlan','presidentProfile','orgOfficers','orgMembers','moderatorProfile','gradeAndDocs','submissionSummary'];
    const sidenav = document.getElementById('formSidenav');
    if (formPages.includes(pageName)) {
        sidenav.classList.remove('hidden');
        document.body.classList.add('has-form-sidenav');

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

function getSortedCouncils() {
    const others = Object.keys(councils)
        .filter(k => k !== 'CSG' && k !== 'AECO')
        .sort();
    return ['CSG', 'AECO', ...others];
}

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


function initDashboard() {

    switchDashTab(currentState.dashTab || 'home');
}

function switchDashTab(tab) {
    currentState.dashTab = tab;

    document.querySelectorAll('.dash-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.querySelectorAll('.dash-tab').forEach(el => el.classList.add('hidden'));
    const activePanel = document.getElementById('dashTab-' + tab);
    if (activePanel) activePanel.classList.remove('hidden');

    if (tab === 'directory') renderDirectory('');
    if (tab === 'councils')  renderCouncils();
    if (tab === 'clusters')  renderClusters();
}

function renderDirectory(query) {
    const container = document.getElementById('directoryList');

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
        item.title = 'Click to proceed to registration';
        item.textContent = org;
        item.onclick = () => { window.location.href = 'login.html'; };
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
        item.className = 'dash-council-item';
        item.innerHTML = `<span class="dash-council-key">${c.key}</span><span class="dash-council-name">${c.name}</span>`;
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
            li.title = 'Click to proceed to registration';
            li.textContent = org;
            li.onclick = () => { window.location.href = 'login.html'; };
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

function initAuth() {}

function setAuthMode(mode) { currentState.authMode = mode; }
function toggleAuthMode() {
    goToPage(currentState.authMode === 'register' ? 'loginPage' : 'registerPage');
}

function handleLogin() {
    currentState.authMode = 'login';

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

window.showAuthError = function(msg) {
    const loginVisible = document.getElementById('loginPage') &&
                         !document.getElementById('loginPage').classList.contains('hidden');
    const targetId = loginVisible ? 'loginError' : 'registerError';
    const errEl = document.getElementById(targetId);
    if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
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

function proceedWithConfirm() {
    if (confirm('I confirm that I have read and understood all the re-registration guidelines. Proceed?')) {
        goToPage('orgInfo');
    }
}


function initOrgInfo() {
    // Dapat naay org name dropdown grouped by cluster (alphabetical dapat each)
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
    if (currentState.orgType)          document.getElementById('infoOrgType').value           = currentState.orgType;
    if (currentState.orgCluster)       document.getElementById('infoCluster').value            = currentState.orgCluster;
    if (currentState.yearEstablished)  document.getElementById('infoYearEstablished').value    = currentState.yearEstablished;
    if (currentState.presidentName)    document.getElementById('infoPresidentName').value      = currentState.presidentName;
    if (currentState.presidentMobile)  document.getElementById('infoPresidentMobile').value    = currentState.presidentMobile;
    if (currentState.presidentEmail)   document.getElementById('infoPresidentEmail').value     = currentState.presidentEmail;
    if (currentState.moderatorName)    document.getElementById('infoModeratorName').value      = currentState.moderatorName;
}

function onOrgNameChange(orgName) {
    if (!orgName) return;
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
    const orgType  = document.getElementById('infoOrgType').value.trim();
    const cluster  = document.getElementById('infoCluster').value.trim();
    const yearEst  = document.getElementById('infoYearEstablished').value.trim();
    const presName = document.getElementById('infoPresidentName').value.trim();
    const presMob  = document.getElementById('infoPresidentMobile').value.trim();
    const presEmail= document.getElementById('infoPresidentEmail').value.trim();
    const modName  = document.getElementById('infoModeratorName').value.trim();

    if (!orgName)   { alert('Please select your Organization Name.');      document.getElementById('infoOrgName').focus();         return; }
    if (!orgType)   { alert('Please select a Type of Organization.');      document.getElementById('infoOrgType').focus();         return; }
    if (!cluster)   { alert('Please select an Org Cluster.');              document.getElementById('infoCluster').focus();         return; }
    if (!presName)  { alert("Please enter the President's Full Name.");    document.getElementById('infoPresidentName').focus();    return; }
    if (!presMob)   { alert("Please enter the President's Mobile Number.");document.getElementById('infoPresidentMobile').focus();  return; }
    if (!presEmail) { alert("Please enter the President's Email Address.");document.getElementById('infoPresidentEmail').focus();   return; }
    if (!modName)   { alert('Please enter the Name of Moderator-Nominee.');document.getElementById('infoModeratorName').focus();   return; }

    currentState.orgName         = orgName;
    currentState.orgType         = orgType;
    currentState.orgCluster      = cluster;
    currentState.yearEstablished = yearEst;
    currentState.presidentName   = presName;
    currentState.presidentMobile = presMob;
    currentState.presidentEmail  = presEmail;
    currentState.moderatorName   = modName;

    saveFormData('orgInfo');
    goToPage('strategicPlan');
}


function initStrategicPlan() {

    const orgNameEl = document.getElementById('stratOrgFullName');
    if (orgNameEl && !orgNameEl.value) {
        orgNameEl.value = currentState.orgName || currentState.selectedOrg || '';
    }

    ['bodyOrgDev','bodyStudServ','bodyCommInv'].forEach(id => {
        if (!document.getElementById(id).hasChildNodes()) {
            addRow(id, id.replace('body','total').replace('OrgDev','OrgDev').replace('StudServ','StudServ').replace('CommInv','CommInv'));
            addRow(id, id.replace('body','total').replace('OrgDev','OrgDev').replace('StudServ','StudServ').replace('CommInv','CommInv'));
        }
    });
   
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
    const acronym = document.getElementById('stratAcronym').value.trim();
    const orgName = document.getElementById('stratOrgFullName').value.trim();
    if (!acronym || !orgName) {
        alert('Please fill in the Org Acronym and Complete Name of Organization before continuing.');
        return;
    }
    saveFormData('strategicPlan');
    goToPage('presidentProfile');
}

function createProgressCircle(containerId) {

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

//  Org Info progress 
function initOrgInfoProgress() {
    createProgressCircle('orgInfo');
    const fields = ['infoOrgName','infoOrgType','infoCluster','infoPresidentName','infoPresidentMobile','infoPresidentEmail','infoModeratorName'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateOrgInfoProgress);
        if (el) el.addEventListener('change', updateOrgInfoProgress);
    });
    updateOrgInfoProgress();
}

function updateOrgInfoProgress() {
    const fields = ['infoOrgName','infoOrgType','infoCluster','infoPresidentName','infoPresidentMobile','infoPresidentEmail','infoModeratorName'];
    let filled = 0;
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });
    const pct = (filled / fields.length) * 100;
    updateCircle('orgInfo', pct, 'Org Info');
}

//  Strat Plan progress
function updateStratPlanProgress() {
    let total = 0, filled = 0;

    const coreFields = ['stratAcronym','stratOrgFullName','stratMission','stratVision'];
    coreFields.forEach(id => {
        total++;
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });

    ['bodyOrgDev','bodyStudServ','bodyCommInv'].forEach(bodyId => {
        total++;
        const tbody = document.getElementById(bodyId);
        if (!tbody) return;
        const textareas = tbody.querySelectorAll('td:nth-child(2) textarea');
        let hasEntry = false;
        textareas.forEach(ta => { if (ta.value.trim()) hasEntry = true; });
        if (hasEntry) filled++;
    });

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

window.addEventListener('DOMContentLoaded', () => {

    if (document.getElementById('dashboard')) {
        goToPage('dashboard');
    }
});

const STORAGE_KEY_PREFIX = 'sacdev_form_';

function saveFormData(formId) {
    const data = collectFormData(formId);
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + formId, JSON.stringify(data));
        showSaveToast('Progress saved!');
    } catch(e) {
        console.warn('localStorage save failed:', e);
    }
}

function loadFormData(formId) {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + formId);
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

    if (currentForm === 'presidentProfile') {
        const required = [
            { id: 'presFullName',   label: "President's Full Name" },
            { id: 'presCourseYear', label: "Course and Year" },
            { id: 'presMobile',     label: "Mobile Number" },
            { id: 'presEmail',      label: "Email Address" },
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
    }
    if (currentForm === 'orgOfficers') {
        const tbody = document.getElementById('officersTableBody');
        let hasOfficer = false;
        if (tbody) tbody.querySelectorAll('tr').forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            if (inputs[0]?.value.trim() && inputs[1]?.value.trim()) hasOfficer = true;
        });
        if (!hasOfficer) {
            alert('Please add at least one officer with Position and Name filled in before proceeding.');
            return;
        }
    }
    if (currentForm === 'moderatorProfile') {
        const required = [
            { id: 'modFullName',    label: "Moderator's Full Name" },
            { id: 'modDesignation', label: "Official University Designation" },
            { id: 'modDepartment',  label: "Unit / College / Department" },
            { id: 'modMobile',      label: "Moderator's Mobile Number" },
            { id: 'modEmail',       label: "Moderator's Email" },
        ];
        for (const f of required) {
            const el = document.getElementById(f.id);
            if (!el || !el.value.trim()) {
                alert('Please fill in the required field: ' + f.label);
                if (el) el.focus();
                return;
            }
        }
    }
    saveFormData(currentForm);
    goToPage(nextPage);
}

function collectFormData(formId) {
    const container = document.getElementById(formId);
    if (!container) return {};
    const data = {};
    container.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
        data[el.id] = el.value;
    });

    container.querySelectorAll('tbody[id]').forEach(tbody => {
        data['__table_' + tbody.id] = collectTableRows(tbody);
    });

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

    container.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
        if (data[el.id] !== undefined) el.value = data[el.id];
    });

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

    if (data['__file_gradeSlipsFileName']) document.getElementById('gradeSlipsFileName').textContent = data['__file_gradeSlipsFileName'];
    if (data['__file_constitutionFileName']) document.getElementById('constitutionFileName').textContent = data['__file_constitutionFileName'];
}



function handleImageUpload(inputId, previewId, placeholderId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = e => {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        if (placeholder) placeholder.style.display = 'none';

        const box = input.closest('.upload-box') || input.previousElementSibling;
        if (box) box.classList.add('has-file');

        const pageEl = input.closest('.page');
        if (pageEl) triggerProgressUpdate(pageEl.id);
    };
    reader.readAsDataURL(file);
}

function handleFileUpload(inputId, fileNameElId, boxId) {
    const input = document.getElementById(inputId);
    const nameEl = document.getElementById(fileNameElId);
    const box = document.getElementById(boxId);
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    if (nameEl) nameEl.textContent = '+ ' + file.name;
    if (box) box.classList.add('has-file');
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

function initPresidentProfile() {

    if (currentState.presidentName && !document.getElementById('presFullName').value) {
        document.getElementById('presFullName').value = currentState.presidentName;
    }
    if (currentState.presidentMobile && !document.getElementById('presMobile').value) {
        document.getElementById('presMobile').value = currentState.presidentMobile;
    }
    if (currentState.presidentEmail && !document.getElementById('presEmail').value) {
        document.getElementById('presEmail').value = currentState.presidentEmail;
    }

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

    restoreFormData('presidentProfile');

    ['presFullName','presCourseYear','presMobile','presEmail'].forEach(id => {
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
    const required = ['presFullName','presCourseYear','presMobile','presEmail'];
    let filled = 0;
    required.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });

    const sig = document.getElementById('presSignaturePreview');
    if (sig && !sig.classList.contains('hidden') && sig.src) filled++;
    const total = required.length + 1; // +1 for signature
    updateCircle('presidentProfile', (filled / total) * 100, 'Form B-2');
}

function initOrgOfficers() {
    const tbody = document.getElementById('officersTableBody');
    if (tbody && tbody.children.length === 0) {

        addOfficerRow();
        if (currentState.presidentName) {
            const firstRow = tbody.querySelector('tr');
            if (firstRow) {
                const inputs = firstRow.querySelectorAll('input');
                inputs[0].value = 'President';
                inputs[1].value = currentState.presidentName;
                if (currentState.presidentMobile) inputs[6].value = currentState.presidentMobile;
            }
        }
        addOfficerRow();
    }
    restoreFormData('orgOfficers');
    updateOfficersProgress();
}

function addOfficerRow() {
    const tbody = document.getElementById('officersTableBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="strat-cell-input" placeholder="e.g. President"></td>
        <td><input type="text" class="strat-cell-input" placeholder="Last Name, First Name, MI"></td>
        <td><input type="text" class="strat-cell-input" placeholder="e.g. BS CS, 3rd Year"></td>
        <td><input type="number" class="strat-cell-input" placeholder="0.00" step="0.01" min="0" max="4" title="Semester 1 QPI"></td>
        <td><input type="number" class="strat-cell-input" placeholder="0.00" step="0.01" min="0" max="4" title="Semester 2 QPI"></td>
        <td><input type="number" class="strat-cell-input" placeholder="0.00" step="0.01" min="0" max="4" title="Intercession QPI"></td>
        <td><input type="tel" class="strat-cell-input" placeholder="09XXXXXXXXX"></td>
        <td><button class="btn-del-row" onclick="deleteSimpleRow(this)" title="Remove">&#215;</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateOfficersProgress));
}

function updateOfficersProgress() {
    const tbody = document.getElementById('officersTableBody');
    let filledRows = 0;
    if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            if (inputs[0] && inputs[0].value.trim() && inputs[1] && inputs[1].value.trim()) filledRows++;
        });
    }
    const pct = filledRows > 0 ? Math.min((filledRows / 3) * 100, 100) : 0;
    updateCircle('orgOfficers', pct, 'Form B-3');
}


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

function initModeratorProfile() {

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

    ['modFullName','modDesignation','modDepartment','modMobile','modEmail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', updateModeratorProgress); el.addEventListener('change', updateModeratorProgress); }
    });
    updateModeratorProgress();
}

function updateModeratorProgress() {
    const required = ['modFullName','modDesignation','modDepartment','modMobile','modEmail'];
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

function initGradeAndDocs() {
    restoreFormData('gradeAndDocs');
    updateGradeDocsProgress();
}

function updateGradeDocsProgress() {
    let filled = 0;
    const total = 3;

    const gradeBox = document.getElementById('gradeSlipsBox');
    if (gradeBox && gradeBox.classList.contains('has-file')) filled++;

    const constBox = document.getElementById('constitutionBox');
    if (constBox && constBox.classList.contains('has-file')) filled++;

    const logoPreview = document.getElementById('orgLogoPreview');
    if (logoPreview && !logoPreview.classList.contains('hidden') && logoPreview.src) filled++;

    updateCircle('gradeAndDocs', (filled / total) * 100, 'Documents');
}

function submitAllForms() {

    saveFormData('gradeAndDocs');
    const gradeBox = document.getElementById('gradeSlipsBox');
    const constBox = document.getElementById('constitutionBox');
    const logoPreview = document.getElementById('orgLogoPreview');

    if (!gradeBox.classList.contains('has-file') || !constBox.classList.contains('has-file') || logoPreview.classList.contains('hidden')) {
        if (!confirm('Some documents are still missing. Submit anyway?')) return;
    }
    alert('All requirements have been submitted successfully!\n\nPlease ensure you have completed all forms and uploaded all required documents. OSA-SACDEV will evaluate your re-registration requirements before granting recognition.');
}

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

    container.appendChild(buildSection('ACCOUNT', null, [
        { label: 'XU Email', value: currentState.userEmail, required: true },
        { label: 'Organization', value: currentState.selectedOrg, required: true },
        { label: 'Council', value: currentState.selectedCouncil ? (currentState.selectedCouncil + ' – ' + (councils[currentState.selectedCouncil]?.name || '')) : '', required: true },
    ], 'summary-account'));

    container.appendChild(buildSection('ORGANIZATION INFORMATION', null, [
        { label: 'Org Cluster', value: val('infoCluster'), required: true },
        { label: "President's Name", value: val('infoPresidentName'), required: true },
        { label: "President's Mobile", value: val('infoPresidentMobile'), required: true },
        { label: "President's Email", value: val('infoPresidentEmail'), required: true },
        { label: 'Moderator Nominee', value: val('infoModeratorName'), required: true },
    ], 'summary-orginfo'));

    container.appendChild(buildSection('STRATEGIC PLAN', 'Form B-1', [
        { label: 'Org Acronym', value: val('stratAcronym'), required: true },
        { label: 'Full Org Name', value: val('stratOrgFullName'), required: true },
        { label: 'Mission Statement', value: val('stratMission') ? '+ Filled' : '', required: true },
        { label: 'Vision Statement', value: val('stratVision') ? '+ Filled' : '', required: true },
    ], 'summary-b1'));

    container.appendChild(buildSection("PRESIDENT'S PROFILE", 'Form B-2', [
        { label: 'Full Name', value: val('presFullName'), required: true },
        { label: 'Course and Year', value: val('presCourseYear'), required: true },
        { label: 'Mobile Number', value: val('presMobile'), required: true },
        { label: 'Email', value: val('presEmail'), required: true },
        { label: 'E-Signature', value: imgFilled('presSignaturePreview') ? '+ Uploaded' : '', required: true },
        { label: 'Photo ID', value: imgFilled('presPhotoPreview') ? '+ Uploaded' : '', required: false },
    ], 'summary-b2'));

    const officerRows = document.getElementById('officersTableBody')?.querySelectorAll('tr') || [];
    let officerCount = 0;
    officerRows.forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        if (inputs[0]?.value.trim() && inputs[1]?.value.trim()) officerCount++;
    });
    container.appendChild(buildSection('ORGANIZATION OFFICERS', 'Form B-3', [
        { label: 'Officers Listed', value: officerCount > 0 ? `${officerCount} officer(s)` : '', required: true },
    ], 'summary-b3'));

    const memberRows = document.getElementById('membersTableBody')?.querySelectorAll('tr') || [];
    let memberCount = 0;
    memberRows.forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        if (inputs[0]?.value.trim()) memberCount++;
    });
    container.appendChild(buildSection('ORGANIZATION MEMBERS', 'Form B-4', [
        { label: 'Members Listed', value: memberCount > 0 ? `${memberCount} member(s)` : 'None / Not applicable', required: false },
    ], 'summary-b4'));

    container.appendChild(buildSection("MODERATOR'S PROFILE", 'Form B-5.1', [
        { label: 'Full Name', value: val('modFullName'), required: true },
        { label: 'Nominating Org', value: val('modNominatingOrg'), required: true },
        { label: 'Designation', value: val('modDesignation'), required: true },
        { label: 'Department', value: val('modDepartment'), required: true },
        { label: 'Mobile Number', value: val('modMobile'), required: true },
        { label: 'Email', value: val('modEmail'), required: true },
        { label: 'E-Signature', value: imgFilled('modSignaturePreview') ? '+ Uploaded' : '', required: true },
    ], 'summary-b5'));

    container.appendChild(buildSection('GRADE SLIPS, CONSTITUTION & LOGO', 'Form B-6 & Docs', [
        { label: 'Grade Slips (Form B-6)', value: fileFilled('gradeSlipsBox') ? '+ Uploaded' : '', required: true },
        { label: 'Organization Constitution', value: fileFilled('constitutionBox') ? '+ Uploaded' : '', required: true },
        { label: 'Organization Logo', value: imgFilled('orgLogoPreview') ? '+ Uploaded' : '', required: true },
    ], 'summary-b6'));

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

async function submitAllForms() {
    const submitBtn = document.getElementById('finalSubmitBtn');
    if (submitBtn && submitBtn.disabled) {
        alert('Please fill in all required fields before submitting.');
        return;
    }
    saveFormData('gradeAndDocs');

    const submission = {
        org: currentState.selectedOrg || '—',
        council: currentState.selectedCouncil || '—',
        president: document.getElementById('presFullName')?.value?.trim() || currentState.presidentName || '—',
        email: currentState.userEmail || '—',
        cluster: document.getElementById('infoCluster')?.value || currentState.orgCluster || '—',
        presidentMobile: currentState.presidentMobile || '—',
        presidentEmail: currentState.presidentEmail || '—',
        moderatorName: currentState.moderatorName || '—',
        submittedAt: new Date().toLocaleString('en-PH')
    };

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

        alert('All requirements have been submitted successfully!\n\nPlease ensure you have completed all forms and uploaded all required documents. OSA-SACDEV will evaluate your re-registration requirements before granting recognition.');
        goToPage('dashboard');
    } catch (e) {
        console.error('Submission failed:', e);
        alert('Submission failed: ' + e.message + '\n\nPlease check your connection and try again.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
    }
}