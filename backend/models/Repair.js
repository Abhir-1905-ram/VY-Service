const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    // Removed unique constraint to allow multiple entries for same customer/device
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    trim: true,
    default: '',
  },
  adapterGiven: {
    type: Boolean,
    default: undefined,
  },
  problem: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Completed', 'Not Completed'],
    default: 'Pending',
  },
  remark: {
    type: String,
    trim: true,
    default: '',
  },
  createdBy: {
    type: String,
    trim: true,
    default: '', // employee username or 'admin'
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Repair', repairSchema);



