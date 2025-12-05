// models/Employee.js - Employee Schema (UPDATED with all new fields)
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{11}$/, 'Please enter a valid 11-digit phone number']
  },
  birthday: {
    type: Date,
    required: [true, 'Birthday is required']
  },
  birthplace: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', ''],
    default: ''
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', ''],
    default: ''
  },
  
  // Government IDs (Numbers only)
  philhealthId: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        // Allow empty string or numbers only (no dashes, letters, etc)
        return v === '' || /^[0-9]+$/.test(v);
      },
      message: 'PhilHealth ID must contain only numbers'
    }
  },
  sssNo: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || /^[0-9]+$/.test(v);
      },
      message: 'SSS No. must contain only numbers'
    }
  },
  tinNo: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || /^[0-9]+$/.test(v);
      },
      message: 'TIN No. must contain only numbers'
    }
  },
  hdmfId: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || /^[0-9]+$/.test(v);
      },
      message: 'HDMF ID must contain only numbers'
    }
  },
  
  // Address
  houseNo: {
    type: String,
    required: [true, 'House/Lot number is required'],
    trim: true
  },
  street: {
    type: String,
    required: [true, 'Street is required'],
    trim: true
  },
  barangay: {
    type: String,
    required: [true, 'Barangay is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  municipality: {
    type: String,
    required: [true, 'Municipality/Province is required'],
    trim: true
  },
  
  // Employment
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['HR', 'Treasury', 'Accounting', 'Employee'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: [0, 'Basic salary must be a positive number']
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: [0, 'Salary must be a positive number']
  },
  hireDate: {
    type: Date,
    required: [true, 'Hire date is required']
  },
  employmentStatus: {
    type: String,
    enum: ['Regular', 'Probationary', ''],
    default: 'Regular'
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  
  // Photo (base64)
  photo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ hireDate: -1 });
employeeSchema.index({ firstName: 1, lastName: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
employeeSchema.virtual('age').get(function() {
  if (!this.birthday) return null;
  const today = new Date();
  const birthDate = new Date(this.birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for days employed
employeeSchema.virtual('daysEmployed').get(function() {
  if (!this.hireDate) return 0;
  const hire = new Date(this.hireDate);
  const today = new Date();
  const diffTime = Math.abs(today - hire);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for half month salary (basic salary × 15 days)
employeeSchema.virtual('halfMonthSalary').get(function() {
  if (!this.basicSalary) return 0;
  return this.basicSalary * 15;
});

// Virtual for monthly salary (basic salary × 30 days)
employeeSchema.virtual('monthlySalary').get(function() {
  if (!this.basicSalary) return 0;
  return this.basicSalary * 30;
});

// Pre-save middleware
employeeSchema.pre('save', function(next) {
  // Capitalize names
  if (this.isModified('firstName')) {
    this.firstName = this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase();
  }
  if (this.isModified('lastName')) {
    this.lastName = this.lastName.charAt(0).toUpperCase() + this.lastName.slice(1).toLowerCase();
  }
  
  // Remove non-numeric characters from government IDs
  if (this.isModified('philhealthId') && this.philhealthId) {
    this.philhealthId = this.philhealthId.replace(/\D/g, '');
  }
  if (this.isModified('sssNo') && this.sssNo) {
    this.sssNo = this.sssNo.replace(/\D/g, '');
  }
  if (this.isModified('tinNo') && this.tinNo) {
    this.tinNo = this.tinNo.replace(/\D/g, '');
  }
  if (this.isModified('hdmfId') && this.hdmfId) {
    this.hdmfId = this.hdmfId.replace(/\D/g, '');
  }
  
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);