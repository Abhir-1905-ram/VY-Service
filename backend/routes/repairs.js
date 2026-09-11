const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { mapRepair } = require('../lib/dbHelpers');

// POST /api/repairs
router.post('/', async (req, res) => {
  try {
    let expectedAmountValue = null;
    if (req.body.expectedAmount !== undefined && req.body.expectedAmount !== null && req.body.expectedAmount !== '') {
      const parsed = parseFloat(req.body.expectedAmount);
      if (!isNaN(parsed) && parsed > 0) {
        expectedAmountValue = parsed;
      }
    }

    const repairData = {
      unique_id: req.body.uniqueId,
      customer_name: req.body.customerName,
      phone_number: req.body.phoneNumber,
      type: req.body.type,
      brand: req.body.brand || '',
      adapter_given: req.body.adapterGiven,
      problem: req.body.problem,
      created_at: req.body.createdAt ? new Date(req.body.createdAt).toISOString() : new Date().toISOString(),
      status: req.body.status || 'Pending',
      created_by: req.body.createdBy || '',
      expected_amount: expectedAmountValue,
    };

    if (!repairData.unique_id || !repairData.customer_name || !repairData.phone_number || !repairData.type || !repairData.problem) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!repairData.brand) {
      return res.status(400).json({ success: false, message: 'Brand name is required' });
    }
    if (repairData.adapter_given === undefined) {
      return res.status(400).json({ success: false, message: 'Adapter status is required' });
    }

    const { data: repair, error } = await supabase
      .from('repairs')
      .insert(repairData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Repair entry created successfully',
      data: mapRepair(repair),
    });
  } catch (error) {
    console.error('Error creating repair entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create repair entry',
      error: error.message,
    });
  }
});

// GET /api/repairs
router.get('/', async (req, res) => {
  try {
    const { data: repairs, error } = await supabase
      .from('repairs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: (repairs || []).map(mapRepair),
    });
  } catch (error) {
    console.error('Error fetching repairs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repairs',
      error: error.message,
    });
  }
});

// GET /api/repairs/search/:uniqueId
router.get('/search/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const { data: allRepairs, error } = await supabase
      .from('repairs')
      .select('*')
      .eq('unique_id', uniqueId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!allRepairs || allRepairs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair entry not found with this ID',
      });
    }

    const mapped = allRepairs.map(mapRepair);
    res.json({
      success: true,
      data: mapped[0],
      history: mapped,
      totalEntries: mapped.length,
    });
  } catch (error) {
    console.error('Error searching repair:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search repair entry',
      error: error.message,
    });
  }
});

// PUT /api/repairs/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    if (req.body.customerName !== undefined) updateData.customer_name = req.body.customerName.trim();
    if (req.body.phoneNumber !== undefined) updateData.phone_number = req.body.phoneNumber;
    if (req.body.type !== undefined) updateData.type = req.body.type.trim();
    if (req.body.brand !== undefined) updateData.brand = req.body.brand.trim();
    if (req.body.problem !== undefined) updateData.problem = req.body.problem.trim();
    if (req.body.adapterGiven !== undefined) updateData.adapter_given = req.body.adapterGiven;
    if (req.body.expectedAmount !== undefined) {
      if (req.body.expectedAmount === null || req.body.expectedAmount === '' || req.body.expectedAmount === 0) {
        updateData.expected_amount = null;
      } else {
        const val = parseFloat(req.body.expectedAmount);
        updateData.expected_amount = isNaN(val) ? null : val;
      }
    }
    if (req.body.deliveredAt !== undefined) {
      updateData.delivered_at = (req.body.deliveredAt === null || req.body.deliveredAt === '')
        ? null
        : new Date(req.body.deliveredAt).toISOString();
    }
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.remark !== undefined) updateData.remark = req.body.remark;
    if (req.body.amount !== undefined) {
      if (req.body.amount === null || req.body.amount === '' || req.body.amount === 0) {
        updateData.amount = null;
      } else {
        const val = parseFloat(req.body.amount);
        updateData.amount = isNaN(val) ? null : val;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const { data: repair, error } = await supabase
      .from('repairs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!repair) {
      return res.status(404).json({ success: false, message: 'Repair entry not found' });
    }

    res.json({
      success: true,
      message: 'Repair entry updated successfully',
      data: mapRepair(repair),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update repair entry',
      error: error.message,
    });
  }
});

// DELETE /api/repairs/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: repair, error: fetchError } = await supabase
      .from('repairs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !repair) {
      return res.status(404).json({ success: false, message: 'Repair entry not found' });
    }
    if (repair.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending repairs can be removed' });
    }

    const { error } = await supabase.from('repairs').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Repair entry removed successfully', data: { id } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete repair entry',
      error: error.message,
    });
  }
});

// POST /api/repairs/:id/delete
router.post('/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: repair, error: fetchError } = await supabase
      .from('repairs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !repair) {
      return res.status(404).json({ success: false, message: 'Repair entry not found' });
    }
    if (repair.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending repairs can be removed' });
    }

    const { error } = await supabase.from('repairs').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Repair entry removed successfully', data: { id } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete repair entry',
      error: error.message,
    });
  }
});

module.exports = router;
