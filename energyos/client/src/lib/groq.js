import Groq from 'groq-sdk';

export async function autoConfigFromDevices(deviceList, monthlyData) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || 'placeholder-key';
  
  const groq = new Groq({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true  // OK for demo
  });

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

  return JSON.parse(completion.choices[0].message.content);
}

export async function generateClinicalReport(zones, liveData, alerts) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || 'placeholder-key';
  
  const groq = new Groq({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  const prompt = `
You are the lead EnergyOS Medical Clinic Energy Analyst.
Analyze the current live status of "Polyclinique Errachid" in Sfax, Tunisie:
- Zones Status: ${JSON.stringify(zones.map(z => ({ name: z.name, mode: z.mode, temp: z.temp, load_kw: z.load_kw })))}
- Live Power: ${liveData.total_power_kw?.toFixed(1)} kW (Peak: ${liveData.peak_kw_today?.toFixed(1)} kW)
- Today's Energy: ${liveData.today_kwh?.toFixed(1)} kWh
- Power Factor (cos φ): ${liveData.cos_phi?.toFixed(2)}
- Active Unread Alerts: ${JSON.stringify(alerts.filter(a => !a.acknowledged).map(a => ({ severity: a.severity, msg: a.message, zone: a.zone })))}

Generate a highly professional, highly specific, clinical energy audit report in French.
Include:
1. "BILAN_GLOBAL": A one-paragraph executive summary about the clinic's instant performance.
2. "ANALYSES_ZONES": 2 bullet points highlighting specific optimization opportunities or anomalies in operational zones (e.g. medical vs administrative zones).
3. "RECOMMANDATIONS": 3 actionable step recommendations for the clinical operations manager to immediately save energy or resolve alerts (e.g. load-shedding priority or power factor cos_phi correction).

Respond with valid JSON only in this format (do not return any markdown or commentary outside the JSON):
{
  "bilan_global": string,
  "analyses_zones": string[],
  "recommandations": string[],
  "steg_impact": string
}
`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.5,
    max_tokens: 1024,
  });

  return JSON.parse(completion.choices[0].message.content);
}
