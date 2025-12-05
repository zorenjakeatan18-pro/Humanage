// routes/employees.js - Employee Routes
const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// @route   GET /api/employees
// @desc    Get all employees
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { department, status, search } = req.query;
    
    let query = {};
    
    // Filter by department
    if (department && department !== 'All') {
      query.department = department;
    }
    
    // Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }
    
    // Search by name, email, or position
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }
    
    const employees = await Employee.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/employees/:id
// @desc    Get single employee
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/employees
// @desc    Create new employee
// @access  Public
router.post('/', async (req, res) => {
  try {
    // Check for duplicate email
    const emailExists = await Employee.findOne({ email: req.body.email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Check for duplicate phone
    const phoneExists = await Employee.findOne({ phone: req.body.phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    
    // Check for duplicate name
    const nameExists = await Employee.findOne({
      firstName: req.body.firstName,
      lastName: req.body.lastName
    });
    if (nameExists) {
      return res.status(400).json({ message: 'Employee with this name already exists' });
    }
    
    const employee = await Employee.create(req.body);
    
    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    // Check for duplicate email (excluding current employee)
    if (req.body.email) {
      const emailExists = await Employee.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    // Check for duplicate phone (excluding current employee)
    if (req.body.phone) {
      const phoneExists = await Employee.findOne({
        phone: req.body.phone,
        _id: { $ne: req.params.id }
      });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }
    }
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/employees/stats/summary
// @desc    Get employee statistics
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await Employee.countDocuments();
    const active = await Employee.countDocuments({ status: 'Active' });
    const onLeave = await Employee.countDocuments({ status: 'On Leave' });
    const inactive = await Employee.countDocuments({ status: 'Inactive' });
    
    // Department distribution
    const departments = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        active,
        onLeave,
        inactive,
        departments
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;