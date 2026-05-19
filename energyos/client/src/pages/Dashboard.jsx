import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import SummaryCard from '../components/dashboard/SummaryCard';
import ZoneCard from '../components/dashboard/ZoneCard';
import Skeleton from '../components/ui/Skeleton';
import SimulationControls from '../components/dashboard/SimulationControls';
import { useStore } from '../store';
import { DEMO_ZONES, DEMO_LIVE, DEMO_ALERTS, DEMO_DEVICES, MONTHLY_DATA } from '../lib/demoData';
import { autoConfigFromDevices, generateClinicalReport } from '../lib/groq';
import { isDbConfigured, fetchZonesWithDevices } from '../lib/db';
import { Zap, Activity, Battery, AlertTriangle, Cpu, X, Calendar, Clock, Plus, Trash2, Power, Brain, Sparkles, FileText, Loader2, CheckCircle2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const {
    mode,
    setMode,
    liveData,
    zones,
    alerts,
    updateLiveData,
    setZones,
    setAlerts,
    groqConfig,
    bannerDismissed,
    setBannerDismissed,
    schedules,
    addSchedule,
    toggleSchedule,
    deleteSchedule
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('realtime'); // 'realtime' | 'schedule'
  
  // AI report states
  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [autoConfigLoading, setAutoConfigLoading] = useState(false);

  // Schedule creation form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetType, setTargetType] = useState('device');
  const [targetName, setTargetName] = useState('CTA Bloc Principal');
  const [cycleAction, setCycleAction] = useState('on');
  const [cycleTime, setCycleTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']);

  const handleAutoConfig = async () => {
    setAutoConfigLoading(true);
    try {
      const config = await autoConfigFromDevices(DEMO_DEVICES, MONTHLY_DATA.baseline);
      useStore.getState().setGroqConfig(config);
      localStorage.setItem('energyos_ai_config', JSON.stringify(config));

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

      toast.success('Optimisation Auto-IA appliquée à la clinique !');
    } catch (err) {
      console.error(err);
      toast.error('Échec de la configuration IA.');
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
      toast.success('Rapport Énergétique Clinique IA généré !');
    } catch (err) {
      console.error(err);
      toast.error('Échec de la génération du rapport IA.');
      setShowReport(false);
    } finally {
      setReportLoading(false);
    }
  };

  const mapConfigToSchedules = (ecoSchedules) => {
    if (!ecoSchedules || !Array.isArray(ecoSchedules)) return [];
    const list = [];
    ecoSchedules.forEach((sch, idx) => {
      list.push({
        id: `gtb-eco-${idx}-off`,
        target: sch.zone,
        type: 'zone',
        action: 'off',
        time: sch.eco_start || '18:00',
        days: sch.days || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
        active: true
      });
      list.push({
        id: `gtb-eco-${idx}-on`,
        target: sch.zone,
        type: 'zone',
        action: 'on',
        time: sch.eco_end || '07:00',
        days: sch.days || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
        active: true
      });
    });
    return list;
  };

  const syncSchedulesToGTB = async (currentSchedules) => {
    const gtbUrl = localStorage.getItem('energyos_gtb_url');
    if (!gtbUrl) return;

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      const zonesGrouped = {};
      currentSchedules.forEach((sch) => {
        if (sch.type !== 'zone') return;
        if (!zonesGrouped[sch.target]) {
          zonesGrouped[sch.target] = {
            zone: sch.target,
            eco_start: '18:00',
            eco_end: '07:00',
            days: sch.days || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
          };
        }
        if (sch.action === 'off') {
          zonesGrouped[sch.target].eco_start = sch.time;
        } else if (sch.action === 'on') {
          zonesGrouped[sch.target].eco_end = sch.time;
        }
      });

      const ecoSchedules = Object.values(zonesGrouped);

      await fetch(`${baseUrl}/api/gtb/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: gtbUrl,
          config: {
            eco_schedules: ecoSchedules
          }
        })
      });
    } catch (err) {
      console.error('Failed to sync schedules to GTB:', err);
    }
  };

  const handleToggleSchedule = (id) => {
    toggleSchedule(id);
    setTimeout(() => {
      const updated = useStore.getState().schedules;
      syncSchedulesToGTB(updated);
    }, 50);
  };

  const handleDeleteSchedule = (id) => {
    deleteSchedule(id);
    setTimeout(() => {
      const updated = useStore.getState().schedules;
      syncSchedulesToGTB(updated);
    }, 50);
  };

  const handleAddScheduleSubmit = (e) => {
    e.preventDefault();
    if (!targetName) return;

    const newSch = {
      id: 'sch_' + Date.now(),
      target: targetName,
      type: targetType,
      action: cycleAction,
      time: cycleTime,
      days: selectedDays,
      active: true,
    };

    addSchedule(newSch);
    
    // Sync to GTB simulator
    const updatedSchedules = [...schedules, newSch];
    syncSchedulesToGTB(updatedSchedules);

    toast.success(`Planification enregistrée pour ${targetName} !`);
    setShowAddModal(false);
    // Reset form target
    setTargetName(targetType === 'device' ? 'CTA Bloc Principal' : (zones[0]?.name || ''));
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Initial loading state simulator for premium feel
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      // 1. Check for real GTB connection first!
      const gtbUrl = localStorage.getItem('energyos_gtb_url');
      if (gtbUrl) {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
          
          // Fetch zones
          const zRes = await fetch(`${baseUrl}/api/gtb/zones?url=${encodeURIComponent(gtbUrl)}`);
          if (zRes.ok) {
            const zData = await zRes.json();
            if (active && zData && zData.length > 0) {
              setZones(zData);
            }
          }
          
          // Fetch live
          const eRes = await fetch(`${baseUrl}/api/gtb/live?url=${encodeURIComponent(gtbUrl)}`);
          if (eRes.ok) {
            const eData = await eRes.json();
            if (active && eData) {
              updateLiveData(eData);
            }
          }
          
          // Fetch alerts
          const aRes = await fetch(`${baseUrl}/api/gtb/alerts?url=${encodeURIComponent(gtbUrl)}`);
          if (aRes.ok) {
            const aData = await aRes.json();
            if (active && aData) {
              setAlerts(aData);
            }
          }

          // Fetch config (schedules)
          const cRes = await fetch(`${baseUrl}/api/gtb/config?url=${encodeURIComponent(gtbUrl)}`);
          if (cRes.ok) {
            const cData = await cRes.json();
            if (active && cData && cData.eco_schedules) {
              const mapped = mapConfigToSchedules(cData.eco_schedules);
              if (mapped.length > 0) {
                useStore.setState({ schedules: mapped });
              }
            }
          }
          return;
        } catch (err) {
          console.error("Failed to load data from GTB simulation:", err);
        }
      }

      // 2. Database configuration fallback
      if (isDbConfigured()) {
        const { data, error } = await fetchZonesWithDevices();
        if (active) {
          if (data && data.length > 0) {
            setZones(data);
            if (Object.keys(liveData).length === 0) {
              updateLiveData({
                total_power_kw: data.reduce((sum, z) => sum + (z.load_kw || 0), 0) || DEMO_LIVE.total_power_kw,
                today_kwh: DEMO_LIVE.today_kwh,
                cos_phi: DEMO_LIVE.cos_phi,
                peak_kw_today: DEMO_LIVE.peak_kw_today,
                subscribed_kw: 260,
              });
            }
            if (alerts.length === 0) setAlerts(DEMO_ALERTS);
            return;
          }
        }
      }

      // 3. Demo fallback
      if (active) {
        if (zones.length === 0) setZones(DEMO_ZONES);
        if (alerts.length === 0) setAlerts(DEMO_ALERTS);
        if (Object.keys(liveData).length === 0) updateLiveData(DEMO_LIVE);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [mode, setZones, setAlerts, updateLiveData]);

  useEffect(() => {
    if (zones.length > 0) {
      const interval = setInterval(() => {
        // If a real local GTB is connected, we should poll the real simulation instead of simulating in-memory!
        const gtbUrl = localStorage.getItem('energyos_gtb_url');
        if (gtbUrl) {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
          
          // Poll zones
          fetch(`${baseUrl}/api/gtb/zones?url=${encodeURIComponent(gtbUrl)}`)
            .then(res => {
              if (res.ok) return res.json();
              throw new Error("HTTP " + res.status);
            })
            .then(data => {
              if (data && data.length > 0) setZones(data);
            })
            .catch(err => console.error("Error polling zones:", err));
            
          // Poll live energy metrics
          fetch(`${baseUrl}/api/gtb/live?url=${encodeURIComponent(gtbUrl)}`)
            .then(res => {
              if (res.ok) return res.json();
              throw new Error("HTTP " + res.status);
            })
            .then(data => {
              if (data) updateLiveData(data);
            })
            .catch(err => console.error("Error polling live data:", err));
            
          // Poll alerts
          fetch(`${baseUrl}/api/gtb/alerts?url=${encodeURIComponent(gtbUrl)}`)
            .then(res => {
              if (res.ok) return res.json();
              throw new Error("HTTP " + res.status);
            })
            .then(data => {
              if (data) setAlerts(data);
            })
            .catch(err => console.error("Error polling alerts:", err));
            
          return;
        }

        // 1. Calculate active zone load sum with dynamic load capping!
        const currentZoneLoadSum = zones.reduce((sum, zone) => {
          const capFactor = zone.load_cap !== undefined ? zone.load_cap / 100 : 1;
          const currentLoad = zone.mode === 'eco'
            ? zone.load_kw * 0.6
            : (zone.mode === 'off' ? 0.4 : zone.load_kw);
          return sum + (currentLoad * capFactor);
        }, 0);

        // 2. Check for regular 30s peak spike (lasts 5 seconds)
        const seconds = Math.floor(Date.now() / 1000);
        const isPeak = (seconds % 30) < 5;

        // 3. Compute power based on zone load + baseline + jitter or peak spike override
        let simulatedPower;
        if (isPeak) {
          simulatedPower = 130 + Math.random() * 10;
        } else {
          // Normal hours oscillation: scale zone sum + base load to swing in 80-95 kW
          const jitter = Math.sin(Date.now() / 4000) * 3 + Math.random() * 2;
          simulatedPower = currentZoneLoadSum + 12 + jitter;
          
          // Dynamically scale clamp levels based on currentZoneLoadSum relative to base normal sum (~73.3)
          const baseNormalSum = 73.3;
          const scaleRatio = currentZoneLoadSum / baseNormalSum;
          
          const minClamp = Math.max(25, 80 * scaleRatio);
          const maxClamp = Math.max(40, 95 * scaleRatio);
          
          if (simulatedPower < minClamp) simulatedPower = minClamp + Math.random() * 2;
          if (simulatedPower > maxClamp) simulatedPower = (maxClamp - 2) + Math.random() * 2;
        }

        // 4. cos phi fluctuations between 0.84 and 0.91
        const simulatedCosPhi = 0.84 + Math.random() * 0.07;

        // 5. Accumulate today's energy incrementally
        const energyIncrement = (simulatedPower / 3600) * 3; // power in kW * 3s interval

        updateLiveData({
          total_power_kw: simulatedPower,
          today_kwh: (liveData.today_kwh || DEMO_LIVE.today_kwh) + energyIncrement,
          cos_phi: simulatedCosPhi,
          peak_kw_today: Math.max(liveData.peak_kw_today || DEMO_LIVE.peak_kw_today, simulatedPower),
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [zones, liveData.today_kwh, liveData.peak_kw_today, updateLiveData]);

  const handleModeChange = async (zoneId, newMode) => {
    const updatedZones = zones.map((z) => (z.id === zoneId ? { ...z, mode: newMode } : z));
    setZones(updatedZones);
    const zoneName = zones.find((z) => z.id === zoneId)?.name;
    toast.success(`${zoneName} → mode ${newMode.toUpperCase()}`);

    try {
      const gtbUrl = localStorage.getItem('energyos_gtb_url') || 'https://oppressor-fog-unguarded.ngrok-free.dev';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      await fetch(`${baseUrl}/api/gtb/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: gtbUrl,
          zoneId: zoneId,
          parameter: 'mode',
          value: newMode
        })
      });
    } catch (err) {
      console.error('Failed to report mode change to GTB:', err);
    }
  };

  const activeAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Tableau de Bord" />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {/* Demo Mode Banner */}
          {!bannerDismissed && mode === 'demo' && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-accent-amber w-5 h-5 flex-shrink-0 animate-pulse" />
                <p className="text-text-primary text-sm font-medium">
                  Mode démo actif — données simulées pour la présentation |{' '}
                  <button
                    onClick={() => {
                      setMode('authenticated');
                      toast.success('Passage en mode Live...');
                    }}
                    className="text-accent-cyan hover:underline font-semibold"
                  >
                    Passer en mode Live →
                  </button>
                </p>
              </div>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-text-muted hover:text-text-primary transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {groqConfig && (
            <div className="mb-6 p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="text-accent-cyan w-5 h-5" />
                <p className="text-accent-cyan font-medium">Configuration IA active</p>
              </div>
              <button className="text-sm text-accent-cyan hover:underline">Voir les détails</button>
            </div>
          )}

          {loading ? (
            <>
              {/* Skeleton Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-bg-surface border border-white/5 rounded-2xl p-6 h-[120px] flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-8 rounded-xl" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-4">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Skeleton Zones Header */}
              <Skeleton className="h-6 w-48 mb-4" />

              {/* Skeleton Zones Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-bg-surface border border-white/5 rounded-2xl p-6 h-[180px] flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 my-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <SummaryCard
                  title="Puissance Totale"
                  value={liveData.total_power_kw?.toFixed(1) || '--'}
                  unit="kW"
                  icon={<Zap />}
                  trend={liveData.total_power_kw > 100 ? 'up' : 'down'}
                  trendValue={liveData.total_power_kw > 100 ? '+35%' : '-2.4%'}
                />
                <SummaryCard
                  title="Énergie Aujourd'hui"
                  value={liveData.today_kwh?.toFixed(1) || '--'}
                  unit="kWh"
                  icon={<Activity />}
                  trend="-1.2%"
                />
                <SummaryCard
                  title="Facteur de Puissance"
                  value={liveData.cos_phi?.toFixed(2) || '--'}
                  unit="cos φ"
                  icon={<Battery />}
                />
                <SummaryCard
                  title="Alertes Actives"
                  value={activeAlertsCount}
                  unit=""
                  icon={<AlertTriangle />}
                  variant={activeAlertsCount > 0 ? 'danger' : 'default'}
                />
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-white/5 mb-6">
                <button
                  onClick={() => setActiveTab('realtime')}
                  className={`px-6 py-3 font-display font-semibold text-sm border-b-2 transition-all cursor-pointer ${
                    activeTab === 'realtime'
                      ? 'border-accent-cyan text-accent-cyan'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
                >
                  Aperçu en Temps Réel
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-6 py-3 font-display font-semibold text-sm border-b-2 transition-all cursor-pointer ${
                    activeTab === 'schedule'
                      ? 'border-accent-cyan text-accent-cyan'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
                >
                  Cycles & Planification
                </button>
              </div>

              {activeTab === 'realtime' ? (
                <>
                  {/* AI Optimization Card */}
                  <div className="relative overflow-hidden bg-bg-surface border border-white/5 rounded-2xl p-6 mb-6">
                    {/* Glowing effect background */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent-cyan/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent-green/10 rounded-full blur-2xl animate-pulse pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan shrink-0">
                            <Brain className="w-5 h-5 animate-pulse" />
                          </span>
                          <h3 className="font-display font-bold text-base text-text-primary">
                            Centre d'Optimisation & Diagnostic IA
                          </h3>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-cyan/5 text-accent-cyan border border-accent-cyan/10">
                            Llama 3.1
                          </span>
                        </div>
                        <p className="text-xs text-text-muted max-w-2xl mt-1 leading-relaxed">
                          Exploitez l'intelligence artificielle pour analyser en temps réel les équipements de la Polyclinique Errachid, générer un plan de réduction d'énergie optimisé et réaliser un audit de conformité énergétique complet.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2.5 shrink-0">
                        {/* 1. Auto Config Button */}
                        <button
                          onClick={handleAutoConfig}
                          disabled={autoConfigLoading}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/20 hover:border-accent-cyan/40 transition font-semibold text-xs font-display cursor-pointer disabled:opacity-50"
                        >
                          {autoConfigLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          Optimisation Globale IA
                        </button>

                        {/* 2. AI Audit Report */}
                        <button
                          onClick={handleGenerateReport}
                          disabled={reportLoading}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-green/10 hover:bg-accent-green/20 text-accent-green border border-accent-green/20 hover:border-accent-green/40 transition font-semibold text-xs font-display cursor-pointer disabled:opacity-50"
                        >
                          {reportLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          Audit Énergétique IA
                        </button>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-xl text-text-primary font-display font-semibold mb-4">
                    Zones Monitorées
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {zones.map((zone) => (
                      <ZoneCard key={zone.id} zone={zone} onModeChange={handleModeChange} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Scheduling Section Header */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl text-text-primary font-display font-semibold">
                        Planification des Équipements
                      </h2>
                      <p className="text-xs text-text-muted mt-1">
                        Configurez des cycles d'allumage/extinction automatiques pour optimiser la consommation de la Polyclinique Errachid.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-2 bg-accent-cyan text-bg-primary font-semibold px-4 py-2 rounded-xl hover:brightness-110 transition text-sm cursor-pointer shadow-lg shadow-accent-cyan/15 font-display"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un Cycle
                    </button>
                  </div>

                  {/* Schedules grid list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schedules.map((sch) => (
                      <div key={sch.id} className="bg-bg-surface border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 transition duration-200">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                              sch.type === 'device' 
                                ? 'bg-accent-cyan/5 text-accent-cyan border-accent-cyan/10' 
                                : 'bg-accent-green/5 text-accent-green border-accent-green/10'
                            }`}>
                              {sch.type === 'device' ? 'Équipement' : 'Zone'}
                            </span>
                            <h3 className="font-semibold text-text-primary font-display text-base mt-2">
                              {sch.target}
                            </h3>
                          </div>
                          
                          {/* Toggle switch */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleSchedule(sch.id)}
                              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                sch.active ? 'bg-accent-green' : 'bg-white/10'
                              }`}
                            >
                              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-bg-primary transition-transform ${
                                sch.active ? 'translate-x-5' : ''
                              }`} />
                            </button>
                          </div>
                        </div>

                        {/* Schedule Info */}
                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-text-primary">
                              <Clock className="w-4 h-4 text-accent-cyan" />
                              <span className="font-mono font-bold text-sm">{sch.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${sch.action === 'on' ? 'bg-accent-green' : 'bg-accent-red'}`} />
                              <span className="text-xs font-semibold uppercase text-text-muted">
                                {sch.action === 'on' ? 'Allumage' : 'Extinction'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-text-muted">
                              {sch.days.join(', ')}
                            </span>
                            <button
                              onClick={() => {
                                handleDeleteSchedule(sch.id);
                                toast.success('Planification supprimée !');
                              }}
                              className="text-text-muted hover:text-accent-red transition-colors p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
                              title="Supprimer la planification"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Schedule Modal */}
              {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
                  <div className="bg-bg-surface border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in scale-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-accent-cyan animate-pulse" />
                        <span className="font-semibold text-text-primary text-sm font-display">
                          Ajouter une Planification
                        </span>
                      </div>
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleAddScheduleSubmit} className="space-y-4">
                      {/* Target Type selector */}
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                          Type de Cible
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetType('device');
                              setTargetName('CTA Bloc Principal');
                            }}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                              targetType === 'device'
                                ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20'
                                : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                            }`}
                          >
                            Équipement (Simulé)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetType('zone');
                              setTargetName(zones[0]?.name || '');
                            }}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                              targetType === 'zone'
                                ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20'
                                : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                            }`}
                          >
                            Zone (Clinique)
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Target selection list */}
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                          Nom de la Cible
                        </label>
                        <select
                          value={targetName}
                          onChange={(e) => setTargetName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-cyan transition-colors"
                        >
                          {targetType === 'device' ? (
                            <>
                              <option value="CTA Bloc Principal">CTA Bloc Principal</option>
                              <option value="Compteur STEG Principal">Compteur STEG Principal</option>
                              <option value="Chiller #1">Chiller #1</option>
                              <option value="Chiller #2">Chiller #2</option>
                              <option value="Tableau Éclairage RDC">Tableau Éclairage RDC</option>
                              <option value="Ascenseurs x4">Ascenseurs x4</option>
                            </>
                          ) : (
                            zones.map((z) => (
                              <option key={z.id} value={z.name}>
                                {z.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Action selector */}
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                          Action Programmée
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCycleAction('on')}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                              cycleAction === 'on'
                                ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
                                : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                            }`}
                          >
                            Allumage / Mode Actif
                          </button>
                          <button
                            type="button"
                            onClick={() => setCycleAction('off')}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                              cycleAction === 'off'
                                ? 'bg-accent-red/10 text-accent-red border-accent-red/20'
                                : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                            }`}
                          >
                            Extinction / Mode Veille
                          </button>
                        </div>
                      </div>

                      {/* Time selector */}
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                          Heure d'Exécution
                        </label>
                        <input
                          type="time"
                          value={cycleTime}
                          onChange={(e) => setCycleTime(e.target.value)}
                          className="w-full px-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary font-mono text-sm focus:outline-none focus:border-accent-cyan transition-colors"
                        />
                      </div>

                      {/* Days of week checklist */}
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                          Jours Applicables
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => {
                            const isSelected = selectedDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day)}
                                className={`w-9 h-9 text-xs font-semibold rounded-lg border flex items-center justify-center transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-accent-cyan text-bg-primary border-accent-cyan'
                                    : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Submit buttons */}
                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          className="flex-1 py-2.5 border border-white/10 text-text-primary text-sm font-semibold rounded-xl hover:bg-bg-elevated transition cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-accent-cyan text-bg-primary text-sm font-bold rounded-xl hover:brightness-110 transition cursor-pointer"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {/* Premium Glassmorphic AI Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-bg-surface/90 border border-white/10 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl max-h-[90vh] flex flex-col animate-in scale-in duration-300">
            {/* Cyberpunk accent lines */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-cyan via-accent-green to-accent-amber" />
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent-green/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 relative z-10">
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
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin relative z-10">
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
                <div className="space-y-6 text-left">
                  {/* Bilan Global Card */}
                  <div className="bg-bg-elevated/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-xs font-mono text-accent-green bg-accent-green/10 px-2 py-0.5 rounded border border-accent-green/20 uppercase tracking-widest">
                      Optimisé
                    </div>
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5 font-display">
                      <FileText className="w-3.5 h-3.5 text-accent-cyan" />
                      Synthèse Générale
                    </h4>
                    <p className="text-text-primary text-sm leading-relaxed font-body">
                      {reportData.bilan_global}
                    </p>
                  </div>

                  {/* Anomalies Detected */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 font-display">
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
                    <h4 className="text-xs font-bold text-accent-cyan uppercase tracking-wider flex items-center gap-1.5 font-display">
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
                        <p className="text-xs font-bold text-accent-amber uppercase tracking-wider font-display">
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
            <div className="pt-4 border-t border-white/10 mt-6 flex justify-end gap-3 relative z-10">
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
      <SimulationControls />
    </div>
  );
}
