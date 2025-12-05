// routes/performance.js - Performance Review Routes
const express = require('express');
const router = express.Router();
const Performance = require('../models/Performance');

// Get all performance reviews
router.get('/', async (req, res) => {
  try {
    const { rating, employeeId } = req.query;
    let query = {};
    
    if (rating && rating !== 'All') query.rating = rating;
    if (employeeId) query.employeeId = employeeId;
    
    const performance = await Performance.find(query)
      .populate('employeeId', 'firstName lastName department position')
      .sort({ reviewDate: -1 });
    
    res.json({ success: true, count: performance.length, data: performance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create performance review
router.post('/', async (req, res) => {
  try {
    const performance = await Performance.create(req.body);
    res.status(201).json({ success: true, data: performance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update performance review
router.put('/:id', async (req, res) => {
  try {
    const performance = await Performance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!performance) {
      return res.status(404).json({ message: 'Performance review not found' });
    }
    
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete performance review
router.delete('/:id', async (req, res) => {
  try {
    const performance = await Performance.findByIdAndDelete(req.params.id);
    
    if (!performance) {
      return res.status(404).json({ message: 'Performance review not found' });
    }
    
    res.json({ success: true, message: 'Performance review deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;