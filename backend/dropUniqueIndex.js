// Script to drop unique index on uniqueId field
// Run this once: node backend/dropUniqueIndex.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://abhiramsanka6:Abhiram%401905@cluster0.yuxegee.mongodb.net/vy-service?retryWrites=true&w=majority&appName=Cluster0';

async function dropUniqueIndex() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('repairs');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop unique index on uniqueId if it exists
    try {
      await collection.dropIndex('uniqueId_1');
      console.log('✅ Dropped unique index on uniqueId_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index uniqueId_1 does not exist (already removed)');
      } else {
        console.log('⚠️  Error dropping index:', error.message);
      }
    }

    // Verify indexes after drop
    const indexesAfter = await collection.indexes();
    console.log('Indexes after drop:', indexesAfter);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('✅ You can now save multiple entries with the same uniqueId');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropUniqueIndex();

