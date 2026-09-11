const express = require('express');
const cors = require('cors');
require('dotenv').config();

const supabase = require('./lib/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));
app.use(express.json());

// Verify Supabase connection on startup
(async () => {
  try {
    const { error } = await supabase.from('employees').select('id').limit(1);
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      console.error('💡 Make sure:');
      console.error('   1. SUPABASE_URL and SUPABASE_SECRET_KEY are set in .env');
      console.error('   2. You have run backend/supabase/schema.sql in Supabase SQL Editor');
    } else {
      console.log('✅ Connected to Supabase');
    }
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
  }
})();

app.get('/', (req, res) => {
  res.json({
    message: 'VY Service Backend API',
    status: 'running',
    version: '1.0.0',
    database: 'supabase',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      employees: '/api/employees',
      repairs: '/api/repairs',
      attendance: '/api/attendance',
    },
  });
});

const repairsRouter = require('./routes/repairs');
app.use('/api/repairs', repairsRouter);

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const employeesRouter = require('./routes/employees');
app.use('/api/employees', employeesRouter);

const attendanceRouter = require('./routes/attendance');
app.use('/api/attendance', attendanceRouter);

app.get('/api/health', async (req, res) => {
  const { error } = await supabase.from('employees').select('id').limit(1);
  res.json({
    status: error ? 'DEGRADED' : 'OK',
    message: 'Server is running',
    database: error ? 'disconnected' : 'connected',
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
});
