// routes/payroll.js - Payroll Routes
const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');

// @route   GET /api/payroll
// @desc    Get all payroll records
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { period, status, department } = req.query;
    
    let query = {};
    
    if (period && period !== 'All') {
      query.period = period;
    }
    
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (department && department !== 'All') {
      query.department = department;
    }
    
    const payroll = await Payroll.find(query)
      .populate('employeeId', 'firstName lastName department position')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: payroll.length,
      data: payroll
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/payroll/:id
// @desc    Get single payroll record
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'firstName lastName department position');
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/payroll
// @desc    Create payroll record (with auto-calculations)
// @access  Public
router.post('/', async (req, res) => {
  try {
    // Check for duplicate (same employee, same period)
    const exists = await Payroll.findOne({
      employeeId: req.body.employeeId,
      period: req.body.period
    });
    
    if (exists) {
      return res.status(400).json({ 
        message: 'Payroll already exists for this employee in this period' 
      });
    }
    
    // Payroll model will auto-calculate everything via pre-save middleware
    const payroll = await Payroll.create(req.body);
    
    res.status(201).json({
      success: true,
      data: payroll,
      message: 'Payroll created with auto-calculated taxes and deductions'
    });
  } catch (error) {
    console.error('Create payroll error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/payroll/:id
// @desc    Update payroll record
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    // Find and update (pre-save will recalculate everything)
    const payroll = await Payroll.findById(req.params.id);
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    // Update fields
    Object.assign(payroll, req.body);
    
    // Save (triggers pre-save middleware for recalculation)
    await payroll.save();
    
    res.json({
      success: true,
      data: payroll,
      message: 'Payroll updated with recalculated values'
    });
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/payroll/:id
// @desc    Delete payroll record
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/payroll/stats/summary
// @desc    Get payroll statistics
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await Payroll.countDocuments();
    const paid = await Payroll.countDocuments({ status: 'Paid' });
    const pending = await Payroll.countDocuments({ status: 'Pending' });
    const processing = await Payroll.countDocuments({ status: 'Processing' });
    
    // Total payroll amount
    const totalAmount = await Payroll.aggregate([
      { $group: { _id: null, total: { $sum: '$netPay' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        paid,
        pending,
        processing,
        totalAmount: totalAmount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get payroll stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;