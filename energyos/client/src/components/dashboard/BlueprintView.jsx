import React, { useState } from 'react';
import { useStore } from '../../store';
import { Thermometer, Zap, Sun, ShieldCheck } from 'lucide-react';

// Floor definitions — CSS grid cols are 1-based, span within a 12-col grid
const FLOORS = [
  {
    id: 'r2', label: 'R+2',
    rows: [
      [
        { zoneId: 'z3', colStart: 1, colSpan: 7 },
        { zoneId: 'z6', colStart: 8, colSpan: 5 },
      ],
    ],
  },
  {
    id: 'r1', label: 'R+1',
    rows: [
      [
        { zoneId: 'z1', colStart: 1, colSpan: 4 },
        { zoneId: 'z2', colStart: 5, colSpan: 4 },
        { zoneId: 'z4', colStart: 9, colSpan: 4 },
      ],
      [
        { zoneId: 'z7', colStart: 1, colSpan: 4 },
        { zoneId: 'z8', colStart: 5, colSpan: 8 },
      ],
    ],
  },
  {
    id: 'rdc', label: 'RDC',
    rows: [
      [
        { zoneId: 'z9', colStart: 1, colSpan: 7 },
        { zoneId: 'z5', colStart: 8, colSpan: 5 },
      ],
    ],
  },
  {
    id: 'ss', label: 'SS',
    rows: [
      [
        { zoneId: 'z10', colStart: 1, colSpan: 12 },
      ],
    ],
  },
];

const TYPE_COLORS = {
  medical:  { accent: '#00D4FF', label: 'Médical' },
  admin:    { accent: '#F59E0B', label: 'Admin' },
  support:  { accent: '#A78BFA', label: 'Support' },
  common:   { accent: '#22C55E', label: 'Commun' },
  external: { accent: '#94A3B8', label: 'Externe' },
};

const MODE_BADGE = {
  normal: 'bg-accent-mint/15 text-accent-mint',
  eco:    'bg-accent-amber/15 text-accent-amber',
  off:    'bg-white/8 text-text-muted',
  auto:   'bg-accent-cyan/15 text-accent-cyan',
};

// Number of ceiling-light dots per column unit
const DOTS_PER_COL = 2;

function CeilingDots({ colSpan, dimmer }) {
  const count = colSpan * DOTS_PER_COL;
  const opacity = dimmer / 100;
  return (
    <div className="flex justify-around px-2 mb-2 flex-wrap gap-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full transition-all duration-500"
          style={{
            background: `rgba(255, 245, 180, ${opacity * 0.9})`,
            boxShadow: dimmer > 20
              ? `0 0 ${4 + dimmer / 20}px ${2 + dimmer / 30}px rgba(255, 245, 140, ${opacity * 0.6})`
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

function RoomCell({ zoneId, colStart, colSpan }) {
  const zones = useStore((s) => s.zones);
  const updateZoneProperty = useStore((s) => s.updateZoneProperty);

  const zone = zones.find((z) => z.id === zoneId);
  if (!zone) return null;

  const dimmer = zone.dimmer !== undefined ? zone.dimmer : 80;
  const typeInfo = TYPE_COLORS[zone.type] || TYPE_COLORS.common;
  const isOff = zone.mode === 'off';

  // Warm light glow: amber-white at top, dark navy bg
  const glowIntensity = isOff ? 0 : dimmer / 100;
  const warmColor = `rgba(255, 245, 160, ${glowIntensity * 0.22})`;
  const warmColorMid = `rgba(255, 235, 100, ${glowIntensity * 0.08})`;

  const handleDimmerChange = async (val) => {
    updateZoneProperty(zone.id, 'dimmer', val);
    const gtbUrl = localStorage.getItem('energyos_gtb_url');
    if (!gtbUrl) return;
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      await fetch(`${apiBase}/api/gtb/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: gtbUrl, zoneId: zone.id, parameter: 'dimmer', value: val }),
      });
    } catch {
      // silent — local state already updated
    }
  };

  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col transition-all duration-500"
      style={{
        gridColumnStart: colStart,
        gridColumnEnd: `span ${colSpan}`,
        minHeight: '9rem',
        background: `radial-gradient(ellipse at 50% 5%, ${warmColor}, ${warmColorMid} 40%, #020c1c 70%)`,
        borderColor: isOff ? 'rgba(255,255,255,0.06)' : `${typeInfo.accent}33`,
        boxShadow: !isOff && dimmer > 30
          ? `inset 0 0 ${20 + dimmer / 4}px 0 rgba(255,245,140,${glowIntensity * 0.12}), 0 0 ${8 + dimmer / 10}px 0 ${typeInfo.accent}22`
          : 'none',
      }}
    >
      {/* Ceiling light dots */}
      <div className="pt-2">
        <CeilingDots colSpan={colSpan} dimmer={isOff ? 0 : dimmer} />
      </div>

      {/* Room content */}
      <div className="flex-1 px-3 pb-3 flex flex-col justify-between">
        {/* Header row */}
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div className="min-w-0">
            <p className="text-[11px] font-display font-bold text-text-primary leading-tight truncate" title={zone.name}>
              {zone.name}
            </p>
            <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: typeInfo.accent }}>
              {typeInfo.label}
            </span>
          </div>
          <span className={`flex-shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${MODE_BADGE[zone.mode] || MODE_BADGE.normal}`}>
            {zone.mode}
          </span>
        </div>

        {/* Luminosity value — large, prominent */}
        <div className="flex items-baseline gap-1 mb-1">
          <span
            className="font-display font-black leading-none transition-all duration-300"
            style={{
              fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
              color: isOff ? '#334155' : `rgba(255, 245, 160, ${0.4 + glowIntensity * 0.6})`,
              textShadow: !isOff && dimmer > 40 ? `0 0 12px rgba(255,245,100,${glowIntensity * 0.7})` : 'none',
            }}
          >
            {isOff ? '0' : dimmer}
          </span>
          <span className="text-[10px] text-text-muted font-mono">%</span>
          <Sun className="w-3 h-3 ml-0.5" style={{ color: isOff ? '#334155' : `rgba(255,245,160,${0.5 + glowIntensity * 0.5})` }} />
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="flex items-center gap-0.5 text-[10px] text-text-muted font-mono">
            <Zap className="w-2.5 h-2.5 text-accent-cyan" />
            {zone.load_kw} kW
          </span>
          {zone.temp != null && (
            <span className="flex items-center gap-0.5 text-[10px] text-text-muted font-mono">
              <Thermometer className="w-2.5 h-2.5 text-accent-amber" />
              {zone.temp}°C
            </span>
          )}
          <span className="flex items-center gap-0.5 text-[10px] text-text-muted font-mono">
            <ShieldCheck className="w-2.5 h-2.5 text-text-subtle" />
            P{zone.priority}
          </span>
        </div>

        {/* Dimmer slider */}
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={isOff ? 0 : dimmer}
          disabled={isOff}
          onChange={(e) => handleDimmerChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, rgba(255,245,160,${0.6 + glowIntensity * 0.4}) ${isOff ? 0 : dimmer}%, rgba(255,255,255,0.08) ${isOff ? 0 : dimmer}%)`,
            accentColor: 'rgba(255,245,160,0.9)',
          }}
        />
      </div>
    </div>
  );
}

export default function BlueprintView() {
  const [activeFloor, setActiveFloor] = useState('r1');
  const floor = FLOORS.find((f) => f.id === activeFloor);

  return (
    <div
      className="rounded-2xl border border-white/5 overflow-hidden"
      style={{ background: '#020c1c' }}
    >
      {/* Floor selector */}
      <div className="flex items-center border-b gap-1 px-4 py-3" style={{ borderColor: 'rgba(13,56,85,0.7)' }}>
        <span className="text-[11px] uppercase tracking-widest text-text-muted font-mono mr-3">Étage</span>
        {FLOORS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFloor(f.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
              activeFloor === f.id
                ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30'
                : 'text-text-muted hover:text-text-primary border border-transparent hover:bg-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          {[
            { color: '#00D4FF', label: 'Médical' },
            { color: '#F59E0B', label: 'Admin' },
            { color: '#A78BFA', label: 'Support' },
            { color: '#22C55E', label: 'Commun' },
          ].map((t) => (
            <span key={t.label} className="flex items-center gap-1 text-[9px] text-text-muted uppercase tracking-wide">
              <span className="w-2 h-2 rounded-sm" style={{ background: t.color, opacity: 0.7 }} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Blueprint canvas */}
      <div className="p-4 space-y-3">
        {/* Floor label */}
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1" style={{ background: 'rgba(13,56,85,0.7)' }} />
          <span className="text-[10px] uppercase tracking-widest font-mono text-text-muted px-2">{floor?.label}</span>
          <div className="h-px flex-1" style={{ background: 'rgba(13,56,85,0.7)' }} />
        </div>

        {floor?.rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
          >
            {row.map((cell) => (
              <RoomCell key={cell.zoneId} {...cell} />
            ))}
          </div>
        ))}
      </div>

      {/* Legend footer */}
      <div
        className="px-4 py-2.5 border-t flex items-center gap-4 flex-wrap"
        style={{ borderColor: 'rgba(13,56,85,0.5)', background: 'rgba(2,12,28,0.8)' }}
      >
        <span className="text-[9px] text-text-subtle font-mono uppercase tracking-widest">Vue Blueprint — Polyclinique Errachid, Sfax</span>
        <div className="flex items-center gap-1 ml-auto">
          <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,245,160,0.8)', boxShadow: '0 0 4px rgba(255,245,100,0.6)' }} />
          <span className="text-[9px] text-text-muted font-mono">Éclairage actif</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white/10" />
          <span className="text-[9px] text-text-muted font-mono">Hors service</span>
        </div>
      </div>
    </div>
  );
}
