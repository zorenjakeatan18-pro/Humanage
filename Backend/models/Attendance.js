// models/Attendance.js - Attendance Schema
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required']
  },
  employeeName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: false,
    default: 'N/A'
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  timeIn: {
    type: String,
    required: false, // Not required for absent employees
    validate: {
      validator: function(v) {
        // If status is Absent or On Leave, timeIn is optional
        if (this.status === 'Absent' || this.status === 'On Leave') {
          return true;
        }
        // Otherwise, validate time format if provided
        if (!v) return true; // Allow empty
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'Please enter time in HH:MM format'
    }
  },
  timeOut: {
    type: String,
    required: false, // Not required for absent employees
    validate: {
      validator: function(v) {
        // If status is Absent or On Leave, timeOut is optional
        if (this.status === 'Absent' || this.status === 'On Leave') {
          return true;
        }
        // Otherwise, validate time format if provided
        if (!v) return true; // Allow empty
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'Please enter time in HH:MM format'
    }
  },
  hoursWorked: {
    type: String,
    default: '0'
  },
  late: {
    type: String,
    default: '0'
  },
  overtime: {
    type: String,
    default: '0'
  },
  undertime: {
    type: String,
    default: '0'
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Present', 'Absent', 'Late', 'On Leave', 'Half Day'],
    default: 'Present'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Pre-save hook to set default values for absent/on leave employees
attendanceSchema.pre('save', function(next) {
  // If employee is absent or on leave, ensure metrics are zero
  if (this.status === 'Absent' || this.status === 'On Leave') {
    this.timeIn = this.timeIn || '';
    this.timeOut = this.timeOut || '';
    this.hoursWorked = '0';
    this.late = '0';
    this.overtime = '0';
    this.undertime = '0';
  }
  next();
});

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Indexes for performance
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ employeeId: 1, date: -1 });
attendanceSchema.index({ department: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);