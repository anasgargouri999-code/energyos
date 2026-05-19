const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || 'placeholder-key',
});

// POST /auto-config: server-side Groq call (fallback if client key missing)
router.post('/auto-config', async (req, res) => {
  try {
    const { deviceList, monthlyData } = req.body;
    
    if (!deviceList || !monthlyData) {
      return res.status(400).json({ error: 'deviceList and monthlyData are required' });
    }

    const prompt = `
You are an industrial energy management AI for a medical clinic GTB system.
Given this list of connected devices and zones: ${JSON.stringify(deviceList)}
And this 12-month energy baseline (kWh per month): ${JSON.stringify(monthlyData)}

Generate a JSON configuration with:
{
  "eco_schedules": [{ "zone": string, "eco_start": "HH:MM", "eco_end": "HH:MM", "days": string[] }],
  "delestage_priority": [{ "zone": string, "priority": 1-5, "reason": string }],
  "ipe_thresholds": { "warning_kwh_per_m2": number, "critical_kwh_per_m2": number },
  "alert_settings": { "cos_phi_min": number, "overload_percent": number },
  "summary": string
}
Respond with valid JSON only. No markdown. No explanation outside the JSON.
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1024,
    });

    const content = completion.choices[0].message.content;
    const config = JSON.parse(content);

    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Erreur Groq AI auto-config', details: err.message });
  }
});

module.exports = router;
