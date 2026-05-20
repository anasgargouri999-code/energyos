import Groq from 'groq-sdk';

function getGroq() {
  return new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY || 'placeholder-key',
    dangerouslyAllowBrowser: true,
  });
}

function safeParse(raw, fallbackField = 'summary') {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        [fallbackField]: raw,
        titre: 'Édition Spéciale',
        bilan_global: raw.slice(0, 500) + '...',
        actions_recommandees: ['Vérifier la configuration du système'],
        meteo_energie: 'INCONNUE',
        is_fallback: true,
      };
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { [fallbackField]: raw, titre: 'Erreur de format AI', is_fallback: true };
  }
}

export async function autoConfigFromDevices(deviceList, monthlyData) {
  const groq = getGroq();

  const prompt = `COMMAND: Return ONLY valid JSON.
CONTEXT: Medical clinic GTB system in Sfax, Tunisia. Goal: reduce overnight and off-hours energy waste.
DATA: Devices: ${JSON.stringify(deviceList)}, Baseline kWh: ${JSON.stringify(monthlyData)}.

Generate eco schedules prioritizing: lighting dimming at night (22:00–06:00), HVAC setback for non-medical zones, admin/external zone shutdown after working hours.

REQUIRED JSON SCHEMA:
{
  "eco_schedules": [{ "zone": string, "eco_start": "HH:MM", "eco_end": "HH:MM", "days": string[], "action": "dim_30"|"off"|"eco", "reason": string }],
  "delestage_priority": [{ "zone": string, "priority": 1-5, "reason": string }],
  "ipe_thresholds": { "warning_kwh_per_m2": number, "critical_kwh_per_m2": number },
  "alert_settings": { "cos_phi_min": number, "overload_percent": number },
  "summary": string
}`;

  const res = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a JSON-only generator for energy management. Never output text outside JSON braces.' },
      { role: 'user', content: prompt },
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.1,
    max_tokens: 1200,
  });

  return safeParse(res.choices[0].message.content, 'summary');
}

export async function generateClinicalReport(zones, liveData, alerts) {
  const groq = getGroq();

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const activeAlerts = safeAlerts.filter(a => !a.acknowledged);

  const isBlackout =
    liveData?.total_power_kw === 0 ||
    activeAlerts.some(a => a.type === 'blackout');

  const hasCritical = activeAlerts.some(a => a.severity === 'critical');
  const statusHint = isBlackout
    ? 'CRITIQUE — COUPURE SECTEUR TOTALE DETECTEE'
    : hasCritical
    ? 'ATTENTION — ALERTE CRITIQUE ACTIVE'
    : 'STABLE';

  const alertSummary = activeAlerts.length > 0
    ? activeAlerts.map(a => `[${a.severity?.toUpperCase()}] ${a.zone}: ${a.message?.slice(0, 80)}`).join(' | ')
    : 'Aucune alerte active';

  const prompt = `Tu es le correspondant énergie de la Polyclinique Errachid à Sfax.
Génère un rapport énergétique au format JSON uniquement.

DONNÉES SYSTÈME EN TEMPS RÉEL :
- Puissance réseau : ${isBlackout ? '0 kW — COUPURE SECTEUR TOTALE' : `${liveData.total_power_kw?.toFixed(1)} kW`}
- Pic journalier : ${liveData.peak_kw_today?.toFixed(1)} kW
- Énergie consommée aujourd'hui : ${liveData.today_kwh?.toFixed(1)} kWh
- Facteur de puissance : ${liveData.cos_phi?.toFixed(2)}
- Alertes actives (${activeAlerts.length}) : ${alertSummary}
- Zones : ${JSON.stringify(zones.map(z => ({ nom: z.name, mode: z.mode, type: z.type })))}
- STATUT SYSTÈME ESTIMÉ : ${statusHint}

INSTRUCTIONS :
- Si COUPURE SECTEUR (puissance = 0), meteo_energie DOIT être "CRITIQUE"
- Si alertes critiques actives, meteo_energie DOIT être "ATTENTION" ou "CRITIQUE"
- Le rapport doit refléter EXACTEMENT l'état réel décrit ci-dessus

SCHEMA JSON REQUIS :
{
  "titre": "Un titre court et accrocheur style journal",
  "bilan_global": "2-3 phrases narratives sur la situation actuelle",
  "ce_qui_a_change": "Analyse narrative de l'évolution par rapport à la normale",
  "points_vigilance": ["Phrase de vigilance 1", "Phrase de vigilance 2"],
  "actions_recommandees": ["Verbe d'action + détail 1", "Action 2", "Action 3"],
  "steg_impact": "Impact financier ou technique résumé en une phrase",
  "meteo_energie": "STABLE | ATTENTION | CRITIQUE"
}`;

  const res = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are a JSON-only energy analyst. Content inside JSON fields must be professional French narrative (newspaper style), but the envelope must be strict JSON. Always set meteo_energie to CRITIQUE when power = 0 or blackout is detected.',
      },
      { role: 'user', content: prompt },
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.4,
    max_tokens: 1400,
  });

  return safeParse(res.choices[0].message.content, 'bilan_global');
}

export async function chatWithAssistant(messages, context) {
  const groq = getGroq();

  const systemPrompt = `Tu es l'assistant IA GTB de la Polyclinique Errachid à Sfax, Tunisie.
Tu analyses les données énergétiques en temps réel du Système GTB (Gestion Technique du Bâtiment).

ÉTAT ACTUEL DU SYSTÈME :
- Puissance totale : ${context.power} kW ${context.isBlackout ? '(COUPURE SECTEUR)' : ''}
- Énergie aujourd'hui : ${context.energy} kWh
- Facteur de puissance : ${context.cosPhi}
- Alertes non acquittées : ${context.alertCount}
- Zones actives : ${context.zoneSummary}

Réponds de manière concise et professionnelle en français. Pas d'emojis. Maximum 3 phrases par réponse sauf si l'utilisateur demande un rapport détaillé.
Si la question sort du domaine énergétique ou clinique, indique poliment que tu es spécialisé en gestion énergétique du bâtiment.`;

  const res = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.text })),
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.6,
    max_tokens: 500,
  });

  return res.choices[0].message.content;
}
