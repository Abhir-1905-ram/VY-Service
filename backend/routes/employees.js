const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// POST /api/employees/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    const existing = await Employee.findOne({ username });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }
    const emp = new Employee({ username, password, isApproved: false });
    await emp.save();
    res.status(201).json({ success: true, data: { id: emp._id, username: emp.username, isApproved: emp.isApproved } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Signup failed', error: e.message });
  }
});

// PUT /api/employees/:id - update username/password
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body || {};
    const update = {};
    if (username) {
      // ensure unique username
      const existing = await Employee.findOne({ username });
      if (existing && existing._id.toString() !== id) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }
      update.username = username;
    }
    if (password) update.password = password;
    const emp = await Employee.findByIdAndUpdate(id, update, { new: true });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: { id: emp._id, username: emp.username, isApproved: emp.isApproved } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update employee', error: e.message });
  }
});

// GET /api/employees
router.get('/', async (_req, res) => {
  try {
    const emps = await Employee.find().sort({ createdAt: -1 });
    res.json({ success: true, data: emps });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch employees', error: e.message });
  }
});

// PUT /api/employees/:id/approve
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const emp = await Employee.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: emp });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to approve employee', error: e.message });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const emp = await Employee.findByIdAndDelete(id);
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: { id: emp._id } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete employee', error: e.message });
  }
});

// Fallback for environments where DELETE might be blocked by proxies
// POST /api/employees/:id/delete
router.post('/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    const emp = await Employee.findByIdAndDelete(id);
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: { id: emp._id } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete employee', error: e.message });
  }
});

module.exports = router;



