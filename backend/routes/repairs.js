const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');

// POST /api/repairs - Create a new repair entry
router.post('/', async (req, res) => {
  try {
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

    if (req.body.deliveredAt) {
      updateData.deliveredAt = new Date(req.body.deliveredAt);
    }
    if (req.body.status) {
      updateData.status = req.body.status;
    }
    if (req.body.remark !== undefined) {
      updateData.remark = req.body.remark;
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

module.exports = router;

