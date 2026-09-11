const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { mapEmployee } = require('../lib/dbHelpers');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    if (username === 'admin' && password === 'admin@1152') {
      return res.json({ success: true, role: 'admin', user: { username: 'admin' } });
    }
    const { data: emp, error } = await supabase
      .from('employees')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      if (error.message && error.message.includes('schema cache')) {
        return res.status(503).json({
          success: false,
          message: 'Database tables are not set up. Run backend/supabase/schema.sql in the Supabase SQL Editor.',
        });
      }
      return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }

    if (!emp || emp.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!emp.is_approved) {
      return res.status(403).json({ success: false, message: 'Admin has not approved your account yet.' });
    }
    const mapped = mapEmployee(emp);
    return res.json({
      success: true,
      role: 'employee',
      user: {
        id: mapped.id,
        username: mapped.username,
        allowedCards: mapped.allowedCards.length ? mapped.allowedCards : ['repair-service', 'repair-list', 'attendance'],
        canRemoveRepairs: mapped.canRemoveRepairs,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Login failed', error: e.message });
  }
});

module.exports = router;
