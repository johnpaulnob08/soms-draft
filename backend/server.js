const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
=======
// 🔥 FIREBASE SETUP
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

<<<<<<< HEAD
app.use(express.static(path.join(__dirname, '../frontend')));


=======
// ================= SERVE FRONTEND =================
app.use(express.static(path.join(__dirname, '../frontend')));

// ================= API ROUTES =================

// 🧪 FIREBASE TEST ROUTE
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
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

<<<<<<< HEAD
=======
// ✅ Submit data (from frontend form)
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
app.post('/submit', async (req, res) => {
  try {
    const data = req.body;

    const docRef = await db.collection('submissions').add({
      ...data,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Submitted successfully', id: docRef.id });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

<<<<<<< HEAD
=======
// ✅ Get all submissions (for admin)
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
app.get('/submissions', async (req, res) => {
  try {
    const snapshot = await db.collection('submissions')
      .orderBy('createdAt', 'desc')
      .get();

    const submissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toLocaleString('en-PH') || '—'
    }));

    res.json(submissions);
  } catch (err) {
    console.error('Fetch submissions error:', err);
    res.status(500).json({ error: err.message });
  }
});

<<<<<<< HEAD
=======
// ✅ Update submission status (approve / reject)
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
app.patch('/submissions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
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

<<<<<<< HEAD
=======
// ================= FALLBACK (SPA) =================
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

<<<<<<< HEAD
=======
// ================= START SERVER =================
>>>>>>> 672b405c980c9e4d0485b80f032a62fa95742f08
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 SACDEV is running!');
  console.log(`   Main site  → http://localhost:${PORT}`);
  console.log(`   Admin panel → http://localhost:${PORT}/admin.html`);
  console.log('');
});
