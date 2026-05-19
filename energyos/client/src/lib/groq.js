import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true  // OK for demo
});

export async function autoConfigFromDevices(deviceList, monthlyData) {
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
