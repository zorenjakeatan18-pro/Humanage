// routes/dashboard.js - Dashboard Statistics Routes
const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Performance = require('../models/Performance');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    // Employee stats
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    
    // Attendance stats (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });
    
    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'Present'
    });
    
    // Payroll stats
    const totalPayroll = await Payroll.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$netPay' } } }
    ]);
    
    // Performance stats
    const totalReviews = await Performance.countDocuments();
    
    // Department distribution
    const departmentDistribution = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Birthday employees today
    const todayDate = new Date();
    const birthdayEmployees = await Employee.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$birthday' }, todayDate.getMonth() + 1] },
          { $eq: [{ $dayOfMonth: '$birthday' }, todayDate.getDate()] }
        ]
      }
    });
    
    // Monthly payroll trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyPayroll = await Payroll.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: 'Paid'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$netPay' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees
        },
        attendance: {
          total: todayAttendance,
          present: presentToday
        },
        payroll: {
          total: totalPayroll[0]?.total || 0
        },
        performance: {
          total: totalReviews
        },
        departmentDistribution,
        birthdayEmployees,
        monthlyPayroll
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;