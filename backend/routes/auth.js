const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    // Admin hardcoded
    if (username === 'admin' && password === 'admin@1152') {
      return res.json({ success: true, role: 'admin', user: { username: 'admin' } });
    }
    const emp = await Employee.findOne({ username });
    if (!emp || emp.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!emp.isApproved) {
      return res.status(403).json({ success: false, message: 'Admin has not approved your account yet.' });
    }
    return res.json({ 
      success: true, 
      role: 'employee', 
      user: { 
        id: emp._id, 
        username: emp.username,
        allowedCards: emp.allowedCards || ['repair-service', 'repair-list', 'attendance'],
        canRemoveRepairs: emp.canRemoveRepairs || false
      } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Login failed', error: e.message });
  }
});

module.exports = router;



