import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import SummaryCard from '../components/dashboard/SummaryCard';
import ZoneCard from '../components/dashboard/ZoneCard';
import Skeleton from '../components/ui/Skeleton';
import SimulationControls from '../components/dashboard/SimulationControls';
import { useStore } from '../store';
import { DEMO_ZONES, DEMO_LIVE, DEMO_ALERTS } from '../lib/demoData';
import { Zap, Activity, Battery, AlertTriangle, Cpu, X } from 'lucide-react';
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
  } = useStore();

  const [loading, setLoading] = useState(true);

  // Initial loading state simulator for premium feel
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mode === 'demo') {
      if (zones.length === 0) setZones(DEMO_ZONES);
      if (alerts.length === 0) setAlerts(DEMO_ALERTS);
      if (Object.keys(liveData).length === 0) updateLiveData(DEMO_LIVE);

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
  }, [mode, setZones, setAlerts, updateLiveData, zones, alerts.length, liveData.today_kwh, liveData.peak_kw_today]);

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

              <h2 className="text-xl text-text-primary font-display font-semibold mb-4">
                Zones Monitorées
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {zones.map((zone) => (
                  <ZoneCard key={zone.id} zone={zone} onModeChange={handleModeChange} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
      <SimulationControls />
    </div>
  );
}
