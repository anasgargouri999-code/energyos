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

// GET /zones?url=: proxy zones list fetch
router.get('/zones', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(`${url}/api/zones`, { timeout: 5000 });
    res.json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    res.status(status).json({ error: 'Failed to fetch zones from GTB', details: err.message });
  }
});

// GET /live?url=: proxy live energy data fetch
router.get('/live', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(`${url}/api/energy/live`, { timeout: 5000 });
    res.json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    res.status(status).json({ error: 'Failed to fetch live data from GTB', details: err.message });
  }
});

// GET /alerts?url=: proxy alerts list fetch
router.get('/alerts', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(`${url}/api/alerts`, { timeout: 5000 });
    res.json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    res.status(status).json({ error: 'Failed to fetch alerts from GTB', details: err.message });
  }
});

// POST /alerts/:alertId/acknowledge: proxy alert acknowledge
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { url } = req.body;
    const { alertId } = req.params;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.post(`${url}/api/alerts/${alertId}/acknowledge`, {}, { timeout: 3000 });
    res.json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    res.status(status).json({ error: 'Failed to acknowledge alert in GTB', details: err.message });
  }
});

// GET /config?url=: proxy configuration fetch (schedules, thresholds)
router.get('/config', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(`${url}/api/config`, { timeout: 5000 });
    res.json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    res.status(status).json({ error: 'Failed to fetch config from GTB', details: err.message });
  }
});

// POST /config: proxy configuration update (merge schedules, settings)
router.post('/config', async (req, res) => {
  try {
    const { url, config } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.post(`${url}/api/config`, config, { timeout: 5000 });
    res.json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    res.status(status).json({ error: 'Failed to update config in GTB', details: err.message });
  }
});

module.exports = router;
