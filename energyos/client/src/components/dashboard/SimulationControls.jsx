import React, { useState } from 'react';
import { useStore } from '../../store';
import {
  Sliders, Flame, RefreshCw, AlertTriangle, X,
  ZapOff, Activity, Loader2, Settings2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DEMO_ZONES } from '../../lib/demoData';

const gtbPost = async (path, body) => {
  const res = await fetch(`/api/gtb${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GTB ${path} → ${res.status}`);
  return res.json();
};

export default function SimulationControls() {
  const { mode, zones, setZones, addAlert, updateLiveData, addActivity, gtbEndpoint } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);

  if (mode === null) return null;

  const timeStr = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const handleSummerPeak = async () => {
    setLoading(true);
    setActiveScenario('summer_peak');
    try {
      const updated = zones.map((z) =>
        z.type === 'medical' || z.type === 'support'
          ? { ...z, load_kw: parseFloat((z.load_kw * 2.2).toFixed(1)), temp: z.temp ? z.temp + 5 : z.temp }
          : z
      );
      setZones(updated);
      addAlert({
        id: 'sim_peak_' + Date.now(),
        severity: 'critical',
        type: 'peak',
        zone: 'Bloc Opératoire 1',
        message: 'Surcharge CVC — Pic estival : Bloc Opératoire 1 > 26°C. Températures CTA hors seuil.',
        time: timeStr(),
        acknowledged: false,
      });
      addActivity?.('sim', 'Simulation pic estival activée');
      toast('Pic estival simulé — alerte critique générée', { icon: '⚠️' });

      const effectiveUrl = gtbEndpoint || localStorage.getItem('energyos_gtb_url');
      if (effectiveUrl) {
        gtbPost('/config', {
          url: effectiveUrl,
          config: { temp_ext: 38, occupancy_pct: 98, scenario: 'summer_peak', load_override_pct: 88 },
        }).catch(() => toast.error('GTB non joignable — simulation locale uniquement'));
      }
    } finally {
      setLoading(false);
      setActiveScenario(null);
    }
  };

  const handleMajorBlackout = async () => {
    setLoading(true);
    setActiveScenario('blackout');
    try {
      const updated = zones.map((z) => ({ ...z, mode: 'off', load_kw: 0 }));
      setZones(updated);
      updateLiveData({ total_power_kw: 0, cos_phi: 0, peak_kw_today: useStore.getState().liveData.peak_kw_today });
      useStore.getState().setBlackoutMode(true);
      addAlert({
        id: 'sim_blackout_' + Date.now(),
        severity: 'critical',
        type: 'blackout',
        zone: 'Infrastructure — Tableau Principal',
        message: 'COUPURE GÉNÉRALE : Perte totale d\'alimentation réseau STEG. Groupe électrogène de secours en attente d\'activation.',
        time: timeStr(),
        acknowledged: false,
      });
      addActivity?.('sim', 'Simulation panne secteur (blackout) activée');
      toast.error('Coupure générale simulée — vérifiez les alertes !', { duration: 6000 });

      const effectiveUrl = gtbEndpoint || localStorage.getItem('energyos_gtb_url');
      if (effectiveUrl) {
        (async () => {
          try {
            await gtbPost('/config', { url: effectiveUrl, config: { emergency_stop: true, scenario: 'blackout' } });
            await gtbPost('/zones/reset', { url: effectiveUrl });
          } catch {
            toast.error('GTB non joignable — simulation locale uniquement');
          }
        })();
      }
    } finally {
      setLoading(false);
      setActiveScenario(null);
    }
  };

  const handleCosPhiAlert = async () => {
    setLoading(true);
    setActiveScenario('cos_phi');
    try {
      addAlert({
        id: 'sim_cos_' + Date.now(),
        severity: 'warning',
        type: 'cos_phi',
        zone: 'Consultations Ext. — RDC',
        message: 'Facteur de puissance dégradé — cos φ = 0.71 (seuil pénalité STEG : 0.85). Action corrective requise.',
        time: timeStr(),
        acknowledged: false,
      });
      updateLiveData({ cos_phi: 0.71 });
      addActivity?.('sim', 'Simulation alerte cos φ 0.71 activée');
      toast('Alerte cos φ simulée — φ = 0.71', { icon: '⚠️' });

      const effectiveUrl = gtbEndpoint || localStorage.getItem('energyos_gtb_url');
      if (effectiveUrl) {
        gtbPost('/config', { url: effectiveUrl, config: { temp_ext: 45 } })
          .catch(() => toast.error('GTB non joignable — simulation locale uniquement'));
      }
    } finally {
      setLoading(false);
      setActiveScenario(null);
    }
  };

  const handleTechnicianDispatch = async () => {
    setLoading(true);
    setActiveScenario('technician');
    try {
      addAlert({
        id: 'sim_tech_' + Date.now(),
        severity: 'info',
        type: 'maintenance',
        zone: 'Bloc Opératoire 2',
        message: 'INTERVENTION : Technicien dépêché pour maintenance préventive sur la CTA-04. Arrivée prévue à 14:15.',
        time: timeStr(),
        acknowledged: false,
      });
      addActivity?.('sim', 'Technicien dépêché (simulation)');
      toast.success('Technicien dépêché sur zone Bloc Opératoire 2');
      // presentation-only, no GTB state
    } finally {
      setLoading(false);
      setActiveScenario(null);
    }
  };

  const handleNormal = async () => {
    setLoading(true);
    setActiveScenario('normal');
    try {
      setZones(DEMO_ZONES);
      updateLiveData({ cos_phi: 0.87 });
      useStore.getState().setBlackoutMode(false);
      addActivity?.('sim', 'Réinitialisation conditions normales');
      toast.success('Conditions normales restaurées');

      const effectiveUrl = gtbEndpoint || localStorage.getItem('energyos_gtb_url');
      if (effectiveUrl) {
        (async () => {
          try {
            await gtbPost('/config', {
              url: effectiveUrl,
              config: {
                temp_ext: 28, occupancy_pct: 75,
                gtb_active: true, noise_enabled: true,
                emergency_stop: false, scenario: 'normal', load_override_pct: null,
              },
            });
            await gtbPost('/zones/reset', { url: effectiveUrl });
          } catch {
            toast.error('GTB non joignable — réinitialisation locale uniquement');
          }
        })();
      }
    } finally {
      setLoading(false);
      setActiveScenario(null);
    }
  };

  const SCENARIOS = [
    {
      key: 'summer_peak',
      label: 'Pic de chaleur estival',
      desc: 'HVAC max + alerte critique bloc opératoire',
      icon: <Flame className="w-4 h-4 text-accent-amber" />,
      bg: 'border-accent-amber/20 bg-accent-amber/5 hover:bg-accent-amber/10',
      fn: handleSummerPeak,
    },
    {
      key: 'blackout',
      label: 'Coupure secteur (Blackout)',
      desc: 'Panne réseau totale — groupe de secours',
      icon: <ZapOff className="w-4 h-4 text-accent-red" />,
      bg: 'border-accent-red/30 bg-accent-red/8 hover:bg-accent-red/15',
      fn: handleMajorBlackout,
    },
    {
      key: 'technician',
      label: 'Dépêcher un technicien',
      desc: 'Maintenance préventive sur zone critique',
      icon: <Activity className="w-4 h-4 text-accent-cyan" />,
      bg: 'border-accent-cyan/20 bg-accent-cyan/5 hover:bg-accent-cyan/10',
      fn: handleTechnicianDispatch,
    },
    {
      key: 'cos_phi',
      label: 'Alerte cos φ',
      desc: 'Pénalité STEG simulée (φ = 0.71)',
      icon: <AlertTriangle className="w-4 h-4 text-accent-amber" />,
      bg: 'border-accent-amber/20 bg-accent-amber/5 hover:bg-accent-amber/10',
      fn: handleCosPhiAlert,
    },
    {
      key: 'normal',
      label: 'Retour conditions normales',
      desc: 'Réinitialiser toutes les zones et métriques',
      icon: <RefreshCw className="w-4 h-4 text-accent-mint" />,
      bg: 'border-white/10 bg-white/5 hover:bg-white/10',
      fn: handleNormal,
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-bg-surface/95 border border-white/10 rounded-2xl p-4 shadow-card-lg backdrop-blur-xl w-72 mb-3 animate-fade-up">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/6">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-accent-mint" />
              <span className="font-display font-semibold text-text-primary text-sm">
                Scénarios de Simulation
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-muted hover:text-text-primary transition-colors rounded-lg p-1 hover:bg-bg-elevated cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.label}
                disabled={loading}
                onClick={() => { s.fn(); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${s.bg} ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="flex-shrink-0">
                  {loading && activeScenario === s.key
                    ? <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                    : s.icon}
                </span>
                <div>
                  <p className="font-semibold text-text-primary text-xs">{s.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-eco-lg cursor-pointer transition-all duration-200 border ${isOpen
          ? 'bg-bg-elevated text-text-primary border-white/15 scale-95'
          : 'bg-eco-gradient text-white border-transparent hover:scale-105 active:scale-95'
        }`}
        title="Scénarios de simulation"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
      </button>
    </div>
  );
}
