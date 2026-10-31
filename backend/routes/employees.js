const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { EMPLOYEE_PUBLIC_COLUMNS, mapEmployee, isUniqueViolation } = require('../lib/dbHelpers');

// POST /api/employees/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password, employeeKind } = req.body;
    const kind = employeeKind === 'sales' ? 'sales' : 'employee';
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const { data: emp, error } = await supabase
      .from('employees')
      .insert({
        username,
        password,
        is_approved: false,
        employee_kind: kind,
        allowed_cards: kind === 'sales' ? ['attendance'] : ['repair-service', 'repair-list', 'attendance'],
        can_remove_repairs: false,
      })
      .select(EMPLOYEE_PUBLIC_COLUMNS)
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }
      throw error;
    }

    const mapped = mapEmployee(emp);
    res.status(201).json({
      success: true,
      data: { id: mapped.id, username: mapped.username, isApproved: mapped.isApproved, employeeKind: mapped.employeeKind },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Signup failed', error: e.message });
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, allowedCards, canRemoveRepairs, employeeKind } = req.body || {};
    const update = {};

    if (username) {
      const { data: existing } = await supabase
        .from('employees')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existing && existing.id !== id) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }
      update.username = username;
    }
    if (password) update.password = password;
    const kind = employeeKind === 'sales' || employeeKind === 'employee' ? employeeKind : null;
    if (allowedCards !== undefined) {
      const validCards = kind === 'sales' ? ['attendance'] : ['repair-service', 'repair-list', 'attendance'];
      update.allowed_cards = Array.isArray(allowedCards)
        ? allowedCards.filter(card => validCards.includes(card))
        : [];
    } else if (kind === 'sales') {
      update.allowed_cards = ['attendance'];
    }
    if (kind === 'sales') update.can_remove_repairs = false;
    else if (canRemoveRepairs !== undefined) update.can_remove_repairs = Boolean(canRemoveRepairs);
    if (kind) update.employee_kind = kind;

    const { data: emp, error } = await supabase
      .from('employees')
      .update(update)
      .eq('id', id)
      .select(EMPLOYEE_PUBLIC_COLUMNS)
      .single();

    if (error) throw error;
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const mapped = mapEmployee(emp);
    res.json({
      success: true,
      data: {
        id: mapped.id,
        username: mapped.username,
        isApproved: mapped.isApproved,
        allowedCards: mapped.allowedCards,
        canRemoveRepairs: mapped.canRemoveRepairs,
        employeeKind: mapped.employeeKind,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update employee', error: e.message });
  }
});

// GET /api/employees
router.get('/', async (_req, res) => {
  try {
    const { data: emps, error } = await supabase
      .from('employees')
      .select(EMPLOYEE_PUBLIC_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: (emps || []).map(mapEmployee) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch employees', error: e.message });
  }
});

// GET /api/employees/:id/cards
router.get('/:id/cards', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: emp, error } = await supabase
      .from('employees')
      .select(EMPLOYEE_PUBLIC_COLUMNS)
      .eq('id', id)
      .single();

    if (error || !emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const isSales = emp.employee_kind === 'sales';
    let cards = [];
    if (emp.allowed_cards === undefined || emp.allowed_cards === null) {
      cards = isSales ? ['attendance'] : ['repair-service', 'repair-list', 'attendance'];
    } else if (Array.isArray(emp.allowed_cards)) {
      cards = emp.allowed_cards;
    }
    if (isSales) cards = cards.filter((card) => card === 'attendance');

    res.json({
      success: true,
      data: {
        allowedCards: cards,
        canRemoveRepairs: isSales ? false : emp.can_remove_repairs || false,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch cards', error: e.message });
  }
});

// PUT /api/employees/:id/approve
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: emp, error } = await supabase
      .from('employees')
      .update({ is_approved: true })
      .eq('id', id)
      .select(EMPLOYEE_PUBLIC_COLUMNS)
      .single();

    if (error || !emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: mapEmployee(emp) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to approve employee', error: e.message });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: emp, error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error || !emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: { id: emp.id } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete employee', error: e.message });
  }
});

// POST /api/employees/:id/delete
router.post('/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: emp, error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error || !emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: { id: emp.id } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete employee', error: e.message });
  }
});

module.exports = router;
