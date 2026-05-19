import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Thermometer, Droplets, Zap } from 'lucide-react';
// import { useEnergyStore } from '../../store/useEnergyStore';

export default function ZoneCard({ zone, onModeChange }) {
  const updateZoneMode = (id, mode) => {
    if (onModeChange) {
      onModeChange(id, mode);
    }
  };

  const displayStatus = zone.mode === 'off' ? 'off' : (zone.mode === 'eco' ? 'eco' : zone.status);

  const getStatusSeverity = (status) => {
    if (status === 'active') return 'success';
    if (status === 'inactive' || status === 'off') return 'neutral';
    if (status === 'eco') return 'info';
    return 'warning';
  };

  const modes = ['ECO', 'NORMAL', 'OFF'];

  const displayedLoad = zone.mode === 'eco' 
    ? (zone.load_kw * 0.6).toFixed(1) 
    : (zone.mode === 'off' ? '0.4' : zone.load_kw);

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <h3 className="font-display font-bold text-lg text-text-primary leading-tight">
          {zone.name}
        </h3>
        <Badge severity={getStatusSeverity(displayStatus)} className="uppercase">
          {displayStatus}
        </Badge>
      </div>

      {zone.mode !== 'off' && displayStatus !== 'inactive' ? (
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5">
            <Thermometer className="w-4 h-4 text-text-muted mb-1" />
            <span className="font-mono font-medium text-text-primary">{zone.temp}°C</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5">
            <Droplets className="w-4 h-4 text-accent-cyan mb-1" />
            <span className="font-mono font-medium text-text-primary">{zone.humidity}%</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5">
            <Zap className="w-4 h-4 text-accent-amber mb-1" />
            <span className="font-mono font-medium text-text-primary">{displayedLoad}kW</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center mb-6">
          <span className="text-text-muted text-sm italic">Zone hors tension ou en veille</span>
        </div>
      )}

      <div className="mt-auto">
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-bg-primary/50 border border-white/5">
          {modes.map((mode) => {
            const isCurrent = zone.mode.toUpperCase() === mode;
            return (
              <button
                key={mode}
                onClick={() => updateZoneMode(zone.id, mode.toLowerCase())}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-accent-cyan text-bg-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
