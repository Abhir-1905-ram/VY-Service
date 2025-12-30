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
    const { username, password, allowedCards, canRemoveRepairs } = req.body || {};
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
    if (allowedCards !== undefined) {
      // Validate allowedCards array - allow empty array to block all cards
      const validCards = ['repair-service', 'repair-list', 'attendance'];
      if (Array.isArray(allowedCards)) {
        const filtered = allowedCards.filter(card => validCards.includes(card));
        update.allowedCards = filtered;
        console.log('Updating allowedCards for employee', id, 'to:', filtered);
      } else {
        update.allowedCards = [];
        console.log('Updating allowedCards for employee', id, 'to empty array (invalid input)');
      }
    }
    if (canRemoveRepairs !== undefined) {
      update.canRemoveRepairs = Boolean(canRemoveRepairs);
      console.log('Updating canRemoveRepairs for employee', id, 'to:', update.canRemoveRepairs);
    }
    const emp = await Employee.findByIdAndUpdate(id, update, { new: true });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    // Ensure allowedCards is always returned as an array
    const returnedCards = Array.isArray(emp.allowedCards) ? emp.allowedCards : (emp.allowedCards ? [emp.allowedCards] : []);
    console.log('Returning employee data with allowedCards:', returnedCards);
    res.json({ 
      success: true, 
      data: { 
        id: emp._id, 
        username: emp.username, 
        isApproved: emp.isApproved, 
        allowedCards: returnedCards,
        canRemoveRepairs: emp.canRemoveRepairs || false
      } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update employee', error: e.message });
  }
});

// GET /api/employees
router.get('/', async (_req, res) => {
  try {
    const emps = await Employee.find().sort({ createdAt: -1 });
    // Ensure allowedCards is always an array in the response
    const empsWithCards = emps.map(emp => ({
      ...emp.toObject(),
      allowedCards: Array.isArray(emp.allowedCards) ? emp.allowedCards : (emp.allowedCards ? [emp.allowedCards] : [])
    }));
    res.json({ success: true, data: empsWithCards });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch employees', error: e.message });
  }
});

// GET /api/employees/:id/cards - get allowed cards for an employee
router.get('/:id/cards', async (req, res) => {
  try {
    const { id } = req.params;
    const emp = await Employee.findById(id);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    // Return the actual allowedCards from database
    // If field doesn't exist (undefined), return defaults. If empty array, return empty array.
    let cards = [];
    if (emp.allowedCards === undefined || emp.allowedCards === null) {
      // Field was never set, use defaults
      cards = ['repair-service', 'repair-list', 'attendance'];
    } else if (Array.isArray(emp.allowedCards)) {
      // Field exists, return as-is (even if empty)
      cards = emp.allowedCards;
    }
    console.log('GET cards for employee', id, 'returning:', cards);
    res.json({ 
      success: true, 
      data: { 
        allowedCards: cards,
        canRemoveRepairs: emp.canRemoveRepairs || false
      } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch cards', error: e.message });
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



