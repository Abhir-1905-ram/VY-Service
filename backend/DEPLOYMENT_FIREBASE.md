# Firebase Deployment Guide

⚠️ **IMPORTANT**: Firebase uses Firestore (different from MongoDB). This requires significant code changes.

## Overview
- **Backend**: Firebase Cloud Functions
- **Database**: Cloud Firestore (NoSQL, similar to MongoDB)
- **Cost**: FREE tier, then pay-as-you-go (~$5-25/month)

## Prerequisites
- Firebase account (free)
- Node.js installed locally
- Firebase CLI installed

## Step 1: Setup Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
cd backend
firebase init functions

# Follow prompts:
# - Select existing project or create new
# - Language: JavaScript
# - ESLint: No (for simplicity)
# - Install dependencies: Yes
```

## Step 2: Install Dependencies

```bash
cd functions
npm install firebase-admin firebase-functions express cors
```

## Step 3: Code Structure Changes Required

You need to convert from MongoDB/Mongoose to Firestore. This is a significant refactor.

### 3.1 Update functions/index.js

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Routes (you'll need to rewrite these - see below)
const repairsRouter = require('./routes/repairs');
const authRouter = require('./routes/auth');
const employeesRouter = require('./routes/employees');
const attendanceRouter = require('./routes/attendance');

app.use('/api/repairs', repairsRouter);
app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/attendance', attendanceRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

exports.api = functions.https.onRequest(app);
```

### 3.2 Convert Models to Firestore

**Example: Repair Model Conversion**

**OLD (Mongoose - models/Repair.js):**
```javascript
const mongoose = require('mongoose');
const repairSchema = new mongoose.Schema({
  uniqueId: String,
  customerName: String,
  phoneNumbers: [String],
  // ... other fields
});
module.exports = mongoose.model('Repair', repairSchema);
```

**NEW (Firestore - functions/models/Repair.js):**
```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

class Repair {
  static collection() {
    return db.collection('repairs');
  }

  static async create(data) {
    const docRef = await this.collection().add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }

  static async findById(id) {
    const doc = await this.collection().doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findByUniqueId(uniqueId) {
    const snapshot = await this.collection()
      .where('uniqueId', '==', uniqueId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async findAll() {
    const snapshot = await this.collection().get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async update(id, data) {
    await this.collection().doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return this.findById(id);
  }

  static async delete(id) {
    await this.collection().doc(id).delete();
    return { success: true };
  }
}

module.exports = Repair;
```

### 3.3 Update Routes

**Example: repairs route (functions/routes/repairs.js):**

```javascript
const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');

// GET all repairs
router.get('/', async (req, res) => {
  try {
    const repairs = await Repair.findAll();
    res.json({ success: true, data: repairs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET repair by ID
router.get('/:id', async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      return res.status(404).json({ success: false, message: 'Repair not found' });
    }
    res.json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create repair
router.post('/', async (req, res) => {
  try {
    const repair = await Repair.create(req.body);
    res.status(201).json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update repair
router.put('/:id', async (req, res) => {
  try {
    const repair = await Repair.update(req.params.id, req.body);
    res.json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE repair
router.delete('/:id', async (req, res) => {
  try {
    await Repair.delete(req.params.id);
    res.json({ success: true, message: 'Repair deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

**You'll need to rewrite ALL routes similarly:**
- `routes/auth.js`
- `routes/employees.js`
- `routes/attendance.js`

### 3.4 Data Migration

You'll need to migrate existing MongoDB data to Firestore:

```javascript
// functions/scripts/migrate.js
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// This is a one-time script to migrate data
// You'll need to export from MongoDB and import to Firestore
```

Or use a migration tool like `mongoexport` and write a script to convert to Firestore format.

## Step 4: Deploy

```bash
cd backend
firebase deploy --only functions
```

After deployment, you'll get a URL like:
`https://us-central1-PROJECT_ID.cloudfunctions.net/api`

## Step 5: Update Mobile App

Edit `services/api.js`:
```javascript
const PRODUCTION_API_URL = 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api';
```

## Step 6: Configure Firestore Security Rules

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all (adjust based on your needs)
    match /{document=**} {
      allow read, write: if true;
    }
    
    // Better security (requires authentication):
    // match /repairs/{repairId} {
    //   allow read, write: if request.auth != null;
    // }
  }
}
```

## Cost Considerations

**FREE Tier (Spark Plan):**
- 2 million function invocations/month
- 50K Firestore reads/day
- 20K Firestore writes/day
- 10GB storage

**Blaze Plan (Pay-as-you-go):**
- Function invocations: $0.40 per million
- Firestore reads: $0.06 per 100K
- Firestore writes: $0.18 per 100K
- Storage: $0.18 per GB/month

**Estimated cost for moderate usage: $5-25/month**

## Why This is More Complex

1. **Different Database**: Firestore vs MongoDB (similar but different APIs)
2. **No ORM**: No Mongoose equivalent, must use Firestore SDK directly
3. **Different Query Syntax**: Firestore queries are different from MongoDB
4. **Data Migration**: Need to migrate all existing data
5. **Testing**: All routes need to be retested

## Recommendation

**If you want Firebase:**
- Consider it for a NEW project designed for Firebase
- Or if you need Firebase's real-time features
- Otherwise, AWS Lightsail is MUCH easier (no code changes)

## Alternative: Keep MongoDB, Use Firebase Functions

You CAN use Firebase Functions with MongoDB Atlas:
1. Use Firebase Functions (for hosting)
2. Keep MongoDB Atlas (for database)
3. Still use Mongoose in functions
4. Less code changes, but defeats the purpose of Firebase ecosystem

---

**Time Estimate**: 2-3 days of development to fully migrate to Firestore

