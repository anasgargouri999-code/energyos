import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import SummaryCard from '../components/dashboard/SummaryCard';
import ZoneCard from '../components/dashboard/ZoneCard';
import Skeleton from '../components/ui/Skeleton';
import SimulationControls from '../components/dashboard/SimulationControls';
import ChatAssistant from '../components/dashboard/ChatAssistant';
import BlueprintView from '../components/dashboard/BlueprintView';
import { useStore } from '../store';
import { getApiBaseUrl } from '../lib/api';
import { DEMO_ZONES, DEMO_LIVE, DEMO_ALERTS } from '../lib/demoData';
import { generateClinicalReport } from '../lib/groq';
import { isDbConfigured, fetchZonesWithDevices } from '../lib/db';
import { Zap, Activity, Battery, AlertTriangle, X, Calendar, Clock, Plus, Trash2, Brain, FileText, Loader2, TrendingUp, ZapOff } from 'lucide-react';
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
    blackoutMode,
    schedules,
    addSchedule,
    toggleSchedule,
    deleteSchedule
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [gtbStatus, setGtbStatus] = useState('unknown'); // 'unknown' | 'live' | 'demo'
  const [activeTab, setActiveTab] = useState('realtime'); // 'realtime' | 'schedule' | 'activity' | 'blueprint'

  // AI report states
  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Schedule creation form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetType, setTargetType] = useState('device');
  const [targetName, setTargetName] = useState('');
  const [cycleAction, setCycleAction] = useState('on');
  const [cycleTime, setCycleTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setShowReport(true);
    setReportData(null);
    try {
      const data = await generateClinicalReport(zones, liveData, safeAlerts);
      setReportData(data);
      useStore.getState().addActivity('ai', 'Rapport énergétique IA généré');
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
      const baseUrl = getApiBaseUrl();

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
    const sch = schedules.find(s => s.id === id);
    useStore.getState().addActivity('schedule', `${sch?.active ? 'Désactivation' : 'Activation'} du cycle : ${sch?.target}`);
    setTimeout(() => {
      const updated = useStore.getState().schedules;
      syncSchedulesToGTB(updated);
    }, 50);
  };

  const handleDeleteSchedule = (id) => {
    const sch = schedules.find(s => s.id === id);
    useStore.getState().addActivity('schedule', `Suppression du cycle : ${sch?.target}`);
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
    useStore.getState().addActivity('schedule', `Nouveau cycle créé pour ${targetName} (${cycleTime})`);

    // Sync to GTB simulator
    const updatedSchedules = [...schedules, newSch];
    syncSchedulesToGTB(updatedSchedules);

    toast.success(`Planification enregistrée pour ${targetName} !`);
    setShowAddModal(false);
    // Reset form target
    setTargetName(targetType === 'device' ? (zones[0]?.devices?.[0]?.name || '') : (zones[0]?.name || ''));
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
      // 1. Check for real GTB connection first (skip in demo mode)
      const gtbUrl = mode !== 'demo' && localStorage.getItem('energyos_gtb_url');
      if (gtbUrl) {
        try {
          const baseUrl = getApiBaseUrl();
          let gotRealZones = false;

          // Fetch zones
          const zRes = await fetch(`${baseUrl}/api/gtb/zones?url=${encodeURIComponent(gtbUrl)}`);
          if (zRes.ok) {
            const zData = await zRes.json();
            const zonesArr = Array.isArray(zData) ? zData : (zData?.zones || []);
            if (active && zonesArr.length > 0) {
              setZones(zonesArr);
              gotRealZones = true;
            }
          }

          // Fetch live
          const eRes = await fetch(`${baseUrl}/api/gtb/live?url=${encodeURIComponent(gtbUrl)}`);
          if (eRes.ok) {
            const eData = await eRes.json();
            if (active && eData && typeof eData.total_power_kw === 'number') {
              updateLiveData(eData);
            }
          }

          // Fetch alerts
          const aRes = await fetch(`${baseUrl}/api/gtb/alerts?url=${encodeURIComponent(gtbUrl)}`);
          if (aRes.ok) {
            const aData = await aRes.json();
            if (active) {
              setAlerts(Array.isArray(aData) ? aData : (aData?.alerts || []));
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

          // Only skip demo fallback if Node-RED actually returned zones
          if (gotRealZones) {
            if (active) setGtbStatus('live');
            return;
          }

          // GTB URL set but endpoints returned no data — warn and fall through to demo
          console.warn('[EnergyOS] GTB URL set but /api/zones returned no data. Check Node-RED flow. Falling back to demo.');
          if (active) setGtbStatus('demo');
        } catch (err) {
          console.error('[EnergyOS] Failed to load data from GTB:', err.message);
          if (active) setGtbStatus('demo');
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
        setGtbStatus('demo');
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
        // Only poll GTB when confirmed live — gtbStatus in effect deps keeps closure fresh
        const gtbUrl = localStorage.getItem('energyos_gtb_url');
        if (gtbUrl && mode !== 'demo' && gtbStatus === 'live') {
          const baseUrl = getApiBaseUrl();

          // Poll zones
          fetch(`${baseUrl}/api/gtb/zones?url=${encodeURIComponent(gtbUrl)}`)
            .then(res => {
              if (res.ok) return res.json();
              throw new Error("HTTP " + res.status);
            })
            .then(data => {
              const arr = Array.isArray(data) ? data : (data?.zones || []);
              if (arr.length > 0) setZones(arr);
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
              const arr = Array.isArray(data) ? data : (data?.alerts || []);
              setAlerts(arr);
            })
            .catch(err => console.error("Error polling alerts:", err));

          return;
        }

        // Don't overwrite blackout state with simulated values
        if (useStore.getState().blackoutMode) return;

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
  }, [zones, liveData.today_kwh, liveData.peak_kw_today, updateLiveData, gtbStatus, mode]);

  const handleModeChange = async (zoneId, newMode) => {
    const prevZones = zones;
    const updatedZones = zones.map((z) => (z.id === zoneId ? { ...z, mode: newMode } : z));
    setZones(updatedZones);
    const zoneName = zones.find((z) => z.id === zoneId)?.name;

    try {
      const gtbUrl = localStorage.getItem('energyos_gtb_url') || '';
      const baseUrl = getApiBaseUrl();

      const res = await fetch(`${baseUrl}/api/gtb/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: gtbUrl,
          zoneId: zoneId,
          parameter: 'mode',
          value: newMode
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setZones(prevZones);
        toast.error(errData.error || `Impossible de changer le mode de ${zoneName}`);
        return;
      }

      toast.success(`${zoneName} → mode ${newMode.toUpperCase()}`);
      useStore.getState().addActivity('zone_mode', `Zone ${zoneName} passée en mode ${newMode.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to report mode change to GTB:', err);
      toast.success(`${zoneName} → mode ${newMode.toUpperCase()}`);
      useStore.getState().addActivity('zone_mode', `Zone ${zoneName} passée en mode ${newMode.toUpperCase()}`);
    }
  };

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const activeAlertsCount = safeAlerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Tableau de Bord" />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {/* Blackout banner */}
          {blackoutMode && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-accent-red/15 border border-accent-red/30 flex items-center gap-3 animate-pulse">
              <ZapOff className="w-5 h-5 text-accent-red flex-shrink-0" />
              <div>
                <p className="text-accent-red font-bold text-sm">COUPURE SECTEUR SIMULÉE</p>
                <p className="text-accent-red/70 text-xs">Alimentation réseau STEG interrompue — groupe électrogène en attente</p>
              </div>
            </div>
          )}

          {/* GTB connection status badge */}
          {gtbStatus === 'live' && (
            <div className="mb-4 px-4 py-2 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span className="text-accent-green font-medium">Node-RED GTB connecté — données en direct</span>
              <span className="text-text-muted text-xs ml-auto font-mono">{localStorage.getItem('energyos_gtb_url')}</span>
            </div>
          )}
          {gtbStatus === 'demo' && localStorage.getItem('energyos_gtb_url') && (
            <div className="mb-4 px-4 py-2 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-accent-amber" />
              <span className="text-accent-amber font-medium">GTB URL enregistrée mais endpoints introuvables — données démo actives</span>
              <a href="/connect" className="text-accent-cyan hover:underline text-xs ml-auto">Reconfigurer →</a>
            </div>
          )}

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
                  className={`px-6 py-3 font-display font-semibold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'realtime'
                      ? 'border-accent-cyan text-accent-cyan'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                    }`}
                >
                  Aperçu en Temps Réel
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-6 py-3 font-display font-semibold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'schedule'
                      ? 'border-accent-cyan text-accent-cyan'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                    }`}
                >
                  Cycles & Planification
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-6 py-3 font-display font-semibold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'activity'
                      ? 'border-accent-cyan text-accent-cyan'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                    }`}
                >
                  Fil d'Activité
                </button>
                <button
                  onClick={() => setActiveTab('blueprint')}
                  className={`px-6 py-3 font-display font-semibold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'blueprint'
                      ? 'border-accent-cyan text-accent-cyan'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                    }`}
                >
                  Vue Blueprint
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
                        {/* AI Audit Report */}
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
              ) : activeTab === 'schedule' ? (
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
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${sch.type === 'device'
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
                              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${sch.active ? 'bg-accent-green' : 'bg-white/10'
                                }`}
                            >
                              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-bg-primary transition-transform ${sch.active ? 'translate-x-5' : ''
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
              ) : activeTab === 'activity' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl text-text-primary font-display font-semibold">Historique d'Activité</h2>
                    <button
                      onClick={() => useStore.getState().clearActivityLog()}
                      className="text-xs text-text-muted hover:text-accent-red flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent-red/5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Effacer l'historique
                    </button>
                  </div>

                  <div className="bg-bg-surface border border-white/5 rounded-2xl overflow-hidden">
                    {useStore.getState().activityLog.length === 0 ? (
                      <div className="p-12 text-center">
                        <Activity className="w-10 h-10 text-white/5 mx-auto mb-3" />
                        <p className="text-text-muted text-sm">Aucune activité enregistrée pour le moment.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto scrollbar-thin">
                        {useStore.getState().activityLog.map((log) => (
                          <div key={log.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-4">
                            <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${log.type === 'ai' ? 'bg-accent-cyan/10 text-accent-cyan' :
                                log.type === 'zone_mode' ? 'bg-accent-mint/10 text-accent-mint' :
                                  log.type === 'schedule' ? 'bg-accent-amber/10 text-accent-amber' :
                                    log.type === 'alert' ? 'bg-accent-red/10 text-accent-red' :
                                      'bg-white/5 text-text-muted'
                              }`}>
                              {log.type === 'ai' ? <Brain className="w-4 h-4" /> :
                                log.type === 'zone_mode' ? <Zap className="w-4 h-4" /> :
                                  log.type === 'schedule' ? <Calendar className="w-4 h-4" /> :
                                    log.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> :
                                      <Activity className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary leading-snug">{log.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">{log.type}</span>
                                <span className="text-[10px] text-text-subtle opacity-50">•</span>
                                <span className="text-[10px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded italic">
                                  {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'blueprint' ? (
                <BlueprintView />
              ) : null}

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
                              setTargetName(zones[0]?.devices?.[0]?.name || '');
                            }}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${targetType === 'device'
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
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${targetType === 'zone'
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
                            zones.flatMap(z => z.devices || []).map(d => (
                              <option key={d.id} value={d.name}>{d.name}</option>
                            ))
                          ) : (
                            zones.map((z) => (
                              <option key={z.id} value={z.name}>{z.name}</option>
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
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${cycleAction === 'on'
                                ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
                                : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                              }`}
                          >
                            Allumage / Mode Actif
                          </button>
                          <button
                            type="button"
                            onClick={() => setCycleAction('off')}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${cycleAction === 'off'
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
                                className={`w-9 h-9 text-xs font-semibold rounded-lg border flex items-center justify-center transition cursor-pointer ${isSelected
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
          <div className="bg-[#fdfbf7] border border-stone-200 w-full max-w-2xl rounded-[32px] p-0 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col animate-in scale-in duration-500">
            {/* Newspaper Header Styling */}
            <div className="px-8 pt-8 pb-6 border-b-2 border-stone-800/10 text-center relative">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase">Édition Spéciale • {new Date().toLocaleDateString('fr-FR')}</span>
              </div>
              <h3 className="font-display font-black text-3xl text-stone-900 tracking-tighter uppercase italic">
                Energy<span className="text-accent-mint">OS</span> Daily Dispatch
              </h3>
              <div className="mt-2 flex items-center justify-center gap-4 text-[11px] font-serif italic text-stone-600 border-t border-stone-200 pt-2 pb-0">
                <span>Vol. 2026 No. 42</span>
                <span className="w-1 h-1 rounded-full bg-stone-300" />
                <span>Rédigé par Llama 3.1 Neural Desk</span>
              </div>

              <button
                onClick={() => setShowReport(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrolling Article Body */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-thin scrollbar-thumb-stone-200">
              {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-stone-300 animate-spin" />
                    <Brain className="w-6 h-6 text-stone-400 absolute top-3 left-3 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-serif italic text-stone-800 text-lg">Composition de l'article en cours...</p>
                    <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">Analyse du réseau Errachid</p>
                  </div>
                </div>
              ) : reportData ? (
                <div className="font-serif">
                  {/* Headline */}
                  <h1 className="text-2xl font-bold text-stone-900 leading-tight mb-6">
                    {reportData.titre || "Rapport de Situation Énergétique"}
                  </h1>

                  {/* Dateline + Lead Paragraph */}
                  <p className="text-stone-800 leading-relaxed text-lg mb-8 first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-stone-900">
                    <span className="font-bold uppercase mr-1">[SFAX, TUNISIE] —</span>
                    {reportData.bilan_global}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-t border-stone-200">
                    {/* Points Vigilance Column */}
                    <div className="space-y-4">
                      <h4 className="font-sans text-[11px] font-black uppercase tracking-[0.1em] text-accent-mint border-b border-accent-mint/20 pb-1 w-fit">Points de Vigilance</h4>
                      <div className="space-y-4">
                        {reportData.points_vigilance?.map((p, i) => (
                          <p key={i} className="text-stone-700 text-sm italic leading-relaxed">
                            "{p}"
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations Column */}
                    <div className="space-y-4">
                      <h4 className="font-sans text-[11px] font-black uppercase tracking-[0.1em] text-stone-800 border-b border-stone-800/10 pb-1 w-fit">Décisions de la Rédaction</h4>
                      <div className="space-y-3">
                        {reportData.actions_recommandees?.map((a, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="font-sans text-[9px] font-bold bg-stone-900 text-white px-1.5 py-0.5 rounded mt-0.5 shrink-0">{i + 1}</span>
                            <p className="text-stone-800 text-sm font-bold leading-snug">{a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Financial Section */}
                  <div className="mt-8 p-6 bg-stone-100 border-t-4 border-stone-800 rounded-b-lg">
                    <div className="flex items-start gap-4">
                      <TrendingUp className="w-8 h-8 text-stone-800 shrink-0" />
                      <div>
                        <h4 className="font-sans text-[11px] font-black uppercase tracking-wider text-stone-500 mb-1">Impact Financier & STEG</h4>
                        <p className="text-stone-900 text-sm leading-relaxed">{reportData.steg_impact}</p>
                      </div>
                    </div>
                  </div>

                  {/* Weather Snippet */}
                  <div className="mt-10 pt-6 border-t border-dashed border-stone-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-sans">Météo Énergie :</span>
                      <span className="font-sans font-black text-stone-900 text-xs px-2 py-1 bg-stone-200 rounded uppercase">{reportData.meteo_energie || "STABLE"}</span>
                    </div>
                    <p className="text-[10px] font-serif italic text-stone-400 font-medium">Fin de la dépêche.</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-stone-50 border-t border-stone-200 flex justify-end gap-3 rounded-b-[32px]">
              <button
                onClick={() => setShowReport(false)}
                className="px-6 py-2.5 rounded-full border-2 border-stone-800 font-bold text-stone-800 hover:bg-stone-800 hover:text-white transition-all text-xs uppercase tracking-wider"
              >
                Fermer l'édition
              </button>
            </div>
          </div>
        </div>
      )}
      <SimulationControls />
      <ChatAssistant zones={zones} liveData={liveData} alerts={alerts} />
    </div>
  );
}
