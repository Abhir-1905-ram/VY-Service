const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }, // For simplicity; consider hashing for production
  isApproved: { type: Boolean, default: false },
  allowedCards: {
    type: [String],
    default: ['repair-service', 'repair-list', 'attendance'], // Default: all cards allowed
    enum: ['repair-service', 'repair-list', 'attendance'], // Available card types
  },
  canRemoveRepairs: { type: Boolean, default: false }, // Permission to remove pending repairs
}, {
  timestamps: true,
});

module.exports = mongoose.model('Employee', employeeSchema);



