const CLUSTERS = {
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
        "Teacher's Guild (TG)",
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
        "Xavier Computer Enthusiasts' League (XCEL)"
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
        "Xavier University Special Educators' Society (SPEDSOC)"
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

let allSubmissions = [];
let reportCharts   = {};

const ADMIN_EMAIL    = 'sacdevAdmin@xu.edu.ph';
const ADMIN_PASSWORD = 'SacDevAdminSOMS';

function goToPage(id) {
    document.querySelectorAll('#adminLogin, #adminDashboard').forEach(el => {
        el.classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0, 0);
}

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
        errEl.textContent = 'Invalid credentials. Please try again.';
        errEl.classList.remove('hidden');
        return;
    }

    try { sessionStorage.setItem('sacdev_adminLoggedIn', '1'); } catch(e) {}
    goToPage('adminDashboard');
    initAdminDashboard();
}

function handleAdminLogout() {
    allSubmissions = [];
    try { sessionStorage.removeItem('sacdev_adminLoggedIn'); } catch(e) {}
    goToPage('adminLogin');
    document.getElementById('adminEmail').value    = '';
    document.getElementById('adminPassword').value = '';
}

async function initAdminDashboard() {
    document.getElementById('adminLoading').style.display = 'block';
    document.getElementById('adminSubmissionsBody').innerHTML = '';
    document.getElementById('adminNoData').classList.add('hidden');

    try {
        const res = await fetch('/submissions');
        if (!res.ok) throw new Error('Failed to fetch submissions');
        allSubmissions = await res.json();
    } catch (e) {
        console.error('Fetch error:', e);
        allSubmissions = [];
    }

    document.getElementById('adminLoading').style.display = 'none';
    renderStats();
    renderTable(allSubmissions);
    renderClusterAccordion();
}

function renderStats() {
    const total    = allSubmissions.length;
    const approved = allSubmissions.filter(s => s.status === 'approved').length;
    const pending  = allSubmissions.filter(s => s.status === 'pending' || !s.status).length;

    animateCount('statTotal',    total);
    animateCount('statComplete', approved);
    animateCount('statPending',  pending);
}

function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step  = Math.max(1, Math.floor(target / 20));
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
    }, 40);
}

function renderTable(submissions) {
    const tbody  = document.getElementById('adminSubmissionsBody');
    const noData = document.getElementById('adminNoData');
    tbody.innerHTML = '';

    if (!submissions.length) {
        noData.classList.remove('hidden');
        return;
    }
    noData.classList.add('hidden');

    submissions.forEach((s, i) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-search',
            `${s.org||''} ${s.orgName||''} ${s.president||''} ${s.orgEmail||''} ${s.email||''}`.toLowerCase()
        );
        tr.setAttribute('data-id', s.id);

        tr.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            openDetailModal(s);
        });

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td class="org-name-cell">${s.org || s.orgName || '—'}</td>
            <td>${s.president || '—'}</td>
            <td class="email-cell">${s.orgEmail || s.email || '—'}</td>
            <td class="status-actions-cell">
                ${statusBadge(s.status)}
                <div class="inline-status-btns">
                    <button class="btn-inline-approve ${s.status === 'approved' ? 'active' : ''}"
                        onclick="updateStatusAndRefresh('${s.id}', 'approved')" title="Approve">✓</button>
                    <button class="btn-inline-pending ${s.status === 'pending' || !s.status ? 'active' : ''}"
                        onclick="updateStatusAndRefresh('${s.id}', 'pending')" title="Set Pending">⏳</button>
                    <button class="btn-inline-reject ${s.status === 'rejected' ? 'active' : ''}"
                        onclick="updateStatusAndRefresh('${s.id}', 'rejected')" title="Reject">✕</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function statusBadge(status) {
    const s = status || 'pending';
    const labels = { approved: '✓ Approved', pending: '⏳ Pending', rejected: '✕ Rejected' };
    return `<span class="status-badge ${s}">${labels[s] || s}</span>`;
}

function filterAdminTable() {
    const q = document.getElementById('adminSearch').value.toLowerCase().trim();
    document.querySelectorAll('#adminSubmissionsBody tr').forEach(tr => {
        const text = tr.getAttribute('data-search') || '';
        tr.style.display = !q || text.includes(q) ? '' : 'none';
    });
}

function renderClusterAccordion() {
    const container = document.getElementById('clusterAccordion');
    container.innerHTML = '';

    const submissionMap = {};
    allSubmissions.forEach(s => {
        const key = (s.org || s.orgName || '').trim();
        if (key) submissionMap[key] = s;
    });

    const sortedClusters = Object.keys(CLUSTERS).sort();

    sortedClusters.forEach(clusterName => {
        const orgs = CLUSTERS[clusterName].slice().sort((a, b) => a.localeCompare(b));
        const submittedOrgs = orgs.filter(o => submissionMap[o]);

        const item = document.createElement('div');
        item.className = 'cluster-item';
        item.innerHTML = `
            <div class="cluster-header" onclick="toggleCluster(this)">
                <div class="cluster-header-left">
                    <span class="cluster-name">${clusterName}</span>
                    <span class="cluster-count">${orgs.length} orgs</span>
                    ${submittedOrgs.length ? `<span class="cluster-submitted">✓ ${submittedOrgs.length} submitted</span>` : ''}
                </div>
                <span class="cluster-chevron">▼</span>
            </div>
            <div class="cluster-body">
                <ul class="cluster-org-list">
                    ${orgs.map(org => {
                        const sub = submissionMap[org];
                        if (sub) {
                            return `<li class="cluster-org-item has-submission" onclick="openDetailModal(${JSON.stringify(sub).replace(/"/g, '&quot;')})">
                                <span class="org-sub-dot"></span>
                                <span style="flex:1;">${org}</span>
                                ${statusBadge(sub.status)}
                                <span class="cluster-org-arrow">›</span>
                            </li>`;
                        }
                        return `<li class="cluster-org-item">
                            <span style="flex:1;">${org}</span>
                            <span style="font-size:11px;color:#94a3b8;">Not submitted</span>
                        </li>`;
                    }).join('')}
                </ul>
            </div>
        `;
        container.appendChild(item);
    });
}

function toggleCluster(headerEl) {
    const item = headerEl.closest('.cluster-item');
    item.classList.toggle('open');
}

function openDetailModal(submission) {
    const s = typeof submission === 'string' ? JSON.parse(submission) : submission;
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');

    const orgName = s.org || s.orgName || '—';

    const val = (v) => v || '<span style="color:#94a3b8;font-style:italic;">—</span>';

    const officerCount = s.officerCount || '—';
    const memberCount  = s.memberCount  || '—';

    content.innerHTML = `
        <div class="modal-header">
            <div class="modal-header-badge">Org Re-Registration 2026–2027</div>
            <div class="modal-org-name">${orgName}</div>
            <div class="modal-org-meta">
                <span class="modal-meta-item">🏛️ <strong>${val(s.council || s.orgType)}</strong></span>
                <span class="modal-meta-item">📁 <strong>${val(s.cluster)}</strong></span>
                <span class="modal-meta-item">📅 <strong>${val(s.createdAt)}</strong></span>
            </div>
        </div>
        <div class="modal-body">

            <div class="modal-section">
                <div class="modal-section-title">Organization Information</div>
                <div class="modal-grid-2">
                    <div class="modal-field"><label>Org Name</label><span>${val(orgName)}</span></div>
                    <div class="modal-field"><label>Type</label><span>${val(s.orgType || s.council)}</span></div>
                    <div class="modal-field"><label>Cluster</label><span>${val(s.cluster)}</span></div>
                    <div class="modal-field"><label>Year Established</label><span>${val(s.yearEstablished)}</span></div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">President's Information</div>
                <div class="modal-grid-2">
                    <div class="modal-field"><label>Full Name</label><span>${val(s.president)}</span></div>
                    <div class="modal-field"><label>Email</label><span>${val(s.email)}</span></div>
                    <div class="modal-field"><label>Mobile</label><span>${val(s.presidentMobile)}</span></div>
                    <div class="modal-field"><label>Sex</label><span>${val(s.presidentSex)}</span></div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">Form Completion</div>
                <div class="modal-grid-2">
                    <div class="modal-field"><label>Strategic Plan (B-1)</label><span>${s.stratAcronym ? '✓ Filled' : '— Not filled'}</span></div>
                    <div class="modal-field"><label>President Profile (B-2)</label><span>${s.presFullName ? '✓ Filled' : '— Not filled'}</span></div>
                    <div class="modal-field"><label>Officers (B-3)</label><span>${officerCount !== '—' ? `${officerCount} officer(s)` : val(null)}</span></div>
                    <div class="modal-field"><label>Members (B-4)</label><span>${memberCount !== '—' ? `${memberCount} member(s)` : val(null)}</span></div>
                    <div class="modal-field"><label>Moderator (B-5.1)</label><span>${val(s.moderatorName)}</span></div>
                    <div class="modal-field"><label>Constitution</label><span>${s.constitutionFileName && s.constitutionFileName !== 'Click to upload constitution (PDF)' ? '✓ Uploaded' : '— Not uploaded'}</span></div>
                    <div class="modal-field"><label>Logo</label><span>${s.orgLogoData ? '✓ Uploaded' : '— Not uploaded'}</span></div>
                    <div class="modal-field"><label>Submitted At</label><span>${val(s.createdAt)}</span></div>
                </div>
            </div>

            <div class="modal-status-row">
                <span class="modal-status-label">Current Status:</span>
                ${statusBadge(s.status)}
                <div class="modal-action-btns">
                    <button class="btn-approve" onclick="updateStatusAndRefresh('${s.id}', 'approved')">✓ Approve</button>
                    <button class="btn-pending" onclick="updateStatusAndRefresh('${s.id}', 'pending')">⏳ Pending</button>
                    <button class="btn-reject"  onclick="updateStatusAndRefresh('${s.id}', 'rejected')">✕ Reject</button>
                </div>
            </div>
            <div class="modal-publish-row">
                <div class="modal-publish-info">
                    <span class="modal-publish-label">Strategic Plan:</span>
                    <span class="modal-publish-status ${s.published ? 'is-published' : 'not-published'}">
                        ${s.published ? '🟢 Published' : '⚪ Not published'}
                    </span>
                </div>
                <div class="modal-action-btns">
                    ${s.published
                        ? `<button class="btn-unpublish" onclick="togglePublish('${s.id}', false)">Unpublish Plans</button>`
                        : `<button class="btn-publish"   onclick="togglePublish('${s.id}', true)"> Publish Plans</button>`
                    }
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(e) {
    if (e.target === document.getElementById('detailModal')) closeDetailModal();
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.body.style.overflow = '';
}

async function updateStatusAndRefresh(id, status) {
    try {
        const res = await fetch(`/submissions/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Server error');
        closeDetailModal();
        await initAdminDashboard();
    } catch (e) {
        alert('Failed to update status: ' + e.message);
    }
}

function updateStatus(id, status) { updateStatusAndRefresh(id, status); }

async function togglePublish(id, publish) {
    const label = publish ? 'publish' : 'unpublish';
    if (!confirm(`Are you sure you want to ${label} this organization's strategic plans? It will become ${publish ? 'visible' : 'hidden'} on the main dashboard.`)) return;

    try {
        const res = await fetch(`/submissions/${id}/publish`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ published: publish })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Server error');
        closeDetailModal();
        await initAdminDashboard();
        alert(`Strategic plans ${publish ? 'published' : 'unpublished'} successfully.`);
    } catch (e) {
        alert(`Failed to ${label}: ` + e.message);
    }
}

// ════════════════════════════════════════════════
// REPORT PANEL
// ════════════════════════════════════════════════
function toggleReportPanel() {
    const panel = document.getElementById('reportPanel');
    if (panel.classList.contains('hidden')) {
        buildReport();
        panel.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        closeReportPanel();
    }
}

function closeReportPanel(e) {
    if (e && e.target !== document.getElementById('reportPanel')) return;
    document.getElementById('reportPanel').classList.add('hidden');
    document.body.style.overflow = '';
    // Destroy charts to allow re-render
    Object.values(reportCharts).forEach(c => c.destroy());
    reportCharts = {};
}

function buildReport() {
    const content = document.getElementById('reportContent');
    const total    = allSubmissions.length;
    const approved = allSubmissions.filter(s => s.status === 'approved').length;
    const pending  = allSubmissions.filter(s => s.status === 'pending' || !s.status).length;
    const rejected = allSubmissions.filter(s => s.status === 'rejected').length;

    // Submitted org names set
    const submittedNames = new Set(
        allSubmissions.map(s => (s.org || s.orgName || '').trim()).filter(Boolean)
    );

    // All known orgs from CLUSTERS (flat, unique)
    const allKnownOrgs = [...new Set(Object.values(CLUSTERS).flat())].sort();
    const notSubmitted = allKnownOrgs.filter(o => !submittedNames.has(o));

    // Cluster counts for submitted orgs
    const clusterCounts = {};
    Object.keys(CLUSTERS).sort().forEach(c => { clusterCounts[c] = 0; });
    allSubmissions.forEach(s => {
        const c = s.cluster;
        if (c && clusterCounts.hasOwnProperty(c)) clusterCounts[c]++;
    });
    const maxCluster = Math.max(1, ...Object.values(clusterCounts));

    // Sex breakdown
    const male   = allSubmissions.filter(s => (s.presidentSex || '').toLowerCase() === 'male').length;
    const female = allSubmissions.filter(s => (s.presidentSex || '').toLowerCase() === 'female').length;
    const sexOther = total - male - female;

    content.innerHTML = `
        <!-- Summary stats -->
        <div class="report-summary-grid">
            <div class="report-stat"><div class="report-stat-num">${total}</div><div class="report-stat-label">Total Registered</div></div>
            <div class="report-stat"><div class="report-stat-num green">${approved}</div><div class="report-stat-label">Approved</div></div>
            <div class="report-stat"><div class="report-stat-num orange">${pending}</div><div class="report-stat-label">Pending</div></div>
            <div class="report-stat"><div class="report-stat-num red">${rejected}</div><div class="report-stat-label">Rejected</div></div>
        </div>

        <!-- Charts row (side by side) -->
        <div class="report-chart-wrap">
            <div class="report-section-title">Submission Status</div>
            <canvas id="chartStatus"></canvas>
        </div>
        <div class="report-chart-wrap">
            <div class="report-section-title">President Gender Breakdown</div>
            <canvas id="chartSex"></canvas>
        </div>

        <!-- By cluster (full width) -->
        <div class="report-cluster-section" style="grid-column:1/-1;">
            <div class="report-section-title">Submissions by Cluster</div>
            <div class="report-cluster-list">
                ${Object.entries(clusterCounts).map(([name, count]) => `
                    <div class="report-cluster-row">
                        <span class="report-cluster-name" title="${name}">${name}</span>
                        <div class="report-cluster-bar-wrap">
                            <div class="report-cluster-bar" style="width:${Math.round((count/maxCluster)*100)}%"></div>
                        </div>
                        <span class="report-cluster-cnt">${count}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Submitted vs not (full width) -->
        <div style="grid-column:1/-1;">
            <div class="report-section-title">Organization Submission Status</div>
            <div class="report-org-grid">
                <div class="report-org-col submitted">
                    <h4>✓ Submitted (${submittedNames.size})</h4>
                    <ul>${[...submittedNames].sort().map(o => `<li title="${o}">${o}</li>`).join('') || '<li>None yet</li>'}</ul>
                </div>
                <div class="report-org-col not-submitted">
                    <h4>⏳ Not Yet Submitted (${notSubmitted.length})</h4>
                    <ul>${notSubmitted.map(o => `<li title="${o}">${o}</li>`).join('') || '<li>All submitted!</li>'}</ul>
                </div>
            </div>
        </div>
    `;

    // Destroy old charts
    Object.values(reportCharts).forEach(c => c.destroy());
    reportCharts = {};

    // Status doughnut chart
    const ctxStatus = document.getElementById('chartStatus').getContext('2d');
    reportCharts.status = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Pending', 'Rejected'],
            datasets: [{
                data: [approved, pending, rejected],
                backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'DM Sans', size: 12 }, padding: 16 } }
            },
            cutout: '60%'
        }
    });

    // Sex bar chart
    const ctxSex = document.getElementById('chartSex').getContext('2d');
    reportCharts.sex = new Chart(ctxSex, {
        type: 'bar',
        data: {
            labels: ['Male', 'Female', 'Not Specified'],
            datasets: [{
                label: 'Presidents',
                data: [male, female, sexOther],
                backgroundColor: ['#1a2f5e', '#c9a84c', '#94a3b8'],
                borderRadius: 6,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'DM Sans' } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { ticks: { font: { family: 'DM Sans' } }, grid: { display: false } }
            }
        }
    });
}

// ════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ════════════════════════════════════════════════
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeDetailModal();
        if (!document.getElementById('reportPanel').classList.contains('hidden')) {
            document.getElementById('reportPanel').classList.add('hidden');
            document.body.style.overflow = '';
            Object.values(reportCharts).forEach(c => c.destroy());
            reportCharts = {};
        }
    }
});

// ════════════════════════════════════════════════
// SESSION RESTORE — skip login if already logged in
// ════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (sessionStorage.getItem('sacdev_adminLoggedIn') === '1') {
            goToPage('adminDashboard');
            initAdminDashboard();
        }
    } catch(e) {}
});
