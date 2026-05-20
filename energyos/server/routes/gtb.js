const express = require('express');
const router = express.Router();
const axios = require('axios');

// Helper to clean/sanitize GTB URLs to extract only protocol, host, and port (stripping hashes, socket IDs, UI subpaths)
function cleanGtbUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    let input = rawUrl.trim();
    if (!/^https?:\/\//i.test(input)) {
      input = 'http://' + input;
    }
    return new URL(input).origin;
  } catch {
    return rawUrl;
  }
}

// Middleware to clean/sanitize the GTB URL parameter
router.use((req, res, next) => {
  if (req.query.url) req.query.url = cleanGtbUrl(req.query.url);
  if (req.body && req.body.url) req.body.url = cleanGtbUrl(req.body.url);
  next();
});

// GET /ping?url=: probe GTB reachability — any HTTP response counts as alive
router.get('/ping', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // validateStatus: () => true — don't throw on 4xx/5xx; any HTTP response means the host is up
    await axios.get(`${url}/api/ping`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 5000,
      validateStatus: () => true,
    });
    res.json({ status: 200, data: { ok: true } });
  } catch (err) {
    // Only reaches here on true network failure (timeout, ECONNREFUSED, DNS)
    res.status(500).json({ error: 'GTB unreachable', details: err.message });
  }
});

// GET /devices?url=: proxy device list fetch
router.get('/devices', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 10000
    });
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
      const response = await axios.post(`${url}/api/control`, { zoneId, parameter, value }, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 3000
      });
      return res.json({ status: 'ok', data: response.data });
    }

    res.json({ status: 'ok', mock: true, message: `Command ${parameter}=${value} simulated successfully` });
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.json({ status: 'mock_fallback', details: err.message });
  }
});

// GET /zones?url=: proxy zones list fetch
router.get('/zones', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(`${url}/api/zones`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 5000
    });
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

    const response = await axios.get(`${url}/api/energy/live`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 5000
    });
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

    const response = await axios.get(`${url}/api/alerts`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 5000
    });
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

    const response = await axios.post(`${url}/api/alerts/${alertId}/acknowledge`, {}, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 3000
    });
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

    const response = await axios.get(`${url}/api/config`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 5000
    });
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

    const response = await axios.post(`${url}/api/config`, config, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 5000
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    res.status(status).json({ error: 'Failed to update config in GTB', details: err.message });
  }
});

// POST /zones/reset: proxy zone reset (all zones back to normal mode)
router.post('/zones/reset', async (req, res) => {
  try {
    const { url } = req.body;
    console.log('[GTB ZONES RESET] Resetting all zones to normal mode');

    if (url) {
      const response = await axios.post(`${url}/api/zones/reset`, {}, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 3000
      });
      return res.json(response.data);
    }

    res.json({ ok: true, zones_reset: 10, mock: true });
  } catch (err) {
    console.error('[GTB ZONES RESET] Error:', err.message);
    res.status(502).json({ error: 'Failed to reset zones in GTB', details: err.message });
  }
});

// POST /zones/:zoneId/mode: proxy zone mode change
router.post('/zones/:zoneId/mode', async (req, res) => {
  try {
    const { url, mode } = req.body;
    const { zoneId } = req.params;
    console.log(`[GTB ZONE MODE] Zone=${zoneId}, Mode=${mode}`);

    if (url) {
      const response = await axios.post(`${url}/api/zones/${zoneId}/mode`, { mode }, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 3000
      });
      return res.json(response.data);
    }

    res.json({ ok: true, mock: true });
  } catch (err) {
    console.error('[GTB ZONE MODE] Error:', err.message);
    res.status(502).json({ error: 'Failed to set zone mode in GTB', details: err.message });
  }
});

module.exports = router;
