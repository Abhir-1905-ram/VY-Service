const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }, // For simplicity; consider hashing for production
  isApproved: { type: Boolean, default: false },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Employee', employeeSchema);



