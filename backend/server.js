const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - Enhanced CORS configuration
app.use(cors({
  origin: '*', // Allow all origins (for mobile app)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json());

// MongoDB Connection
// Using MongoDB Atlas - update .env file or use the connection string below
// Note: Password with @ symbol needs to be URL encoded as %40
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://abhiramsanka6:Abhiram%401905@cluster0.yuxegee.mongodb.net/vy-service?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB_NAME || 'vy-service';

// Enhanced MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 60000, // 60 seconds
  socketTimeoutMS: 90000, // 90 seconds
  connectTimeoutMS: 60000, // 60 seconds
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  dbName: DB_NAME, // Ensure we target the correct database even if URI omits it
};

// Connect to MongoDB
// Disable Mongoose's internal buffering explicitly (supported in Mongoose)
mongoose.set('bufferCommands', false);
mongoose.connect(MONGODB_URI, mongooseOptions)
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  console.log(`📍 Database: ${DB_NAME}`);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  console.error('💡 Make sure:');
  console.error('   1. MongoDB Atlas Network Access allows 0.0.0.0/0 (all IPs)');
  console.error('   2. Connection string is correct');
  console.error('   3. MongoDB Atlas cluster is running (not paused)');
  console.error('   4. Password is URL encoded (%40 for @)');
  // Don't exit - let the server start and retry
});

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'VY Service Backend API',
    status: 'running',
    version: '1.0.0',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        employees: '/api/employees',
        repairs: '/api/repairs',
        attendance: '/api/attendance',
        whatsapp: '/api/whatsapp'
      }
  });
});

// Routes
const repairsRouter = require('./routes/repairs');
app.use('/api/repairs', repairsRouter);

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const employeesRouter = require('./routes/employees');
app.use('/api/employees', employeesRouter);

const attendanceRouter = require('./routes/attendance');
app.use('/api/attendance', attendanceRouter);

const whatsappRouter = require('./routes/whatsapp');
app.use('/api/whatsapp', whatsappRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Wait for MongoDB connection before starting server (optional - server will start anyway)
// Start server regardless of MongoDB connection status
// Routes will handle connection errors gracefully
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`⏳ Waiting for MongoDB connection...`);
});

