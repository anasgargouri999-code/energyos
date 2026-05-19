const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /ping?url=: proxy ping to GTB url, return status
router.get('/ping', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(url, { timeout: 5000 });
    res.json({ status: response.status, data: response.data });
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    res.status(status).json({ error: 'Failed to ping GTB', details: err.message });
  }
});

// GET /devices?url=: proxy device list fetch
router.get('/devices', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(url, { timeout: 10000 });
    res.json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    res.status(status).json({ error: 'Failed to fetch devices from GTB', details: err.message });
  }
});

// POST /control: proxy control commands to GTB or Node-RED
router.post('/control', async (req, res) => {
  try {
    const { url, zoneId, parameter, value } = req.body;
    console.log(`[GTB CONTROL] Command: Zone=${zoneId}, Param=${parameter}, Val=${value}`);

    if (url) {
      const response = await axios.post(`${url}/api/control`, { zoneId, parameter, value }, { timeout: 3000 });
      return res.json({ status: 'ok', data: response.data });
    }

    res.json({ status: 'ok', mock: true, message: `Command ${parameter}=${value} simulated successfully` });
  } catch (err) {
    res.json({ status: 'mock_fallback', details: err.message });
  }
});

module.exports = router;
