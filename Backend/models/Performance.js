// models/Performance.js - Performance Review Schema
const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required']
  },
  employeeName: {
    type: String,
    required: true
  },
  reviewDate: {
    type: Date,
    required: [true, 'Review date is required'],
    default: Date.now
  },
  reviewPeriod: {
    type: String,
    required: [true, 'Review period is required']
  },
  rating: {
    type: String,
    required: [true, 'Rating is required'],
    enum: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'],
    default: 'Satisfactory'
  },
  goals: {
    type: String,
    trim: true,
    maxlength: [1000, 'Goals cannot exceed 1000 characters']
  },
  achievements: {
    type: String,
    trim: true,
    maxlength: [1000, 'Achievements cannot exceed 1000 characters']
  },
  areasOfImprovement: {
    type: String,
    trim: true,
    maxlength: [1000, 'Areas of improvement cannot exceed 1000 characters']
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comments cannot exceed 1000 characters']
  },
  reviewedBy: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Acknowledged'],
    default: 'Submitted'
  }
}, {
  timestamps: true
});

// Indexes for performance
performanceSchema.index({ employeeId: 1, reviewDate: -1 });
performanceSchema.index({ rating: 1 });
performanceSchema.index({ reviewDate: -1 });
performanceSchema.index({ status: 1 });

module.exports = mongoose.model('Performance', performanceSchema);