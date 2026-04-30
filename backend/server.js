const express    = require('express');
const cors       = require('cors');
const admin      = require('firebase-admin');
const path       = require('path');
const nodemailer = require('nodemailer');
const fs         = require('fs');

// Load .env manually (no dotenv dependency needed)
try {
  const envPath = path.join(__dirname, '..', '.env');
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  });
} catch (e) {
  // .env not found — rely on environment variables set by the host/Docker
}

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


const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mardompaurysacdev@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || '' 
  }
});


(async () => {
  try {
    await db.collection('_health').doc('ping').set({
      ok: true,
      ts: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Firestore connection verified — database is writable.');
  } catch (err) {
    console.error('Firestore startup check FAILED:');
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


app.post('/submit', async (req, res) => {
  try {
    const raw = req.body;

    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string' && v.startsWith('data:')) continue;
        if (/img_|Photo|Signature|Logo|preview/i.test(k) && typeof v === 'string' && v.length > 500) continue;
        const safeKey = k.startsWith('__') ? k.slice(2) : k;
        if (Array.isArray(v)) {

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

    detectAndStoreConflicts(docRef.id, data).catch(e => console.error('Conflict detection failed:', e));

    // Send submission confirmation email to the organization's registered email
    try {
      const toEmail = data.orgEmail || '';
      const orgName = data.org || data.orgName || 'Your Organization';

      if (toEmail) {
        const confirmHtml = `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <div style="background:#1a2f5e;padding:18px 24px;border-radius:8px 8px 0 0;">
              <h2 style="color:#fff;margin:0;font-size:18px;">Submission Received</h2>
              <p style="color:#c9a84c;margin:4px 0 0;font-size:13px;">OSA-SACDEV Student Organization Management System</p>
            </div>
            <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
              <p style="color:#334155;margin-top:0;">Dear <strong>${orgName}</strong>,</p>
              <p style="color:#334155;">We have successfully received your re-registration requirements for Academic Year 2026–2027. Your submission is now being reviewed by OSA-SACDEV.</p>
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;margin:18px 0;">
                <p style="margin:0;color:#1d4ed8;font-weight:600;font-size:14px;">⏳ Status: Under Review</p>
                <p style="margin:6px 0 0;color:#1e40af;font-size:13px;">Organization: ${orgName}</p>
                <p style="margin:4px 0 0;color:#1e40af;font-size:13px;">Submitted: ${new Date().toLocaleString('en-PH')}</p>
              </div>
              <p style="color:#475569;font-size:13px;">You will receive another email once your submission has been evaluated. Please ensure all submitted documents are complete and accurate.</p>
              <p style="color:#475569;font-size:13px;margin-bottom:0;">For inquiries, contact <a href="mailto:sacdev@xu.edu.ph" style="color:#1a2f5e;">sacdev@xu.edu.ph</a></p>
            </div>
            <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:12px;">OSA-SACDEV • Xavier University • Cagayan de Oro City</p>
          </div>
        `;

        await mailer.sendMail({
          from:    '"OSA-SACDEV SOMS" <mardompaurysacdev@gmail.com>',
          to:      toEmail,
          subject: `[SACDEV SOMS] Submission Received — ${orgName}`,
          html:    confirmHtml
        });
      }
    } catch (mailErr) {
      console.error('Submission confirmation email error:', mailErr.message);
    }

    res.json({ message: 'Submitted successfully', id: docRef.id });
  } catch (err) {
    console.error('Submit error:', err);
    const code    = err.code    || err.status || 'UNKNOWN';
    const message = err.message || 'Unknown server error';
    res.status(500).json({ error: `[${code}] ${message}` });
  }
});


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
      .sort((a, b) => b._ts - a._ts)  
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

    const { reason } = req.body;

    const allowed = ['pending', 'approved', 'rejected', 'revision'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
    }

    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (status === 'rejected' && reason)  updateData.rejectionReason = reason;
    if (status === 'revision' && reason)  updateData.revisionNotes   = reason;

    await db.collection('submissions').doc(id).update(updateData);

    // Send approval email notification to the organization's registered email
    if (status === 'approved') {
      try {
        const subDoc = await db.collection('submissions').doc(id).get();
        const sub    = subDoc.data() || {};
        const toEmail = sub.orgEmail || '';
        const orgName = sub.org || sub.orgName || 'Your Organization';

        if (toEmail) {
          const approvalHtml = `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
              <div style="background:#1a2f5e;padding:18px 24px;border-radius:8px 8px 0 0;">
                <h2 style="color:#fff;margin:0;font-size:18px;">Re-Registration Approved</h2>
                <p style="color:#c9a84c;margin:4px 0 0;font-size:13px;">OSA-SACDEV Student Organization Management System</p>
              </div>
              <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
                <p style="color:#334155;margin-top:0;">Dear <strong>${orgName}</strong>,</p>
                <p style="color:#334155;">We are pleased to inform you that your organization's re-registration requirements for Academic Year 2026–2027 have been <strong style="color:#16a34a;">reviewed and approved</strong> by OSA-SACDEV.</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin:18px 0;">
                  <p style="margin:0;color:#15803d;font-weight:600;font-size:14px;">✓ Status: Approved</p>
                  <p style="margin:6px 0 0;color:#166534;font-size:13px;">Organization: ${orgName}</p>
                </div>
                <p style="color:#475569;font-size:13px;">Your organization is now officially recognized for the current academic year. Should you have any questions or concerns, please do not hesitate to reach out to us.</p>
                <p style="color:#475569;font-size:13px;margin-bottom:0;">For inquiries, contact <a href="mailto:sacdev@xu.edu.ph" style="color:#1a2f5e;">sacdev@xu.edu.ph</a></p>
              </div>
              <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:12px;">OSA-SACDEV • Xavier University • Cagayan de Oro City</p>
            </div>
          `;

          await mailer.sendMail({
            from:    '"OSA-SACDEV SOMS" <mardompaurysacdev@gmail.com>',
            to:      toEmail,
            subject: `[SACDEV SOMS] Re-Registration Approved — ${orgName}`,
            html:    approvalHtml
          });
        }
      } catch (mailErr) {
        // Log but don't fail the status update if email sending fails
        console.error('Approval email error:', mailErr.message);
      }
    }

    // Send rejection email notification
    if (status === 'rejected') {
      try {
        const subDoc = await db.collection('submissions').doc(id).get();
        const sub    = subDoc.data() || {};
        const toEmail = sub.orgEmail || '';
        const orgName = sub.org || sub.orgName || 'Your Organization';

        if (toEmail) {
          const reasonBlock = reason
            ? `<div style="background:#fef2f2;border-left:3px solid #dc2626;padding:10px 14px;margin:14px 0;border-radius:0 6px 6px 0;">
                <p style="margin:0;font-size:12px;font-weight:600;color:#991b1b;">Reason provided by OSA-SACDEV:</p>
                <p style="margin:6px 0 0;font-size:13px;color:#7f1d1d;white-space:pre-wrap;">${reason}</p>
               </div>`
            : '';

          const rejectionHtml = `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
              <div style="background:#1a2f5e;padding:18px 24px;border-radius:8px 8px 0 0;">
                <h2 style="color:#fff;margin:0;font-size:18px;">Re-Registration Not Approved</h2>
                <p style="color:#c9a84c;margin:4px 0 0;font-size:13px;">OSA-SACDEV Student Organization Management System</p>
              </div>
              <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
                <p style="color:#334155;margin-top:0;">Dear <strong>${orgName}</strong>,</p>
                <p style="color:#334155;">After careful review, we regret to inform you that your organization's re-registration requirements for Academic Year 2026–2027 have <strong style="color:#dc2626;">not been approved</strong> by OSA-SACDEV.</p>
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin:18px 0;">
                  <p style="margin:0;color:#dc2626;font-weight:600;font-size:14px;">✕ Status: Not Approved</p>
                  <p style="margin:6px 0 0;color:#991b1b;font-size:13px;">Organization: ${orgName}</p>
                </div>
                ${reasonBlock}
                <p style="color:#475569;font-size:13px;">Please contact OSA-SACDEV directly for further details regarding this decision and any next steps that may be available to your organization.</p>
                <p style="color:#475569;font-size:13px;margin-bottom:0;">For inquiries, contact <a href="mailto:sacdev@xu.edu.ph" style="color:#1a2f5e;">sacdev@xu.edu.ph</a></p>
              </div>
              <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:12px;">OSA-SACDEV • Xavier University • Cagayan de Oro City</p>
            </div>
          `;

          await mailer.sendMail({
            from:    '"OSA-SACDEV SOMS" <mardompaurysacdev@gmail.com>',
            to:      toEmail,
            subject: `[SACDEV SOMS] Re-Registration Not Approved — ${orgName}`,
            html:    rejectionHtml
          });
        }
      } catch (mailErr) {
        console.error('Rejection email error:', mailErr.message);
      }
    }

    // Send revision request email notification
    if (status === 'revision') {
      try {
        const subDoc = await db.collection('submissions').doc(id).get();
        const sub    = subDoc.data() || {};
        const toEmail = sub.orgEmail || '';
        const orgName = sub.org || sub.orgName || 'Your Organization';

        if (toEmail) {
          const notesBlock = reason
            ? `<div style="background:#fffbeb;border-left:3px solid #d97706;padding:10px 14px;margin:14px 0;border-radius:0 6px 6px 0;">
                <p style="margin:0;font-size:12px;font-weight:600;color:#92400e;">Required revisions from OSA-SACDEV:</p>
                <p style="margin:6px 0 0;font-size:13px;color:#78350f;white-space:pre-wrap;">${reason}</p>
               </div>`
            : '';

          const revisionHtml = `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
              <div style="background:#1a2f5e;padding:18px 24px;border-radius:8px 8px 0 0;">
                <h2 style="color:#fff;margin:0;font-size:18px;">Revision Required</h2>
                <p style="color:#c9a84c;margin:4px 0 0;font-size:13px;">OSA-SACDEV Student Organization Management System</p>
              </div>
              <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
                <p style="color:#334155;margin-top:0;">Dear <strong>${orgName}</strong>,</p>
                <p style="color:#334155;">Your organization's re-registration requirements for Academic Year 2026–2027 have been reviewed and require <strong style="color:#d97706;">revisions</strong> before they can be approved by OSA-SACDEV.</p>
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin:18px 0;">
                  <p style="margin:0;color:#d97706;font-weight:600;font-size:14px;">↩ Status: For Revision</p>
                  <p style="margin:6px 0 0;color:#92400e;font-size:13px;">Organization: ${orgName}</p>
                </div>
                ${notesBlock}
                <p style="color:#475569;font-size:13px;">Please address the required revisions and coordinate with OSA-SACDEV at your earliest convenience.</p>
                <p style="color:#475569;font-size:13px;margin-bottom:0;">For inquiries, contact <a href="mailto:sacdev@xu.edu.ph" style="color:#1a2f5e;">sacdev@xu.edu.ph</a></p>
              </div>
              <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:12px;">OSA-SACDEV • Xavier University • Cagayan de Oro City</p>
            </div>
          `;

          await mailer.sendMail({
            from:    '"OSA-SACDEV SOMS" <mardompaurysacdev@gmail.com>',
            to:      toEmail,
            subject: `[SACDEV SOMS] Revision Required — ${orgName}`,
            html:    revisionHtml
          });
        }
      } catch (mailErr) {
        console.error('Revision email error:', mailErr.message);
      }
    }

    // Send pending email notification (when admin resets status back to pending)
    if (status === 'pending') {
      try {
        const subDoc = await db.collection('submissions').doc(id).get();
        const sub    = subDoc.data() || {};
        const toEmail = sub.orgEmail || '';
        const orgName = sub.org || sub.orgName || 'Your Organization';
        const prevStatus = sub.status || '';

        // Only send if it was previously approved or rejected (not on initial submission)
        if (toEmail && (prevStatus === 'approved' || prevStatus === 'rejected')) {
          const pendingHtml = `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
              <div style="background:#1a2f5e;padding:18px 24px;border-radius:8px 8px 0 0;">
                <h2 style="color:#fff;margin:0;font-size:18px;">Submission Status Update</h2>
                <p style="color:#c9a84c;margin:4px 0 0;font-size:13px;">OSA-SACDEV Student Organization Management System</p>
              </div>
              <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
                <p style="color:#334155;margin-top:0;">Dear <strong>${orgName}</strong>,</p>
                <p style="color:#334155;">This is to inform you that your organization's re-registration submission for Academic Year 2026–2027 has been placed <strong style="color:#d97706;">back under review</strong> by OSA-SACDEV.</p>
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin:18px 0;">
                  <p style="margin:0;color:#d97706;font-weight:600;font-size:14px;">⏳ Status: Under Review</p>
                  <p style="margin:6px 0 0;color:#92400e;font-size:13px;">Organization: ${orgName}</p>
                </div>
                <p style="color:#475569;font-size:13px;">No action is required from your end at this time. You will be notified once a final decision has been made. If you have any questions, please reach out to us.</p>
                <p style="color:#475569;font-size:13px;margin-bottom:0;">For inquiries, contact <a href="mailto:sacdev@xu.edu.ph" style="color:#1a2f5e;">sacdev@xu.edu.ph</a></p>
              </div>
              <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:12px;">OSA-SACDEV • Xavier University • Cagayan de Oro City</p>
            </div>
          `;

          await mailer.sendMail({
            from:    '"OSA-SACDEV SOMS" <mardompaurysacdev@gmail.com>',
            to:      toEmail,
            subject: `[SACDEV SOMS] Submission Under Review — ${orgName}`,
            html:    pendingHtml
          });
        }
      } catch (mailErr) {
        console.error('Pending email error:', mailErr.message);
      }
    }

    res.json({ message: `Status updated to '${status}'`, id });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: err.message });
  }
});


app.patch('/submissions/:id/publish', async (req, res) => {
  try {
    const { id }        = req.params;
    const { published } = req.body;            

    const value = published !== false;          

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


app.get('/org-plans/:orgName', async (req, res) => {
  try {
    const orgName = decodeURIComponent(req.params.orgName).trim();

    let snapshot = await db.collection('submissions')
      .where('org', '==', orgName)
      .where('published', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
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


    const sp = data.strategicPlan || data;   

    const orgDev   = sp['table_bodyOrgDev']   || data['table_bodyOrgDev']   || [];
    const studServ = sp['table_bodyStudServ']  || data['table_bodyStudServ'] || [];
    const commInv  = sp['table_bodyCommInv']   || data['table_bodyCommInv'] || [];


    const parseRows = (rows) => {
      if (!Array.isArray(rows)) return [];
      return rows
        .map(r => {
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



app.get('/submission-status', async (req, res) => {
  try {
    const email = (req.query.email || '').trim();
    if (!email) return res.status(400).json({ error: 'email query parameter is required' });

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



const EXEC_POSITIONS = ['president','vice president','secretary','treasurer','auditor'];

function isExecPosition(position) {
  return EXEC_POSITIONS.some(ep => (position || '').toLowerCase().trim() === ep);
}


async function detectAndStoreConflicts(newSubmissionId, newSubmission) {
  try {
    const officers = newSubmission.officers || [];
    const execOfficers = officers.filter(o => isExecPosition(o.position) && o.studentId);

    if (execOfficers.length === 0) return;

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
          const existing = await db.collection('conflicts')
            .where('studentId', '==', officer.studentId.trim())
            .where('submissionId1', 'in', [newSubmissionId, other.id])
            .get();

          if (!existing.empty) continue;

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

    // Send email notification to both organizations involved in the conflict (subject to changes kay di mugana)
    await mailer.sendMail({
      from:    '"OSA-SACDEV SOMS" <mardompaurysacdev@gmail.com>',
      to:      recipients.join(', '),
      subject: subject,
      html:    bodyHtml
    });

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


// ── INTERNAL NOTES ────────────────────────────────────────────────────────────
app.post('/submissions/:id/notes', async (req, res) => {
  try {
    const { id }   = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Note text is required.' });

    const noteRef = await db.collection('submissions').doc(id)
      .collection('notes').add({
        text:      text.trim(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ message: 'Note saved.', id: noteRef.id });
  } catch (err) {
    console.error('Save note error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/submissions/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.collection('submissions').doc(id)
      .collection('notes').orderBy('createdAt', 'asc').get();

    const notes = snapshot.docs.map(doc => ({
      id:        doc.id,
      text:      doc.data().text,
      createdAt: doc.data().createdAt?.toDate?.()?.toLocaleString('en-PH') || '—'
    }));

    res.json(notes);
  } catch (err) {
    console.error('Fetch notes error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ── RESOLVE CONFLICT ──────────────────────────────────────────────────────────
app.post('/conflicts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('conflicts').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Conflict not found' });

    await db.collection('conflicts').doc(id).update({
      resolved:   true,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Conflict marked as resolved.', id });
  } catch (err) {
    console.error('Resolve conflict error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ── RESCAN ALL CONFLICTS ───────────────────────────────────────────────────────
app.post('/rescan-conflicts', async (req, res) => {
  try {
    const snapshot = await db.collection('submissions').get();
    const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let newCount = 0;

    for (let i = 0; i < subs.length; i++) {
      const a = subs[i];
      const execA = (a.officers || []).filter(o => isExecPosition(o.position) && o.studentId);
      if (!execA.length) continue;

      for (let j = i + 1; j < subs.length; j++) {
        const b = subs[j];
        const execB = (b.officers || []).filter(o => isExecPosition(o.position) && o.studentId);
        if (!execB.length) continue;

        for (const oa of execA) {
          for (const ob of execB) {
            if (oa.studentId.trim() !== ob.studentId.trim()) continue;

            // Check if this conflict already exists
            const existing = await db.collection('conflicts')
              .where('studentId', '==', oa.studentId.trim())
              .where('submissionId1', 'in', [a.id, b.id])
              .get();

            if (!existing.empty) continue;

            await db.collection('conflicts').add({
              studentId:     oa.studentId.trim(),
              studentName:   oa.name || '',
              submissionId1: a.id,
              orgName1:      a.org || a.orgName || '—',
              orgEmail1:     a.orgEmail || '',
              position1:     oa.position,
              submissionId2: b.id,
              orgName2:      b.org || b.orgName || '—',
              orgEmail2:     b.orgEmail || '',
              position2:     ob.position,
              notified:      false,
              resolved:      false,
              resolvedAt:    null,
              createdAt:     admin.firestore.FieldValue.serverTimestamp()
            });
            newCount++;
          }
        }
      }
    }

    res.json({ message: `Rescan complete. ${newCount} new conflict(s) found.`, newCount });
  } catch (err) {
    console.error('Rescan conflicts error:', err);
    res.status(500).json({ error: err.message });
  }
});


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
