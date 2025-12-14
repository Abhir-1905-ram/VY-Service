const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  employeeName: { type: String },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  ipAddress: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number },
  accuracy: { type: Number },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Unique per employee per date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);


