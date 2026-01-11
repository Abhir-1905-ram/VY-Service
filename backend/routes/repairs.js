const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');
const { sendSMSToMultiple, generateRepairNotificationMessage } = require('../services/fast2smsService');

// POST /api/repairs - Create a new repair entry
router.post('/', async (req, res) => {
  try {
    // Parse expectedAmount (optional)
    let expectedAmountValue = null;
    if (req.body.expectedAmount !== undefined && req.body.expectedAmount !== null && req.body.expectedAmount !== '') {
      const parsed = parseFloat(req.body.expectedAmount);
      if (!isNaN(parsed) && parsed > 0) {
        expectedAmountValue = parsed;
      }
    }

    const repairData = {
      uniqueId: req.body.uniqueId,
      customerName: req.body.customerName,
      phoneNumber: req.body.phoneNumber,
      type: req.body.type,
      brand: req.body.brand || '',
      adapterGiven: req.body.adapterGiven,
      problem: req.body.problem,
      createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
      status: req.body.status || 'Pending',
      createdBy: req.body.createdBy || '',
      expectedAmount: expectedAmountValue, // Optional expected amount
    };

    // Validate required fields
    if (!repairData.uniqueId || !repairData.customerName || !repairData.phoneNumber || !repairData.type || !repairData.problem) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Validate brand and adapterGiven for all device types
    if (!repairData.brand) {
      return res.status(400).json({
        success: false,
        message: 'Brand name is required',
      });
    }
    if (repairData.adapterGiven === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Adapter status is required',
      });
    }

    const repair = new Repair(repairData);
    await repair.save();

    // Send SMS notification after successful save
    try {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📱 SMS NOTIFICATION PROCESS STARTED');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📋 Repair Data:', JSON.stringify({
        phoneNumber: repairData.phoneNumber,
        customerName: repairData.customerName,
        type: repairData.type,
        brand: repairData.brand
      }, null, 2));
      
      const message = generateRepairNotificationMessage(
        repairData.customerName,
        repairData.type,
        repairData.brand
      );
      
      console.log('💬 Generated Message:', message);
      console.log('📞 Phone Number(s):', repairData.phoneNumber);
      
      const smsResults = await sendSMSToMultiple(repairData.phoneNumber, message);
      
      const successful = smsResults.filter(r => r.success).length;
      const failed = smsResults.filter(r => !r.success).length;
      
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📊 SMS RESULTS: ${successful} successful, ${failed} failed`);
      console.log('═══════════════════════════════════════════════════════');
      
      if (successful > 0) {
        smsResults.filter(r => r.success).forEach(r => {
          console.log(`  ✅ ${r.phoneNumber}: ${r.message}`);
        });
      }
      
      if (failed > 0) {
        smsResults.filter(r => !r.success).forEach(r => {
          console.error(`  ❌ ${r.phoneNumber}: ${r.message}`);
          
          // Show special instructions for transaction requirement
          if (r.requiresTransaction) {
            console.error(`     ⚠️  ACTION REQUIRED: Complete a transaction of 100 INR or more in Fast2SMS`);
            console.error(`     📱 Visit: https://www.fast2sms.com to add credits and activate API`);
          }
          
          if (r.responseData) {
            console.error(`     Response Data:`, JSON.stringify(r.responseData, null, 2));
          }
        });
      }
      console.log('═══════════════════════════════════════════════════════\n');
    } catch (smsError) {
      console.error('\n❌ EXCEPTION in SMS sending:', smsError);
      console.error('Stack trace:', smsError.stack);
      // Don't fail the request if SMS fails
    }

    res.status(201).json({
      success: true,
      message: 'Repair entry created successfully',
      data: repair,
    });
  } catch (error) {
    console.error('Error creating repair entry:', error);
    
    // Check for duplicate key error (MongoDB unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A repair entry with this ID already exists. Please run the script to remove the unique index: node backend/dropUniqueIndex.js',
        error: 'Duplicate uniqueId - unique index still exists in MongoDB',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create repair entry',
      error: error.message,
    });
  }
});

// GET /api/repairs - Get all repair entries
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Database connection not ready. Please wait and try again.',
        error: 'MongoDB connection pending',
      });
    }

    console.log('GET /api/repairs - Fetching all repairs');
    const repairs = await Repair.find().sort({ createdAt: -1 }).maxTimeMS(30000);
    console.log(`Found ${repairs.length} repairs`);
    res.json({
      success: true,
      data: repairs,
    });
  } catch (error) {
    console.error('Error fetching repairs:', error);
    
    // Check if it's a connection error
    if (error.name === 'MongooseError' && error.message.includes('buffering')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not ready. Please check MongoDB Atlas Network Access settings.',
        error: 'MongoDB connection timeout',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repairs',
      error: error.message,
    });
  }
});

// GET /api/repairs/search/:uniqueId - Get all repairs by unique ID (customer history)
router.get('/search/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    console.log('Searching for repairs with uniqueId:', uniqueId);
    
    // Get the most recent repair for customer details
    const latestRepair = await Repair.findOne({ uniqueId: uniqueId }).sort({ createdAt: -1 });
    
    // Get all repairs for this customer/device (history)
    const allRepairs = await Repair.find({ uniqueId: uniqueId }).sort({ createdAt: -1 });
    
    if (!latestRepair) {
      return res.status(404).json({
        success: false,
        message: 'Repair entry not found with this ID',
      });
    }

    res.json({
      success: true,
      data: latestRepair, // Return latest for form auto-fill
      history: allRepairs, // Return all previous problems
      totalEntries: allRepairs.length,
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

// PUT /api/repairs/:id - Update repair entry (delivery status)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Handle deliveredAt: explicitly set to null if provided as null, or set to date if provided
    if (req.body.deliveredAt !== undefined) {
      if (req.body.deliveredAt === null || req.body.deliveredAt === '') {
        updateData.deliveredAt = null;
      } else {
        updateData.deliveredAt = new Date(req.body.deliveredAt);
      }
    }
    if (req.body.status) {
      updateData.status = req.body.status;
    }
    if (req.body.remark !== undefined) {
      updateData.remark = req.body.remark;
    }
    // Handle amount: optional field for delivered items
    if (req.body.amount !== undefined) {
      if (req.body.amount === null || req.body.amount === '' || req.body.amount === 0) {
        updateData.amount = null;
      } else {
        const amountValue = parseFloat(req.body.amount);
        updateData.amount = isNaN(amountValue) ? null : amountValue;
      }
    }

    const repair = await Repair.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair entry not found',
      });
    }

    res.json({
      success: true,
      message: 'Repair entry updated successfully',
      data: repair,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update repair entry',
      error: error.message,
    });
  }
});

// DELETE /api/repairs/:id - Delete a repair entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only allow deletion of pending repairs
    const repair = await Repair.findById(id);
    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair entry not found',
      });
    }

    // Check if repair is pending
    if (repair.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending repairs can be removed',
      });
    }

    // Delete the repair
    await Repair.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Repair entry removed successfully',
      data: { id },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete repair entry',
      error: error.message,
    });
  }
});

// Fallback POST route for environments where DELETE might be blocked
router.post('/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only allow deletion of pending repairs
    const repair = await Repair.findById(id);
    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair entry not found',
      });
    }

    // Check if repair is pending
    if (repair.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending repairs can be removed',
      });
    }

    // Delete the repair
    await Repair.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Repair entry removed successfully',
      data: { id },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete repair entry',
      error: error.message,
    });
  }
});

module.exports = router;

