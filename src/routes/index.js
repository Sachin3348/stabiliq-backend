const express = require('express');
const router = express.Router();
const StatusCheck = require('../models/StatusCheck');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/
 * API root endpoint
 */
router.get('/', (req, res) => {
  return res.json({ message: 'STABILIQ API - Member Dashboard' });
});

/**
 * POST /api/status
 * Create status check
 */
router.post('/status', async (req, res, next) => {
  try {
    const { client_name } = req.body;

    if (!client_name) {
      return res.status(400).json({ detail: 'client_name is required' });
    }

    const statusCheck = new StatusCheck({
      id: uuidv4(),
      client_name,
      timestamp: new Date()
    });

    await statusCheck.save();

    return res.json({
      id: statusCheck.id,
      client_name: statusCheck.client_name,
      timestamp: statusCheck.timestamp.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/status
 * Get all status checks
 */
router.get('/status', async (req, res, next) => {
  try {
    const statusChecks = await StatusCheck.find({}).limit(1000).lean();

    // Convert to match Python backend format
    const formattedChecks = statusChecks.map(check => ({
      id: check.id,
      client_name: check.client_name,
      timestamp: check.timestamp instanceof Date ? check.timestamp.toISOString() : check.timestamp
    }));

    return res.json(formattedChecks);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
