import React, { useState } from 'react';
import { useStore } from '../../store';
import { Sliders, Flame, RefreshCw, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEMO_ZONES } from '../../lib/demoData';

export default function SimulationControls() {
  const { mode, zones, setZones, addAlert, updateLiveData } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  if (mode !== 'demo') return null;

  const handleSummerPeak = () => {
    const updated = zones.map((z) => {
      if (z.type === 'medical' || z.type === 'support') {
        return {
          ...z,
          load_kw: parseFloat((z.load_kw * 2.2).toFixed(1)),
          temp: z.temp ? z.temp + 5 : z.temp,
        };
      }
      return z;
    });
    setZones(updated);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    addAlert({
      id: 'sim_peak_' + Date.now(),
      severity: 'critical',
      zone: 'Bloc Opératoire 1',
      message: 'Surcharge CVC / Pic de chaleur estival : Bloc Opératoire 1 > 26°C',
      time: timeStr,
      acknowledged: false,
    });

    toast.success('Simulation pic estival activée !');
  };

  const handleNormal = () => {
    setZones(DEMO_ZONES);
    toast.success('Retour aux conditions normales.');
  };

  const handleCosPhiAlert = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    addAlert({
      id: 'sim_cos_' + Date.now(),
      severity: 'warning',
      zone: 'Consultations Ext. — RDC',
      message: 'Facteur de puissance critique cos φ = 0.71 (seuil de pénalité STEG : 0.85)',
      time: timeStr,
      acknowledged: false,
    });

    // Temporarily degrade simulated cos_phi in liveData
    updateLiveData({ cos_phi: 0.71 });
    toast.success('Alerte Cos Phi simulée !');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-bg-surface/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md w-72 mb-4 animate-in slide-in-from-bottom-8 duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent-cyan" />
              <span className="font-semibold text-text-primary text-sm font-display">
                Contrôles de Simulation
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSummerPeak}
              className="w-full flex items-center justify-start gap-3 p-3 rounded-xl border border-accent-red/20 bg-accent-red/5 hover:bg-accent-red/10 text-text-primary text-sm transition-all"
            >
              <Flame className="w-4 h-4 text-accent-red flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">Simuler pic estival</p>
                <p className="text-xs text-text-muted mt-0.5">HVAC max + Alerte critique</p>
              </div>
            </button>

            <button
              onClick={handleCosPhiAlert}
              className="w-full flex items-center justify-start gap-3 p-3 rounded-xl border border-accent-amber/20 bg-accent-amber/5 hover:bg-accent-amber/10 text-text-primary text-sm transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-accent-amber flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">Alerte cos φ</p>
                <p className="text-xs text-text-muted mt-0.5">Pénalité STEG (0.71)</p>
              </div>
            </button>

            <button
              onClick={handleNormal}
              className="w-full flex items-center justify-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-text-primary text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4 text-accent-green flex-shrink-0 animate-spin-hover" />
              <div className="text-left">
                <p className="font-semibold">Retour normal</p>
                <p className="text-xs text-text-muted mt-0.5">Réinitialiser les zones</p>
              </div>
            </button>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-accent-cyan text-bg-primary flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer ml-auto border border-accent-cyan/20"
        title="Simulation Controls"
      >
        <Sliders className="w-5 h-5" />
      </button>
    </div>
  );
}
