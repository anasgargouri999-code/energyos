import React, { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useStore } from '../../store';
import { Thermometer, Droplets, Zap, Cpu, ChevronDown, ChevronUp, Sliders, Sun, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '../../lib/api';

export default function ZoneCard({ zone, onModeChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGtbExpanded, setIsGtbExpanded] = useState(false);
  const [sendingControl, setSendingControl] = useState(null);
  
  const updateZoneProperty = useStore((state) => state.updateZoneProperty);

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

  const thermostat = zone.temp || 22;
  const dimmer = zone.dimmer !== undefined ? zone.dimmer : 80;
  const loadCap = zone.load_cap !== undefined ? zone.load_cap : 100;

  const baseLoad = zone.mode === 'eco' 
    ? zone.load_kw * 0.6 
    : (zone.mode === 'off' ? 0.4 : zone.load_kw);
  const displayedLoad = (baseLoad * (loadCap / 100)).toFixed(1);

  const handleControlChange = async (param, value) => {
    const storeKey = param === 'temp' ? 'temp' : param === 'dimmer' ? 'dimmer' : 'load_cap';
    // Always update local state immediately for responsive UI
    updateZoneProperty(zone.id, storeKey, value);
    setSendingControl(param);

    const gtbUrl = localStorage.getItem('energyos_gtb_url');
    if (!gtbUrl) {
      // Demo/offline mode — local update is enough
      setTimeout(() => setSendingControl(null), 400);
      return;
    }

    try {
      const apiBase = getApiBaseUrl();
      await fetch(`${apiBase}/api/gtb/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: gtbUrl, zoneId: zone.id, parameter: param, value }),
      });
    } catch (err) {
      console.error('[ZoneCard] GTB control error:', err.message);
    } finally {
      setTimeout(() => setSendingControl(null), 400);
    }
  };

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

      {/* Direct GTB Control Panel */}
      <div className="mb-4">
        <button
          onClick={() => setIsGtbExpanded(!isGtbExpanded)}
          className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-semibold text-text-primary transition-all duration-200"
        >
          <span className="flex items-center gap-2 text-text-muted">
            <Sliders className="w-3.5 h-3.5 text-accent-cyan" />
            Contrôle GTB Direct
          </span>
          {isGtbExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </button>

        {isGtbExpanded && (
          <div className="space-y-4 mt-3.5 p-3 rounded-xl border border-white/5 bg-bg-primary/40 text-xs text-text-primary space-y-3.5">
            {/* Thermostat Setting */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-text-muted font-medium">
                  <Thermometer className="w-3.5 h-3.5 text-accent-cyan" />
                  Consigne Thermique
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  thermostat < 21 ? 'bg-accent-cyan/10 text-accent-cyan' : 'bg-accent-red/10 text-accent-red'
                }`}>
                  {thermostat}°C
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="16"
                  max="28"
                  value={thermostat}
                  onChange={(e) => handleControlChange('temp', parseInt(e.target.value))}
                  className="flex-1 accent-accent-cyan bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                />
                {sendingControl === 'temp' && <Loader2 className="w-3.5 h-3.5 text-accent-cyan animate-spin" />}
              </div>
            </div>

            {/* Lighting Dimmer Setting */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-text-muted font-medium">
                  <Sun className={`w-3.5 h-3.5 transition-colors ${dimmer > 50 ? 'text-accent-amber' : 'text-text-muted'}`} />
                  Gradation Éclairage
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-amber/10 text-accent-amber">
                  {dimmer}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={dimmer}
                  onChange={(e) => handleControlChange('dimmer', parseInt(e.target.value))}
                  className="flex-1 accent-accent-amber bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                />
                {sendingControl === 'dimmer' && <Loader2 className="w-3.5 h-3.5 text-accent-amber animate-spin" />}
              </div>
            </div>

            {/* Load Shedding Capping Setting */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-text-muted font-medium">
                  <Zap className="w-3.5 h-3.5 text-accent-green" />
                  Limite de Puissance
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-green/10 text-accent-green">
                  {loadCap}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={loadCap}
                  onChange={(e) => handleControlChange('load_cap', parseInt(e.target.value))}
                  className="flex-1 accent-accent-green bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                />
                {sendingControl === 'load_cap' && <Loader2 className="w-3.5 h-3.5 text-accent-green animate-spin" />}
              </div>
            </div>
          </div>
        )}
      </div>

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
