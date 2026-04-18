const councils = {
    CSG: { name: 'Central Student Government', isCouncilOrg: true, orgs: [] },
    AECO: {
        name: 'Assembly of Extra-Curricular Organizations',
        isCouncilOrg: true,
        orgs: [
            'Atenista Ako Movement (AAM)','Ateneo Camera Club (ACC)','Ateneo Diplomatic Corps (ADC)',
            'Ateneo Mountaineering Society (AMS)','Ateneo Rover Circle (ARC)','Ateneo School for Upcoming Leaders (ASUL)',
            'Association of Xavier University Oro Scholars (AXUOS)','Circulo de Arte (CDA)','Crusader Publication (CRUSADER)',
            'Crusader Yearbook (CYB)','Google Developers Student Clubs (GDSC)','Kaliwat Ki Apu Aguy (KALIWAT)',
            'Nature Crusaders of the Philippines Foundation (NCPF)','Soundtable (SOUNDTABLE)',
            'STREAMS – Pathways to Higher Education (STREAMS)','Xavier Ateneo Film Society (XAFS)',
            'Xavier Campus Esports and Entertainment Development (XCEED)','Xavier Philharmonia (XU PHIL)',
            'Xavier University Band (XU BAND)','Xavier University Cultural Dance Troupe (XUCDT)',
            'Xavier University Glee Club (XUGC)','XU Bullriders (BULLRIDERS)',
            'Xavier University Japan Karate Association (XU JKA)','Xavier University Red Cross Youth (XU RCY)',
            'Graduate School Student Council (GSSC)'
        ]
    },
    ACES: { name: 'Association of the College of Engineering Students', isCouncilOrg: true, orgs: ['IIEE','JIECEP','JPIChE','JPSME','PICE','PIIE'] },
    ASC: { name: 'Agriculture Student Council', isCouncilOrg: true, orgs: ['AAC','ACROSS','ASAGE','JPSAS','PAFT','PSABE-PPG','PAA Jrs'] },
    CONUS: { name: 'Council of Nursing Students', isCouncilOrg: true, orgs: [] },
    CSSC: { name: 'Computer Studies Student Council', isCouncilOrg: true, orgs: ['AISSA','XCEL','XCITeS'] },
    SBMSC: { name: 'School of Business Management Student Council', isCouncilOrg: true, orgs: ['JFINEX','JMA','JPIA','XU-JPAMA'] },
    TG: { name: "Teacher's Guild", isCouncilOrg: true, orgs: ['KAFIL','XELLO','XASED','XU-HUGE','XU-KASAPI','SPEDSOC','XUSELICS'] },
    UNITASS: { name: 'United Arts and Sciences Student Council', isCouncilOrg: true, orgs: ['ADC','AHS','APC','CHEMSOC','DEVCOMSOC','ECOSOC','MATHSOC','BIOPHILIC','XISA','XUPS','XASS'] }
};

function getSortedCouncils() {
    const others = Object.keys(councils)
        .filter(k => k !== 'CSG' && k !== 'AECO')
        .sort();
    return ['CSG', 'AECO', ...others];
}

function goToPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageName).classList.remove('hidden');
    window.scrollTo(0, 0);
}

// ADMIN LOGIN
const ADMIN_EMAIL = 'sacdevAdmin@xu.edu.ph';
const ADMIN_PASSWORD = 'SacDevAdminSOMS';

function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const pass  = document.getElementById('adminPassword').value;
    const errEl = document.getElementById('adminLoginError');

    errEl.classList.add('hidden');

    if (!email || !pass) {
        errEl.textContent = 'Please enter both email and password.';
        errEl.classList.remove('hidden');
        return;
    }

    if (email !== ADMIN_EMAIL || pass !== ADMIN_PASSWORD) {
        errEl.textContent = 'Invalid credentials.';
        errEl.classList.remove('hidden');
        return;
    }

    goToPage('adminDashboard');
    initAdminDashboard(); // loads data from backend
}
async function initAdminDashboard() {
    let submissions = [];

    try {
        const res = await fetch('/submissions');
        submissions = await res.json();
    } catch (e) {
        console.error('Error fetching data:', e);
    }

    // Stats
    document.getElementById('statTotal').textContent = submissions.length;
    document.getElementById('statComplete').textContent =
        submissions.filter(s => s.status === 'approved').length;
    document.getElementById('statPending').textContent =
        submissions.filter(s => s.status !== 'approved').length;

    // Table
    const tbody = document.getElementById('adminSubmissionsBody');
    const noData = document.getElementById('adminNoData');
    tbody.innerHTML = '';

    if (submissions.length === 0) {
        noData.classList.remove('hidden');
    } else {
        noData.classList.add('hidden');

        submissions.forEach((s, i) => {
            const tr = document.createElement('tr');

            tr.setAttribute(
                'data-search',
                `${s.org || ''} ${s.council || ''} ${s.president || ''} ${s.email || ''}`
                .toLowerCase()
            );

            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${s.org || '-'}</td>
                <td>${s.council || '-'}</td>
                <td>${s.president || '-'}</td>
                <td>${s.email || '-'}</td>
                <td>
                    <span class="admin-status-badge ${s.status === 'approved' ? 'complete' : s.status === 'rejected' ? 'rejected' : 'pending'}">
                        ${s.status || 'pending'}
                    </span>
                </td>
                <td>${s.createdAt || '-'}</td>
                <td>
                    <button onclick="updateStatus('${s.id}', 'approved')" style="background:#22c55e;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;margin-right:4px;">Approve</button>
                    <button onclick="updateStatus('${s.id}', 'rejected')" style="background:#ef4444;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Reject</button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    }

    // Council 
    const grid = document.getElementById('adminCouncilGrid');
    grid.innerHTML = '';

    getSortedCouncils().forEach(key => {
        const c = councils[key];
        const count = c.orgs.length + (c.isCouncilOrg ? 1 : 0);

        const card = document.createElement('div');
        card.className = 'admin-council-card';

        card.innerHTML = `
            <div>${key}</div>
            <div>${c.name}</div>
            <div>${count} orgs</div>
        `;

        grid.appendChild(card);
    });
}

// SEARCH FILTER
function filterAdminTable() {
    const q = document.getElementById('adminSearch').value.toLowerCase();

    document.querySelectorAll('#adminSubmissionsBody tr').forEach(tr => {
        const text = tr.getAttribute('data-search') || '';
        tr.style.display = text.includes(q) ? '' : 'none';
    });
}

async function updateStatus(id, status) {
    try {
        const res = await fetch(`/submissions/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Server error');
        }

        initAdminDashboard();
    } catch (e) {
        alert('Failed to update status: ' + e.message);
    }
}
