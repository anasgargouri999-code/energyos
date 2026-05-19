import React, { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Thermometer, Droplets, Zap, Cpu, ChevronDown, ChevronUp } from 'lucide-react';

export default function ZoneCard({ zone, onModeChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

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
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5" title="Humidité relative">
            <Droplets className="w-4 h-4 text-accent-cyan mb-1" />
            <span className="font-mono font-medium text-text-primary text-[13px]">{zone.humidity}% HR</span>
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

      {/* Equipment Expandable Section */}
      {zone.devices && zone.devices.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-semibold text-text-primary transition-all duration-200"
          >
            <span className="flex items-center gap-2 text-text-muted">
              <Cpu className="w-3.5 h-3.5 text-accent-cyan" />
              Équipements ({zone.devices.length})
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            )}
          </button>

          {isExpanded && (
            <div className="space-y-1.5 mt-2.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
              {zone.devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-bg-primary/40 text-[11px] hover:border-white/10 transition-all duration-150"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        device.status === 'online' ? 'bg-accent-green animate-pulse' : 'bg-text-muted/65'
                      }`}
                    />
                    <span className="font-medium text-text-primary truncate" title={device.name}>
                      {device.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] font-mono">
                    <span className="px-1 rounded bg-white/5 text-text-muted border border-white/5">
                      {device.protocol}
                    </span>
                    {device.load_rating_kw && (
                      <span className="text-accent-amber font-semibold">
                        {device.load_rating_kw} kW
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
