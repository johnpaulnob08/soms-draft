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
let allConflicts   = [];
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
    await loadAndRenderConflicts();
}

function renderStats() {
    const total    = allSubmissions.length;
    const approved = allSubmissions.filter(s => s.status === 'approved').length;
    const pending  = allSubmissions.filter(s => s.status === 'pending' || !s.status).length;

    animateCount('statTotal',     total);
    animateCount('statComplete',  approved);
    animateCount('statPending',   pending);
    animateCount('statConflicts', allConflicts.length);

    // Highlight conflict stat card if conflicts exist
    const conflictCard = document.getElementById('conflictStatCard');
    if (conflictCard) {
        conflictCard.classList.toggle('has-conflicts', allConflicts.length > 0);
    }
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

        // Check if this org has conflicts
        const hasConflict = allConflicts.some(c => c.submissionId1 === s.id || c.submissionId2 === s.id);

        tr.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            openDetailModal(s);
        });

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td class="org-name-cell">
                ${s.org || s.orgName || '—'}
                ${hasConflict ? `<span class="table-conflict-badge">⚠ Conflict Found</span>` : ''}
            </td>
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
                ${s.published ? `<button class="btn-inline-unpublish" onclick="event.stopPropagation(); togglePublish('${s.id}', false)" title="Unpublish Plans">🔴 Unpublish</button>` : ''}
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
                            const hasConflict = allConflicts.some(c => c.submissionId1 === sub.id || c.submissionId2 === sub.id);
                            return `<li class="cluster-org-item has-submission" onclick="openDetailModal(${JSON.stringify(sub).replace(/"/g, '&quot;')})">
                                <span class="org-sub-dot"></span>
                                <span style="flex:1;">${org}</span>
                                ${hasConflict ? `<span class="cluster-conflict-badge">⚠ Conflict</span>` : ''}
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

// ════════════════════════════════════════════════
// OFFICER CONFLICTS
// ════════════════════════════════════════════════

async function loadAndRenderConflicts() {
    const loadingEl  = document.getElementById('conflictsLoading');
    const noneEl     = document.getElementById('conflictsNone');
    const tableEl    = document.getElementById('conflictsTable');
    const tbody      = document.getElementById('conflictsTableBody');
    const badge      = document.getElementById('conflictCountBadge');

    if (loadingEl) loadingEl.style.display = 'block';
    if (noneEl)    noneEl.style.display    = 'none';
    if (tableEl)   tableEl.style.display   = 'none';

    try {
        const res = await fetch('/conflicts');
        if (!res.ok) throw new Error('Failed to fetch conflicts');
        allConflicts = await res.json();
    } catch (e) {
        console.error('Conflict fetch error:', e);
        allConflicts = [];
    }

    if (loadingEl) loadingEl.style.display = 'none';

    // Update stat card
    animateCount('statConflicts', allConflicts.length);
    const conflictCard = document.getElementById('conflictStatCard');
    if (conflictCard) conflictCard.classList.toggle('has-conflicts', allConflicts.length > 0);

    if (allConflicts.length === 0) {
        if (noneEl) noneEl.style.display = 'block';
        if (badge)  badge.style.display  = 'none';
        return;
    }

    // Update badge
    if (badge) {
        badge.textContent = allConflicts.length + ' conflict' + (allConflicts.length > 1 ? 's' : '');
        badge.style.display = 'inline-block';
    }

    tbody.innerHTML = '';
    allConflicts.forEach((c, i) => {
        const notified = c.notified === true;
        const tr = document.createElement('tr');
        tr.className = 'conflict-row';
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td><span class="conflict-id-chip">${c.studentId || '—'}</span></td>
            <td><strong>${c.studentName || '—'}</strong></td>
            <td>${c.orgName1 || '—'}</td>
            <td><span class="conflict-pos-badge">${c.position1 || '—'}</span></td>
            <td>${c.orgName2 || '—'}</td>
            <td><span class="conflict-pos-badge">${c.position2 || '—'}</span></td>
            <td style="white-space:nowrap;font-size:12px;color:#64748b;">${c.createdAt || '—'}</td>
            <td>
                ${notified
                    ? `<span class="conflict-notified-badge">✓ Notified</span>`
                    : `<button class="btn-notify-conflict" onclick="notifyConflict('${c.id}', this)">
                           📧 Notify Orgs
                       </button>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (tableEl) tableEl.style.display = '';
}

async function notifyConflict(conflictId, btnEl) {
    if (!confirm('Send email notification to both involved organizations about this officer conflict?')) return;

    if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = 'Sending…';
    }

    try {
        const res = await fetch(`/conflicts/${conflictId}/notify`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Server error');

        // Replace button with notified badge
        if (btnEl) {
            const span = document.createElement('span');
            span.className = 'conflict-notified-badge';
            span.textContent = '✓ Notified';
            btnEl.replaceWith(span);
        }
        alert('Email notifications sent successfully to the involved organizations.');
    } catch (e) {
        alert('Failed to send notification: ' + e.message);
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.textContent = '📧 Notify Orgs';
        }
    }
}

function openDetailModal(submission) {
    const s = typeof submission === 'string' ? JSON.parse(submission) : submission;
    const modal   = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');

    const orgName = s.org || s.orgName || '—';

    // N/A fallback: blank/missing → "N/A"
    const val = (v) => (v && v.toString().trim() && v !== '—')
        ? v
        : '<span style="color:#94a3b8;font-style:italic;">N/A</span>';

    // Compact helper: one label:value row
    const f = (label, v) =>
        `<div class="modal-field"><label>${label}</label><span>${val(v)}</span></div>`;

    // Render a strategic plan table section
    const renderPlanTable = (rows, title) => {
        if (!rows || rows.length === 0)
            return `<p style="font-size:13px;color:#94a3b8;font-style:italic;margin:4px 0 10px;">No entries for ${title}.</p>`;
        const rowsHtml = rows.map(r => {
            const arr = Array.isArray(r) ? r : Object.keys(r).sort().map(k => r[k]);
            const date    = arr[0] || '';
            const project = arr[1] || '';
            const obj     = arr[2] || '';
            const head    = arr[6] || '';
            return `<tr>
                <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:12px;white-space:nowrap;">${date || 'N/A'}</td>
                <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:12px;">
                    <strong>${project || 'N/A'}</strong>
                    ${obj ? `<br><span style="color:#64748b;font-size:11px;">${obj}</span>` : ''}
                </td>
                <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:12px;">${head || 'N/A'}</td>
            </tr>`;
        }).join('');
        return `
            <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.6px;
                text-transform:uppercase;margin:10px 0 4px;">${title}</div>
            <div style="overflow-x:auto;margin-bottom:10px;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <thead><tr>
                        <th style="padding:5px 8px;border:1px solid #e2e8f0;background:#f8fafc;
                            font-size:11px;text-align:left;white-space:nowrap;">Target Date</th>
                        <th style="padding:5px 8px;border:1px solid #e2e8f0;background:#f8fafc;
                            font-size:11px;text-align:left;">Project / Initiative</th>
                        <th style="padding:5px 8px;border:1px solid #e2e8f0;background:#f8fafc;
                            font-size:11px;text-align:left;">Project Head</th>
                    </tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>`;
    };

    const officerCount = s.officerCount || '—';
    const memberCount  = s.memberCount  || '—';
    const hasConst = s.constitutionFileName &&
        s.constitutionFileName !== 'Click to upload constitution (PDF)' &&
        s.constitutionFileName.trim() !== '';

    content.innerHTML = `
        <div class="modal-header">
            <div class="modal-header-badge">Org Re-Registration 2026–2027</div>
            <div class="modal-org-name">${orgName}</div>
            <div class="modal-org-meta">
                <span class="modal-meta-item">🏛️ <strong>${val(s.council || s.orgType)}</strong></span>
                <span class="modal-meta-item">📁 <strong>${val(s.cluster)}</strong></span>
                <span class="modal-meta-item">📅 <strong>${val(s.createdAt || s.submittedAt)}</strong></span>
            </div>
        </div>
        <div class="modal-body">

            <!-- ── Organization Information ──────────────────── -->
            <div class="modal-section">
                <div class="modal-section-title">Organization Information</div>
                <div class="modal-grid-2">
                    ${f('Organization Name', orgName)}
                    ${f('Type of Organization', s.orgType || s.council)}
                    ${f('Org Cluster', s.cluster)}
                    ${f('Year Established', s.yearEstablished)}
                    ${f('Organization Email', s.orgEmail)}
                    ${f('User (Submitter) Email', s.email)}
                </div>
            </div>

            <!-- ── Strategic Plan (B-1) ───────────────────────── -->
            <div class="modal-section">
                <div class="modal-section-title">Strategic Plan — Form B-1</div>
                <div class="modal-grid-2" style="margin-bottom:14px;">
                    ${f('Org Acronym', s.stratAcronym)}
                    ${f('Complete Organization Name', s.stratOrgFullName)}
                </div>
                <div style="margin-bottom:10px;">
                    <div class="modal-field" style="margin-bottom:8px;">
                        <label>Mission Statement</label>
                        <span style="white-space:pre-wrap;">${val(s.stratMission)}</span>
                    </div>
                    <div class="modal-field">
                        <label>Vision Statement</label>
                        <span style="white-space:pre-wrap;">${val(s.stratVision)}</span>
                    </div>
                </div>
                ${renderPlanTable(s.table_bodyOrgDev   || s['table_bodyOrgDev'],   'Organizational Development')}
                ${renderPlanTable(s.table_bodyStudServ  || s['table_bodyStudServ'], 'Student Services')}
                ${renderPlanTable(s.table_bodyCommInv   || s['table_bodyCommInv'],  'Community Involvement')}
            </div>

            <!-- ── President's Profile (B-2) ─────────────────── -->
            <div class="modal-section">
                <div class="modal-section-title">President's Profile — Form B-2</div>
                <div class="modal-grid-2">
                    ${f('Full Name', s.presFullName || s.president)}
                    ${f('Course and Year', s.presCourseYear)}
                    ${f('Birthday', s.presBirthday)}
                    ${f('Age', s.presAge)}
                    ${f('Sex', s.presSex)}
                    ${f('Religion', s.presReligion)}
                    ${f('Mobile Number', s.presMobile || s.presidentMobile)}
                    ${f('City Landline', s.presLandlineCity)}
                    ${f('Email Address', s.presEmail || s.presidentEmail)}
                    ${f('ID Number', s.presIdNumber)}
                    ${f('Provincial Landline', s.presLandlineProv)}
                    ${f('Facebook Account', s.presFacebook)}
                </div>
                <div class="modal-grid-2" style="margin-top:8px;">
                    ${f('Complete Home Address', s.presHomeAddress)}
                    ${f('Complete City Address', s.presCityAddress)}
                </div>
                <div style="margin-top:12px;font-size:11px;font-weight:700;color:#64748b;
                    letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px;">Family Background</div>
                <div class="modal-grid-2">
                    ${f("Father's Name", s.presFatherName)}
                    ${f("Father's Occupation", s.presFatherOcc)}
                    ${f("Father's Mobile", s.presFatherMobile)}
                    ${f("Mother's Name", s.presMotherName)}
                    ${f("Mother's Occupation", s.presMotherOcc)}
                    ${f("Mother's Mobile", s.presMotherMobile)}
                    ${f("Guardian's Name", s.presGuardianName)}
                    ${f("Guardian's Relationship", s.presGuardianRel)}
                    ${f("Guardian's Mobile", s.presGuardianMobile)}
                    ${f('Number of Siblings', s.presSiblings)}
                </div>
                <div style="margin-top:12px;font-size:11px;font-weight:700;color:#64748b;
                    letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px;">Educational Background</div>
                <div class="modal-grid-2">
                    ${f('High School Name', s.presHsName)}
                    ${f('High School Address', s.presHsAddress)}
                    ${f('High School Year Graduated', s.presHsGrad)}
                    ${f('Grade School Name', s.presGsName)}
                    ${f('Grade School Address', s.presGsAddress)}
                    ${f('Grade School Year Graduated', s.presGsGrad)}
                    ${f('Scholarship', s.presScholarship)}
                    ${f('Scholarship Year Granted', s.presScholarshipYr)}
                </div>
                <div style="margin-top:8px;">
                    <div class="modal-field">
                        <label>Skills, Hobbies and Interests</label>
                        <span style="white-space:pre-wrap;">${val(s.presSkills)}</span>
                    </div>
                </div>
            </div>

            <!-- ── Officers (B-3) ────────────────────────────── -->
            <div class="modal-section">
                <div class="modal-section-title">Officers — Form B-3</div>
                ${(() => {
                    const officers = s.officers || [];
                    if (officers.length === 0) {
                        return `<div class="modal-grid-2">${f('Officers Listed', officerCount !== '—' ? `${officerCount} officer(s)` : null)}</div>`;
                    }
                    // Find conflicts involving this submission
                    const conflictsForOrg = allConflicts.filter(c =>
                        c.submissionId1 === s.id || c.submissionId2 === s.id
                    );
                    const conflictStudentIds = new Set(conflictsForOrg.map(c => c.studentId));
                    const EXEC = ['president','vice president','secretary','treasurer','auditor'];

                    const rows = officers.map(o => {
                        const isConflict = o.studentId && conflictStudentIds.has(o.studentId.trim());
                        const isExec = EXEC.includes((o.position || '').toLowerCase().trim());
                        return `<tr style="${isConflict ? 'background:#fef2f2;' : ''}">
                            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">
                                ${isExec ? `<span style="display:inline-block;background:#1a2f5e;color:#fff;font-size:10px;padding:1px 7px;border-radius:4px;margin-right:4px;">${o.position}</span>` : o.position || '—'}
                            </td>
                            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">
                                <span style="background:#eff6ff;color:#1d4ed8;font-size:11px;padding:2px 8px;border-radius:5px;font-weight:600;">${o.studentId || '—'}</span>
                                ${isConflict ? `<span style="display:inline-block;background:#dc2626;color:#fff;font-size:10px;padding:1px 7px;border-radius:4px;margin-left:4px;font-weight:700;">⚠ Conflict Found</span>` : ''}
                            </td>
                            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;"><strong>${o.name || '—'}</strong></td>
                            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">${o.course || '—'}</td>
                            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">${o.qpi1 || '—'}</td>
                            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">${o.qpi2 || '—'}</td>
                            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">${o.qpiInt || '—'}</td>
                            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">${o.mobile || '—'}</td>
                        </tr>`;
                    }).join('');

                    return `
                        <div style="overflow-x:auto;margin-bottom:8px;">
                            <table style="width:100%;border-collapse:collapse;font-size:12px;">
                                <thead><tr>
                                    <th style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;text-align:left;">Position</th>
                                    <th style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;text-align:left;">Student ID</th>
                                    <th style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;text-align:left;">Name</th>
                                    <th style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;text-align:left;">Course &amp; Year</th>
                                    <th style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;text-align:left;">Sem 1</th>
                                    <th style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;text-align:left;">Sem 2</th>
                                    <th style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;text-align:left;">Int.</th>
                                    <th style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;text-align:left;">Mobile</th>
                                </tr></thead>
                                <tbody>${rows}</tbody>
                            </table>
                        </div>
                        ${conflictsForOrg.length > 0 ? `
                            <div style="margin-top:10px;">
                                <div style="font-size:11px;font-weight:700;color:#dc2626;letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px;">⚠ Conflict Details</div>
                                ${conflictsForOrg.map(c => {
                                    const notified = c.notified === true;
                                    return `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-bottom:8px;font-size:12px;">
                                        <strong>${c.studentName || c.studentId}</strong> (ID: ${c.studentId}) holds
                                        <em>${c.position1}</em> in <strong>${c.orgName1}</strong> and
                                        <em>${c.position2}</em> in <strong>${c.orgName2}</strong>.
                                        <span style="margin-left:8px;">${notified
                                            ? `<span style="color:#16a34a;font-weight:600;">✓ Organizations notified</span>`
                                            : `<button onclick="notifyConflict('${c.id}', this)" style="background:#dc2626;color:#fff;border:none;border-radius:5px;padding:3px 10px;font-size:11px;cursor:pointer;font-weight:600;">📧 Notify Orgs</button>`
                                        }</span>
                                    </div>`;
                                }).join('')}
                            </div>` : ''}
                    `;
                })()}
            </div>

            <!-- ── Members (B-4) ─────────────────────────────── -->
            <div class="modal-section">
                <div class="modal-section-title">Members — Form B-4</div>
                <div class="modal-grid-2">
                    ${f('Members Listed', memberCount !== '—' ? `${memberCount} member(s)` : null)}
                    ${f('Applicable', (s.orgType || '').toLowerCase() === 'extra-curricular' ? 'Yes (Extra-Curricular)' : 'Not required for this org type')}
                </div>
            </div>

            <!-- ── Moderator's Profile (B-5.1) ───────────────── -->
            <div class="modal-section">
                <div class="modal-section-title">Moderator's Profile — Form B-5.1</div>
                <div class="modal-grid-2">
                    ${f('Full Name', s.modFullName || s.moderatorName)}
                    ${f('Nominating Organization', s.modNominatingOrg)}
                    ${f('Birthday', s.modBirthday)}
                    ${f('Age', s.modAge)}
                    ${f('Sex', s.modSex)}
                    ${f('Religion', s.modReligion)}
                    ${f('Official Designation', s.modDesignation)}
                    ${f('Unit / College / Department', s.modDepartment)}
                    ${f('Status', s.modStatus)}
                    ${f('Years of Service', s.modYearsService)}
                    ${f('Mobile Number', s.modMobile)}
                    ${f('Email Address', s.modEmail)}
                    ${f('Landline', s.modLandline)}
                    ${f('Facebook Account', s.modFacebook)}
                    ${f('Complete City Address', s.modCityAddress)}
                    ${f('Was Moderator Before?', s.modWasModBefore)}
                    ${f('Previous Org as Moderator', s.modPrevOrgName)}
                    ${f('Is Mod of Nominating Org?', s.modIsModOfNom)}
                    ${f('Years as Mod of Nominating Org', s.modYearsAsModNom)}
                </div>
                <div style="margin-top:8px;">
                    <div class="modal-field">
                        <label>Special Skills / Interests</label>
                        <span style="white-space:pre-wrap;">${val(s.modSpecialSkills)}</span>
                    </div>
                </div>
            </div>

            <!-- ── Documents ─────────────────────────────────── -->
            <div class="modal-section">
                <div class="modal-section-title">Documents</div>
                <div class="modal-grid-2">
                    ${f('Organization Constitution', hasConst ? '✓ ' + s.constitutionFileName : null)}
                    ${f('Organization Logo / Seal', s.orgLogoData ? '✓ Uploaded' : null)}
                </div>
            </div>

            <!-- ── Status & Actions ──────────────────────────── -->
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
    Object.values(reportCharts).forEach(c => c.destroy());
    reportCharts = {};
}

function buildReport() {
    const content = document.getElementById('reportContent');
    const total    = allSubmissions.length;
    const approved = allSubmissions.filter(s => s.status === 'approved').length;
    const pending  = allSubmissions.filter(s => s.status === 'pending' || !s.status).length;
    const rejected = allSubmissions.filter(s => s.status === 'rejected').length;

    const submittedNames = new Set(
        allSubmissions.map(s => (s.org || s.orgName || '').trim()).filter(Boolean)
    );

    const allKnownOrgs = [...new Set(Object.values(CLUSTERS).flat())].sort();
    const notSubmitted = allKnownOrgs.filter(o => !submittedNames.has(o));

    const clusterCounts = {};
    Object.keys(CLUSTERS).sort().forEach(c => { clusterCounts[c] = 0; });
    allSubmissions.forEach(s => {
        const c = s.cluster;
        if (c && clusterCounts.hasOwnProperty(c)) clusterCounts[c]++;
    });
    const maxCluster = Math.max(1, ...Object.values(clusterCounts));

    const male   = allSubmissions.filter(s => (s.presSex || s.presidentSex || '').toLowerCase() === 'male').length;
    const female = allSubmissions.filter(s => (s.presSex || s.presidentSex || '').toLowerCase() === 'female').length;
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

    Object.values(reportCharts).forEach(c => c.destroy());
    reportCharts = {};

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


document.addEventListener('DOMContentLoaded', () => {
    try {
        if (sessionStorage.getItem('sacdev_adminLoggedIn') === '1') {
            goToPage('adminDashboard');
            initAdminDashboard();
        }
    } catch(e) {}
});
