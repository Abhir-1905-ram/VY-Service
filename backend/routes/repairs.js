const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');
const { sendWhatsAppToMultiple, generateRepairNotificationMessage } = require('../services/whatsappService');

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

    // Send WhatsApp notification after successful save
    try {
      const message = generateRepairNotificationMessage(
        repairData.type,
        repairData.brand
      );
      
      console.log('\n📱 Attempting to send WhatsApp notification...');
      console.log('Phone numbers:', repairData.phoneNumber);
      console.log('Message:', message);
      
      // Send to all phone numbers (comma-separated)
      const whatsappResults = await sendWhatsAppToMultiple(repairData.phoneNumber, message);
      
      // Log results (optional - for debugging)
      const successful = whatsappResults.filter(r => r.success).length;
      const failed = whatsappResults.filter(r => !r.success).length;
      console.log(`📊 WhatsApp results: ${successful} successful, ${failed} failed`);
      
      if (failed > 0) {
        console.warn('❌ Failed WhatsApp numbers:');
        whatsappResults.filter(r => !r.success).forEach(r => {
          console.warn(`  - ${r.phoneNumber}: ${r.message}`);
        });
      }
      
      if (successful > 0) {
        console.log('✅ WhatsApp messages sent successfully!');
      }
    } catch (whatsappError) {
      // Don't fail the repair save if WhatsApp fails - just log it
      console.error('❌ Error sending WhatsApp notification:', whatsappError);
      console.error('Error details:', whatsappError.message);
      console.error('Stack:', whatsappError.stack);
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

