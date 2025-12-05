// models/Payroll.js - FIXED Payroll Schema (grossPay as regular field)
const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required']
  },
  employeeName: {
    type: String,
    required: true
  },
  department: String,
  position: String,
  period: {
    type: String,
    required: [true, 'Pay period is required']
  },
  daysOfWork: {
    type: Number,
    required: [true, 'Days of work is required'],
    min: [0, 'Days must be positive'],
    max: [31, 'Days cannot exceed 31']
  },
  // Basic Salary
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  ratePerDay: {
    type: Number,
    default: 0
  },
  // Premiums
  nightDiffHrs: {
    type: Number,
    default: 0
  },
  nightDiffAmt: {
    type: Number,
    default: 0
  },
  overtimeHrs: {
    type: Number,
    default: 0
  },
  overtimeAmt: {
    type: Number,
    default: 0
  },
  restDayPremiums: {
    type: Number,
    default: 0
  },
  // ✅ FIXED: grossPay is now a REGULAR FIELD (not virtual)
  grossPay: {
    type: Number,
    default: 0
  },
  // Government Contributions (Auto-calculated)
  sss: {
    type: Number,
    default: 0
  },
  philhealth: {
    type: Number,
    default: 0
  },
  pagibig: {
    type: Number,
    default: 0
  },
  withholdingTax: {
    type: Number,
    default: 0
  },
  // Loans & Deductions
  hdmfLoan: {
    type: Number,
    default: 0
  },
  sssCalamityLoan: {
    type: Number,
    default: 0
  },
  pagibigLoan: {
    type: Number,
    default: 0
  },
  emergencyLoan: {
    type: Number,
    default: 0
  },
  shortage: {
    type: Number,
    default: 0
  },
  otherDeductions: {
    type: Number,
    default: 0
  },
  // Computed values
  taxableSalary: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netPay: {
    type: Number,
    default: 0
  },
  isBelowMinimum: {
    type: Boolean,
    default: false
  },
  // Status
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Paid'],
    default: 'Pending'
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate payroll
payrollSchema.index({ employeeId: 1, period: 1 }, { unique: true });

// Indexes for performance
payrollSchema.index({ period: -1 });
payrollSchema.index({ status: 1 });
payrollSchema.index({ department: 1 });
payrollSchema.index({ createdAt: -1 });

// ❌ REMOVED: Virtual grossPay (now a regular field instead)
// This was causing the issue - virtuals don't get saved to database

// Pre-save middleware to calculate everything
payrollSchema.pre('save', function(next) {
  // Calculate rate per day
  this.ratePerDay = this.daysOfWork > 0 ? (this.basicSalary / this.daysOfWork) : 0;
  
  // Check minimum wage (₱685/day)
  const minimumDailyWage = 685;
  this.isBelowMinimum = this.ratePerDay < minimumDailyWage;
  
  // ✅ Calculate gross pay (now saves to database as regular field)
  this.grossPay = this.basicSalary + 
                  (this.nightDiffAmt || 0) + 
                  (this.overtimeAmt || 0) + 
                  (this.restDayPremiums || 0);
  
  // Auto-calculate government contributions
  // SSS (5% capped at ₱1,350)
  this.sss = Math.min(this.grossPay * 0.05, 1350);
  
  // PhilHealth (2.5% capped at ₱2,500)
  this.philhealth = Math.min(this.grossPay * 0.025, 2500);
  
  // Pag-IBIG (2% capped at ₱100 or ₱200)
  this.pagibig = this.grossPay <= 5000 ? 
    Math.min(this.grossPay * 0.02, 100) : 
    Math.min(this.grossPay * 0.02, 200);
  
  // Calculate taxable income
  this.taxableSalary = this.grossPay - this.sss - this.philhealth - this.pagibig;
  
  // Calculate withholding tax (BIR tax brackets) - only if above minimum
  if (this.isBelowMinimum) {
    this.withholdingTax = 0;
  } else {
    const taxable = this.taxableSalary;
    if (taxable <= 20833) {
      this.withholdingTax = 0;
    } else if (taxable <= 33332) {
      this.withholdingTax = (taxable - 20833) * 0.20;
    } else if (taxable <= 66666) {
      this.withholdingTax = 2500 + (taxable - 33333) * 0.25;
    } else if (taxable <= 166666) {
      this.withholdingTax = 10833.33 + (taxable - 66667) * 0.30;
    } else if (taxable <= 666666) {
      this.withholdingTax = 40833.33 + (taxable - 166667) * 0.32;
    } else {
      this.withholdingTax = 200833.33 + (taxable - 666667) * 0.35;
    }
  }
  
  // Calculate total deductions
  this.totalDeductions = this.sss + this.philhealth + this.pagibig + 
                         this.withholdingTax + (this.hdmfLoan || 0) + 
                         (this.sssCalamityLoan || 0) + (this.pagibigLoan || 0) + 
                         (this.emergencyLoan || 0) + (this.shortage || 0) + 
                         (this.otherDeductions || 0);
  
  // Calculate net pay
  this.netPay = this.grossPay - this.totalDeductions;
  
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);