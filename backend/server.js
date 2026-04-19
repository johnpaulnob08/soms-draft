const express    = require('express');
const cors       = require('cors');
const admin      = require('firebase-admin');
const path       = require('path');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId:  serviceAccount.project_id
});

process.env.FIRESTORE_PREFER_REST = '1';

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// ── EMAIL TRANSPORTER ─────────────────────────────────────────────────────────
// Gmail SMTP — uses App Password (no OAuth needed)
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mardompaurysacdev@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || ''   // set via env var for security
  }
});

// ── STARTUP CONNECTIVITY CHECK ────────────────────────────────────────────────
// Runs once on server start. If this fails, all Firestore writes will fail too.
(async () => {
  try {
    await db.collection('_health').doc('ping').set({
      ok: true,
      ts: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Firestore connection verified — database is writable.');
  } catch (err) {
    console.error('❌ Firestore startup check FAILED:');
    console.error('   Code   :', err.code);
    console.error('   Message:', err.message);
    console.error('   Details:', JSON.stringify(err.details || err.metadata || ''));
    console.error('   Stack  :', err.stack?.split('\n')[1] || '');
    console.error('');
    console.error('   Possible causes:');
    console.error('   1. Cloud Firestore API not enabled →');
    console.error('      https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=' + serviceAccount.project_id);
    console.error('   2. Service account missing Firestore permissions →');
    console.error('      https://console.cloud.google.com/iam-admin/iam?project=' + serviceAccount.project_id);
    console.error('   3. Wrong project — key project_id:', serviceAccount.project_id);
  }
})();

app.use(express.static(path.join(__dirname, '../frontend')));


// ── FIREBASE CONNECTION TEST ──────────────────────────────────────────────────
app.get('/firebase-test', async (req, res) => {
  try {
    await db.collection('test').doc('connection').set({
      status: 'Firebase connected',
      timestamp: new Date()
    });
    res.json({ message: 'Firebase is working correctly' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── SUBMIT REGISTRATION ───────────────────────────────────────────────────────
app.post('/submit', async (req, res) => {
  try {
    const raw = req.body;

    // Firestore forbids field names starting with __.
    // Also strip base64 image data (data:image/...) and oversized strings —
    // files/photos are handled separately (Google Drive link, coming soon).
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        // Skip base64 image fields entirely
        if (typeof v === 'string' && v.startsWith('data:')) continue;
        // Skip fields whose key indicates a photo/signature/logo preview
        if (/img_|Photo|Signature|Logo|preview/i.test(k) && typeof v === 'string' && v.length > 500) continue;
        const safeKey = k.startsWith('__') ? k.slice(2) : k;
        if (Array.isArray(v)) {
          // Firestore does not support nested arrays.
          // Convert array-of-arrays to array-of-objects with indexed keys.
          const hasNestedArray = v.some(item => Array.isArray(item));
          if (hasNestedArray) {
            out[safeKey] = v.map((row, rowIdx) => {
              if (Array.isArray(row)) {
                const rowObj = {};
                row.forEach((cell, colIdx) => { rowObj['c' + colIdx] = cell ?? ''; });
                return rowObj;
              }
              return row;
            });
          } else {
            out[safeKey] = v;
          }
        } else {
          out[safeKey] = sanitize(v);
        }
      }
      return out;
    };

    const data = sanitize(raw);

    const docRef = await db.collection('submissions').add({
      ...data,
      status:    'pending',
      published: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Run conflict detection asynchronously (non-blocking)
    detectAndStoreConflicts(docRef.id, data).catch(e => console.error('Conflict detection failed:', e));

    res.json({ message: 'Submitted successfully', id: docRef.id });
  } catch (err) {
    console.error('Submit error:', err);
    const code    = err.code    || err.status || 'UNKNOWN';
    const message = err.message || 'Unknown server error';
    res.status(500).json({ error: `[${code}] ${message}` });
  }
});


// ── GET ALL SUBMISSIONS (admin) ───────────────────────────────────────────────
app.get('/submissions', async (req, res) => {
  try {
    const snapshot = await db.collection('submissions').get();

    const submissions = snapshot.docs
      .map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          _ts: d.createdAt?.toMillis?.() || 0,
          createdAt: d.createdAt?.toDate?.()?.toLocaleString('en-PH') || '—'
        };
      })
      .sort((a, b) => b._ts - a._ts)  // newest first, no Firestore index needed
      .map(({ _ts, ...rest }) => rest);

    res.json(submissions);
  } catch (err) {
    console.error('Fetch submissions error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ── UPDATE STATUS ─────────────────────────────────────────────────────────────
app.patch('/submissions/:id/status', async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
    }

    await db.collection('submissions').doc(id).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: `Status updated to '${status}'`, id });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ── PUBLISH STRATEGIC PLAN ────────────────────────────────────────────────────
// Sets published: true on a submission so its strategic plan becomes public.
app.patch('/submissions/:id/publish', async (req, res) => {
  try {
    const { id }        = req.params;
    const { published } = req.body;            // boolean — true to publish, false to unpublish

    const value = published !== false;          // default to true if omitted

    await db.collection('submissions').doc(id).update({
      published: value,
      publishedAt: value
        ? admin.firestore.FieldValue.serverTimestamp()
        : admin.firestore.FieldValue.delete()
    });

    res.json({ message: `Plans ${value ? 'published' : 'unpublished'} successfully`, id });
  } catch (err) {
    console.error('Publish error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ── GET PUBLISHED PLANS FOR ONE ORG (public) ──────────────────────────────────
// Returns the strategic plan tables for an org if published: true.
// :orgName is URL-encoded.
app.get('/org-plans/:orgName', async (req, res) => {
  try {
    const orgName = decodeURIComponent(req.params.orgName).trim();

    // Query by the 'org' field first (legacy), fall back to 'orgName' field
    let snapshot = await db.collection('submissions')
      .where('org', '==', orgName)
      .where('published', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // Try the newer 'orgName' field
      snapshot = await db.collection('submissions')
        .where('orgName', '==', orgName)
        .where('published', '==', true)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      return res.json({ published: false, plans: null });
    }

    const data = snapshot.docs[0].data();

    // Extract the three strategic plan tables from saved form data
    // They are stored as __table_bodyOrgDev, __table_bodyStudServ, __table_bodyCommInv
    // inside the strategicPlan form data object or at the top level.
    const sp = data.strategicPlan || data;   // support both flat and nested storage

    // Keys were sanitized on write: __table_* becomes table_*
    const orgDev   = sp['table_bodyOrgDev']   || data['table_bodyOrgDev']   || [];
    const studServ = sp['table_bodyStudServ']  || data['table_bodyStudServ'] || [];
    const commInv  = sp['table_bodyCommInv']   || data['table_bodyCommInv'] || [];

    // Column order from addRow() in script.js:
    // [0] Target Date, [1] Project Name, [2] Objectives, [3] Participants,
    // [4] Partners, [5] Deliverables, [6] Project Head, [7] Budget
    const parseRows = (rows) => {
      if (!Array.isArray(rows)) return [];
      return rows
        .map(r => {
          // Support both array format [date, name, ...] and object format {c0, c1, ...}
          const arr = Array.isArray(r) ? r : Object.keys(r).sort().map(k => r[k]);
          return {
            date:        arr[0] || '',
            projectName: arr[1] || '',
            objectives:  arr[2] || '',
            participants:arr[3] || '',
            partners:    arr[4] || '',
            deliverables:arr[5] || '',
            projectHead: arr[6] || '',
            budget:      arr[7] || ''
          };
        })
        .filter(r => r.projectName.trim());
    };

    res.json({
      published:    true,
      orgName:      data.org || data.orgName || orgName,
      cluster:      data.cluster || '',
      orgType:      data.orgType || data.council || '',
      acronym:      sp.stratAcronym || data.stratAcronym || '',
      mission:      sp.stratMission || data.stratMission || '',
      vision:       sp.stratVision  || data.stratVision  || '',
      publishedAt:  data.publishedAt?.toDate?.()?.toLocaleString('en-PH') || '',
      plans: {
        orgDev:   parseRows(orgDev),
        studServ: parseRows(studServ),
        commInv:  parseRows(commInv)
      }
    });
  } catch (err) {
    console.error('Fetch org plans error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ── GET SUBMISSION STATUS BY EMAIL (student-facing) ──────────────────────────
// Returns the status of the most recent submission for a given email.
app.get('/submission-status', async (req, res) => {
  try {
    const email = (req.query.email || '').trim();
    if (!email) return res.status(400).json({ error: 'email query parameter is required' });

    // Search by the user email field first, then by orgEmail
    let snapshot = await db.collection('submissions')
      .where('email', '==', email)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      snapshot = await db.collection('submissions')
        .where('orgEmail', '==', email)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
    }

    if (snapshot.empty) return res.json({ found: false });

    const doc  = snapshot.docs[0];
    const data = doc.data();

    res.json({
      found:       true,
      id:          doc.id,
      status:      data.status || 'pending',
      org:         data.org     || data.orgName || '—',
      orgName:     data.orgName || data.org     || '—',
      email:       data.email   || data.orgEmail || email,
      orgEmail:    data.orgEmail || '',
      submittedAt: data.submittedAt || data.createdAt?.toDate?.()?.toLocaleString('en-PH') || '—'
    });
  } catch (err) {
    console.error('Submission-status error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ── OFFICER CONFLICT DETECTION ────────────────────────────────────────────────
// Executive positions subject to conflict detection
const EXEC_POSITIONS = ['president','vice president','secretary','treasurer','auditor'];

function isExecPosition(position) {
  return EXEC_POSITIONS.some(ep => (position || '').toLowerCase().trim() === ep);
}

// Called automatically on /submit — scans all submissions for Student ID conflicts
// and writes conflict records to the 'conflicts' collection.
async function detectAndStoreConflicts(newSubmissionId, newSubmission) {
  try {
    const officers = newSubmission.officers || [];
    const execOfficers = officers.filter(o => isExecPosition(o.position) && o.studentId);

    if (execOfficers.length === 0) return;

    // Fetch all other approved/pending submissions
    const snapshot = await db.collection('submissions').get();
    const otherSubs = snapshot.docs
      .filter(doc => doc.id !== newSubmissionId)
      .map(doc => ({ id: doc.id, ...doc.data() }));

    for (const officer of execOfficers) {
      for (const other of otherSubs) {
        const otherOfficers = other.officers || [];
        const conflicts = otherOfficers.filter(oo =>
          isExecPosition(oo.position) &&
          oo.studentId &&
          oo.studentId.trim() === officer.studentId.trim()
        );

        for (const conflictingOfficer of conflicts) {
          // Check if this conflict already exists
          const existing = await db.collection('conflicts')
            .where('studentId', '==', officer.studentId.trim())
            .where('submissionId1', 'in', [newSubmissionId, other.id])
            .get();

          if (!existing.empty) continue; // already recorded

          await db.collection('conflicts').add({
            studentId:    officer.studentId.trim(),
            studentName:  officer.name || '',
            submissionId1: newSubmissionId,
            orgName1:      newSubmission.org || newSubmission.orgName || '—',
            orgEmail1:     newSubmission.orgEmail || '',
            position1:     officer.position,
            submissionId2: other.id,
            orgName2:      other.org || other.orgName || '—',
            orgEmail2:     other.orgEmail || '',
            position2:     conflictingOfficer.position,
            notified:      false,
            resolvedAt:    null,
            createdAt:     admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }
  } catch (err) {
    console.error('Conflict detection error:', err.message);
  }
}


// ── GET ALL CONFLICTS (admin) ─────────────────────────────────────────────────
app.get('/conflicts', async (req, res) => {
  try {
    const snapshot = await db.collection('conflicts').orderBy('createdAt', 'desc').get();
    const conflicts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toLocaleString('en-PH') || '—'
    }));
    res.json(conflicts);
  } catch (err) {
    console.error('Fetch conflicts error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ── NOTIFY ORGANIZATIONS ABOUT CONFLICT (admin-triggered) ────────────────────
app.post('/conflicts/:id/notify', async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('conflicts').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Conflict not found' });

    const c = doc.data();

    const subject = `[SACDEV SOMS] Officer Conflict Notice — ${c.studentName || c.studentId}`;
    const bodyHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#1a2f5e;padding:18px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:18px;">Officer Conflict Notice</h2>
          <p style="color:#c9a84c;margin:4px 0 0;font-size:13px;">OSA-SACDEV Student Organization Management System</p>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p style="color:#334155;margin-top:0;">This is to inform you that a <strong>student officer conflict</strong> has been detected in the submitted re-registration requirements.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
            <tr style="background:#f8fafc;">
              <th style="text-align:left;padding:8px 12px;border:1px solid #e2e8f0;color:#64748b;">Field</th>
              <th style="text-align:left;padding:8px 12px;border:1px solid #e2e8f0;color:#64748b;">Details</th>
            </tr>
            <tr>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">Student ID</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;">${c.studentId}</td>
            </tr>
            <tr style="background:#f8fafc;">
              <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">Student Name</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;">${c.studentName || '—'}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">Organization 1</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;">${c.orgName1} — <em>${c.position1}</em></td>
            </tr>
            <tr style="background:#f8fafc;">
              <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">Organization 2</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0;">${c.orgName2} — <em>${c.position2}</em></td>
            </tr>
          </table>
          <p style="color:#475569;font-size:13px;">Please coordinate with OSA-SACDEV to resolve this conflict at your earliest convenience.</p>
          <p style="color:#475569;font-size:13px;margin-bottom:0;">For inquiries, contact <a href="mailto:sacdev@xu.edu.ph" style="color:#1a2f5e;">sacdev@xu.edu.ph</a></p>
        </div>
        <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:12px;">OSA-SACDEV • Xavier University • Cagayan de Oro City</p>
      </div>
    `;

    const recipients = [c.orgEmail1, c.orgEmail2].filter(Boolean);
    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No valid email addresses found for involved organizations.' });
    }

    await mailer.sendMail({
      from:    '"OSA-SACDEV SOMS" <mardompaurysacdev@gmail.com>',
      to:      recipients.join(', '),
      subject: subject,
      html:    bodyHtml
    });

    // Mark conflict as notified
    await db.collection('conflicts').doc(id).update({
      notified:   true,
      notifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Notification sent successfully.', recipients });
  } catch (err) {
    console.error('Notify conflict error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ── FALLBACK SPA ROUTE ────────────────────────────────────────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('SACDEV is running!');
  console.log(`   Main site   → http://localhost:${PORT}`);
  console.log(`   Admin panel → http://localhost:${PORT}/admin.html`);
  console.log('');
});
