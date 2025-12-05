// routes/attendance.js - Attendance Routes
const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee'); // Import Employee model

// @route   GET /api/attendance
// @desc    Get all attendance records
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { date, status, employeeId } = req.query;
    
    let query = {};
    
    if (date) {
      query.date = new Date(date);
    }
    
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    const attendance = await Attendance.find(query).sort({ date: -1 });
    
    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/attendance
// @desc    Create attendance record
// @access  Public
router.post('/', async (req, res) => {
  try {
    // Check for duplicate (same employee, same date)
    const exists = await Attendance.findOne({
      employeeId: req.body.employeeId,
      date: new Date(req.body.date)
    });
    
    if (exists) {
      return res.status(400).json({ 
        message: 'Attendance record already exists for this employee on this date' 
      });
    }
    
    // If department is not provided, fetch it from Employee
    let attendanceData = { ...req.body };
    
    if (!attendanceData.department || attendanceData.department === '') {
      const employee = await Employee.findById(req.body.employeeId);
      if (employee) {
        attendanceData.department = employee.department || 'N/A';
        attendanceData.employeeName = `${employee.firstName} ${employee.lastName}`;
      }
    }
    
    const attendance = await Attendance.create(attendanceData);
    
    res.status(201).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    // If department is not provided in update, fetch it from Employee
    let updateData = { ...req.body };
    
    if ((!updateData.department || updateData.department === '' || updateData.department === 'N/A') && updateData.employeeId) {
      const employee = await Employee.findById(updateData.employeeId);
      if (employee) {
        updateData.department = employee.department || 'N/A';
        if (!updateData.employeeName) {
          updateData.employeeName = `${employee.firstName} ${employee.lastName}`;
        }
      }
    }
    
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/attendance/fix-departments
// @desc    Fix missing departments in existing records (migration helper)
// @access  Public
router.patch('/fix-departments', async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({
      $or: [
        { department: { $exists: false } },
        { department: '' },
        { department: 'N/A' }
      ]
    });
    
    let updated = 0;
    
    for (const record of attendanceRecords) {
      const employee = await Employee.findById(record.employeeId);
      if (employee && employee.department) {
        record.department = employee.department;
        record.employeeName = `${employee.firstName} ${employee.lastName}`;
        await record.save();
        updated++;
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updated} records with missing departments`,
      count: updated
    });
  } catch (error) {
    console.error('Fix departments error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;