import React, { useState } from 'react';
import { useStore } from '../../store';
import { 
  Sliders, Flame, RefreshCw, AlertTriangle, X, 
  Brain, Sparkles, FileText, Loader2, Cpu, CheckCircle2, TrendingUp 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DEMO_ZONES, DEMO_DEVICES, MONTHLY_DATA } from '../../lib/demoData';
import { autoConfigFromDevices, generateClinicalReport } from '../../lib/groq';

export default function SimulationControls() {
  const { mode, zones, setZones, addAlert, updateLiveData, liveData, alerts, setGroqConfig, groqConfig } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // AI report states
  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // Auto config loading state
  const [autoConfigLoading, setAutoConfigLoading] = useState(false);

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
    updateLiveData({ cos_phi: 0.87 });
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

  const handleAutoConfig = async () => {
    setAutoConfigLoading(true);
    try {
      const config = await autoConfigFromDevices(DEMO_DEVICES, MONTHLY_DATA.baseline);
      setGroqConfig(config);
      localStorage.setItem('energyos_ai_config', JSON.stringify(config));

      // Optimize corresponding zones in real-time
      if (config && config.eco_schedules) {
        const updated = zones.map((z) => {
          const isEcoMatch = config.eco_schedules.some((s) =>
            s.zone.toLowerCase().includes(z.name.toLowerCase()) ||
            z.name.toLowerCase().includes(s.zone.toLowerCase())
          );
          if (isEcoMatch) {
            return { ...z, mode: 'eco' };
          }
          return z;
        });
        setZones(updated);
      }

      toast.success('Optimisation Auto-IA appliquée au tableau de bord !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la configuration IA.');
    } finally {
      setAutoConfigLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setShowReport(true);
    setReportData(null);
    try {
      const data = await generateClinicalReport(zones, liveData, alerts);
      setReportData(data);
      toast.success('Rapport Clinique IA généré !');
    } catch (err) {
      console.error(err);
      toast.error('Échec de la génération du rapport IA.');
      setShowReport(false);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
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
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Option 1: Summer Peak */}
              <button
                onClick={handleSummerPeak}
                className="w-full flex items-center justify-start gap-3 p-2.5 rounded-xl border border-accent-red/20 bg-accent-red/5 hover:bg-accent-red/10 text-text-primary text-xs transition-all text-left cursor-pointer"
              >
                <Flame className="w-4 h-4 text-accent-red flex-shrink-0" />
                <div>
                  <p className="font-semibold">Simuler pic estival</p>
                  <p className="text-[10px] text-text-muted">HVAC max + Alerte critique</p>
                </div>
              </button>

              {/* Option 2: Cos Phi Alert */}
              <button
                onClick={handleCosPhiAlert}
                className="w-full flex items-center justify-start gap-3 p-2.5 rounded-xl border border-accent-amber/20 bg-accent-amber/5 hover:bg-accent-amber/10 text-text-primary text-xs transition-all text-left cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-accent-amber flex-shrink-0" />
                <div>
                  <p className="font-semibold">Alerte cos φ</p>
                  <p className="text-[10px] text-text-muted">Pénalité STEG (0.71)</p>
                </div>
              </button>

              {/* Option 3: Auto AI Config */}
              <button
                onClick={handleAutoConfig}
                disabled={autoConfigLoading}
                className="w-full flex items-center justify-start gap-3 p-2.5 rounded-xl border border-accent-cyan/20 bg-accent-cyan/5 hover:bg-accent-cyan/10 text-text-primary text-xs transition-all text-left cursor-pointer disabled:opacity-50"
              >
                {autoConfigLoading ? (
                  <Loader2 className="w-4 h-4 text-accent-cyan animate-spin flex-shrink-0" />
                ) : (
                  <Cpu className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold">Optimisation Auto IA</p>
                  <p className="text-[10px] text-text-muted">Générer l'eco-config globale</p>
                </div>
              </button>

              {/* Option 4: AI Audit Report */}
              <button
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="w-full flex items-center justify-start gap-3 p-2.5 rounded-xl border border-accent-cyan/30 bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan text-xs transition-all text-left cursor-pointer"
              >
                <Brain className="w-4 h-4 text-accent-cyan flex-shrink-0 animate-pulse" />
                <div>
                  <p className="font-semibold">Rapport Clinique IA</p>
                  <p className="text-[10px] text-accent-cyan/80">Audit en temps réel (Groq)</p>
                </div>
              </button>

              {/* Option 5: Normal Conditions Reset */}
              <button
                onClick={handleNormal}
                className="w-full flex items-center justify-start gap-3 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-text-primary text-xs transition-all text-left cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-accent-green flex-shrink-0" />
                <div>
                  <p className="font-semibold">Retour normal</p>
                  <p className="text-[10px] text-text-muted">Réinitialiser les zones & cos φ</p>
                </div>
              </button>
            </div>
          </div>
        ) : null}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-full bg-accent-cyan text-bg-primary flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer border border-accent-cyan/20"
          title="Panneau de simulation"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      {/* Styled & Pretty AF Glassmorphism AI Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-bg-surface/90 border border-white/10 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl max-h-[90vh] flex flex-col animate-in scale-in duration-300">
            {/* Cyberpunk accent lines */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-cyan via-accent-green to-accent-amber" />
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-cyan/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent-green/10 rounded-full blur-3xl" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-text-primary flex items-center gap-2">
                    Rapport Clinique Énergétique IA
                    <Sparkles className="w-4 h-4 text-accent-cyan" />
                  </h3>
                  <p className="text-xs text-text-muted font-mono mt-0.5 uppercase tracking-widest">
                    Polyclinique Errachid • Sfax, Tunisie
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowReport(false)}
                className="text-text-muted hover:text-text-primary hover:bg-white/5 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
              {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-accent-cyan animate-spin" />
                    <Brain className="w-6 h-6 text-accent-cyan absolute animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-text-primary animate-pulse">
                      EnergyOS AI examine le réseau...
                    </p>
                    <p className="text-xs text-text-muted mt-1 max-w-sm">
                      Analyse instantanée des zones, des puissances actives et du cos φ via l'intelligence Llama 3.1
                    </p>
                  </div>
                </div>
              ) : reportData ? (
                <div className="space-y-6">
                  {/* Bilan Global Card */}
                  <div className="bg-bg-elevated/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-xs font-mono text-accent-green bg-accent-green/10 px-2 py-0.5 rounded border border-accent-green/20 uppercase tracking-widest">
                      Optimisé
                    </div>
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-accent-cyan" />
                      Synthèse Générale
                    </h4>
                    <p className="text-text-primary text-sm leading-relaxed font-body">
                      {reportData.bilan_global}
                    </p>
                  </div>

                  {/* Anomalies Detected */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-accent-amber" />
                      Analyse des Zones & Points Critiques
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reportData.analyses_zones?.map((item, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-3">
                          <span className="w-5 h-5 rounded-full bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center text-accent-amber shrink-0 font-mono text-xs font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-text-muted leading-relaxed">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Recommendations */}
                  <div className="bg-gradient-to-br from-bg-elevated to-bg-surface/50 border border-white/10 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-accent-cyan uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Recommandations Éco-Responsables
                    </h4>
                    <div className="space-y-2.5">
                      {reportData.recommandations?.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <CheckCircle2 className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
                          <p className="text-xs text-text-primary font-medium">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* STEG Financial Impact */}
                  {reportData.steg_impact && (
                    <div className="bg-accent-amber/5 border border-accent-amber/20 rounded-2xl p-4 flex gap-3 items-center">
                      <TrendingUp className="w-6 h-6 text-accent-amber shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-accent-amber uppercase tracking-wider">
                          Impact STEG Tunisie & Pénalités
                        </p>
                        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                          {reportData.steg_impact}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-text-muted">Aucune donnée disponible.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 mt-6 flex justify-end gap-3 relative">
              <button 
                onClick={() => setShowReport(false)}
                className="bg-accent-cyan text-bg-primary font-semibold px-6 py-2.5 rounded-xl hover:brightness-110 transition text-sm cursor-pointer shadow-lg shadow-accent-cyan/15 font-display"
              >
                Fermer le Rapport
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
