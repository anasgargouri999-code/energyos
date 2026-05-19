import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import SummaryCard from '../components/dashboard/SummaryCard';
import ZoneCard from '../components/dashboard/ZoneCard';
import Skeleton from '../components/ui/Skeleton';
import SimulationControls from '../components/dashboard/SimulationControls';
import { useStore } from '../store';
import { DEMO_ZONES, DEMO_LIVE, DEMO_ALERTS } from '../lib/demoData';
import { isDbConfigured, fetchZonesWithDevices } from '../lib/db';
import { Zap, Activity, Battery, AlertTriangle, Cpu, X, Calendar, Clock, Plus, Trash2, Power } from 'lucide-react';
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
  
  // Schedule creation form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetType, setTargetType] = useState('device');
  const [targetName, setTargetName] = useState('CTA Bloc Principal');
  const [cycleAction, setCycleAction] = useState('on');
  const [cycleTime, setCycleTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']);

  const handleAddScheduleSubmit = (e) => {
    e.preventDefault();
    if (!targetName) return;

    addSchedule({
      id: 'sch_' + Date.now(),
      target: targetName,
      type: targetType,
      action: cycleAction,
      time: cycleTime,
      days: selectedDays,
      active: true,
    });

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
        // 1. Calculate active zone load sum
        const currentZoneLoadSum = zones.reduce((sum, zone) => {
          const currentLoad = zone.mode === 'eco'
            ? zone.load_kw * 0.6
            : (zone.mode === 'off' ? 0.4 : zone.load_kw);
          return sum + currentLoad;
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
          // Clamp normal power to 80-95 kW under standard conditions
          if (simulatedPower < 80) simulatedPower = 80 + Math.random() * 2;
          if (simulatedPower > 95) simulatedPower = 93 + Math.random() * 2;
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

  const handleModeChange = (zoneId, newMode) => {
    const updatedZones = zones.map((z) => (z.id === zoneId ? { ...z, mode: newMode } : z));
    setZones(updatedZones);
    const zoneName = zones.find((z) => z.id === zoneId)?.name;
    toast.success(`${zoneName} → mode ${newMode.toUpperCase()}`);
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
                              onClick={() => toggleSchedule(sch.id)}
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
                                deleteSchedule(sch.id);
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
      <SimulationControls />
    </div>
  );
}
