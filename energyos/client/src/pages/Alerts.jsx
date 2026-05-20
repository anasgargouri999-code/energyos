import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useStore } from '../store';
import { getApiBaseUrl } from '../lib/api';
import { DEMO_ALERTS } from '../lib/demoData';
import {
  AlertCircle, AlertTriangle, Info, CheckCircle2, Check,
  ZapOff, Wrench, Phone, X, ShieldAlert, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Severity helpers ── */
const SEVERITY = {
  critical: {
    icon:    <AlertCircle className="w-4.5 h-4.5" />,
    label:   'Critique',
    color:   'text-accent-red',
    bg:      'bg-accent-red/8',
    border:  'border-accent-red/25',
    badge:   'bg-accent-red/15 text-accent-red',
  },
  warning: {
    icon:    <AlertTriangle className="w-4.5 h-4.5" />,
    label:   'Avertissement',
    color:   'text-accent-amber',
    bg:      'bg-accent-amber/8',
    border:  'border-accent-amber/25',
    badge:   'bg-accent-amber/15 text-accent-amber',
  },
  info: {
    icon:    <Info className="w-4.5 h-4.5" />,
    label:   'Info',
    color:   'text-accent-cyan',
    bg:      'bg-accent-cyan/8',
    border:  'border-accent-cyan/20',
    badge:   'bg-accent-cyan/15 text-accent-cyan',
  },
};

/* ── Technician dispatch modal ── */
function TechnicianModal({ alert, onClose }) {
  const [sent, setSent] = useState(false);

  const handleRequest = () => {
    setSent(true);
    toast.success('Technicien certifié en route — ETA 25 min. Numéro d\'intervention : #' + Math.floor(Math.random() * 9000 + 1000), { duration: 7000 });
    setTimeout(onClose, 2500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-up">
      <div className="bg-bg-surface border border-accent-red/25 rounded-2xl w-full max-w-sm p-6 shadow-card-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-red/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-accent-red" />
            </div>
            <div>
              <h3 className="font-display font-bold text-text-primary text-base">Intervention Technique</h3>
              <p className="text-xs text-text-muted mt-0.5">Electriciens certifiés partenaires</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-accent-red/8 border border-accent-red/20 rounded-xl p-3.5 mb-5">
          <p className="text-xs text-accent-red font-semibold mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Alerte associée
          </p>
          <p className="text-xs text-text-primary leading-relaxed">{alert.message}</p>
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-4 h-4 text-accent-mint flex-shrink-0" />
            <span className="text-text-primary">Technicien habilité <strong>B2V / BR</strong></span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-4 h-4 text-accent-mint flex-shrink-0" />
            <span className="text-text-primary">Intervention sous <strong>30 minutes</strong></span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-4 h-4 text-accent-mint flex-shrink-0" />
            <span className="text-text-primary">Rapport d'intervention fourni</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Info className="w-4 h-4 text-accent-amber flex-shrink-0" />
            <span className="text-text-muted">Frais d'intervention : <strong className="text-text-primary">150 TND</strong> (HT)</span>
          </div>
        </div>

        {sent ? (
          <div className="flex items-center justify-center gap-2 py-3 bg-accent-mint/10 border border-accent-mint/20 rounded-xl text-accent-mint text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Demande envoyée — technicien dispatché !
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleRequest}
              className="w-full flex items-center justify-center gap-2 bg-accent-red text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all text-sm"
            >
              <Phone className="w-4 h-4" />
              Demander une intervention sur site
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm text-text-muted border border-white/8 rounded-xl hover:bg-bg-elevated transition-colors"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Alert card ── */
function AlertCard({ alert, onAcknowledge, onRequestTech }) {
  const s = SEVERITY[alert.severity] || SEVERITY.info;
  const isBlackout = alert.type === 'blackout' || (alert.message && alert.message.includes('COUPURE'));

  return (
    <div className={`rounded-2xl border p-4 ${s.bg} ${s.border} transition-all`}>
      {/* Blackout banner */}
      {isBlackout && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-accent-red/15 rounded-xl border border-accent-red/30">
          <ZapOff className="w-4 h-4 text-accent-red flex-shrink-0 animate-pulse" />
          <span className="text-xs font-bold text-accent-red uppercase tracking-wide">
            Alerte Majeure — Coupure Secteur
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex-shrink-0 ${s.color}`}>{s.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`eco-badge ${s.badge}`}>{s.label}</span>
            <span className="text-[11px] text-text-muted font-mono">{alert.time}</span>
            <span className="text-[11px] text-text-muted truncate hidden sm:inline">• {alert.zone}</span>
          </div>
          <span className="text-xs font-semibold text-text-muted sm:hidden block mb-1">{alert.zone}</span>
          <p className="text-sm text-text-primary leading-relaxed">{alert.message}</p>
        </div>

        <button
          onClick={() => onAcknowledge(alert.id)}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/10 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Acquitter
        </button>
      </div>

      {/* Technician CTA for critical */}
      {alert.severity === 'critical' && (
        <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            Besoin d'une intervention ? Nos électriciens certifiés sont disponibles.
          </p>
          <button
            onClick={() => onRequestTech(alert)}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-accent-red/12 border border-accent-red/25 text-accent-red hover:bg-accent-red/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Wrench className="w-3.5 h-3.5" />
            Demander technicien
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function Alerts() {
  const { mode, alerts, setAlerts, addAlert, addActivity } = useStore();
  const [filter, setFilter]           = useState('Tous');
  const [techAlert, setTechAlert]     = useState(null);

  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  useEffect(() => {
    if (mode === 'demo' && safeAlerts.length === 0) {
      setAlerts(DEMO_ALERTS);
    }
  }, [mode, safeAlerts.length, setAlerts]);

  // Real-time polling: merge GTB alerts into Zustand store every 3 s
  useEffect(() => {
    if (mode === 'demo') return;
    const gtbUrl = localStorage.getItem('energyos_gtb_url');
    if (!gtbUrl) return;

    const baseUrl = getApiBaseUrl();

    const poll = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/gtb/alerts?url=${encodeURIComponent(gtbUrl)}`);
        if (!res.ok) return;
        const data = await res.json();
        const incoming = Array.isArray(data.alerts) ? data.alerts : Array.isArray(data) ? data : [];
        if (incoming.length === 0) return;

        // Merge: add any alert whose id isn't already in the store
        const currentIds = new Set(useStore.getState().alerts.map(a => a.id));
        incoming.forEach(a => {
          if (!currentIds.has(a.id)) addAlert(a);
        });
      } catch {
        // GTB unreachable — silent
      }
    };

    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [mode, addAlert]);

  const handleAcknowledge = async (id) => {
    const updated = safeAlerts.map(a => a.id === id ? { ...a, acknowledged: true } : a);
    setAlerts(updated);
    addActivity?.('alert', `Alerte acquittée : ${safeAlerts.find(a => a.id === id)?.zone || id}`);
    toast.success('Alerte acquittée');

    try {
      const gtbUrl = localStorage.getItem('energyos_gtb_url');
      if (gtbUrl) {
        const baseUrl = getApiBaseUrl();
        await fetch(`${baseUrl}/api/gtb/alerts/${id}/acknowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: gtbUrl }),
        });
      }
    } catch (err) {
      console.error('Failed to sync acknowledgement:', err);
    }
  };

  const FILTERS = ['Tous', 'Critiques', 'Avertissements', 'Info'];

  const filtered = safeAlerts.filter(a => {
    if (filter === 'Critiques')      return a.severity === 'critical';
    if (filter === 'Avertissements') return a.severity === 'warning';
    if (filter === 'Info')           return a.severity === 'info';
    return true;
  });

  const activeAlerts  = filtered.filter(a => !a.acknowledged);
  const historyAlerts = filtered.filter(a => a.acknowledged);

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Alertes" />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">

          {/* Filter pills */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-accent-mint/15 text-accent-mint border border-accent-mint/30'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent'
                }`}
              >
                {f}
                {f !== 'Tous' && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    ({safeAlerts.filter(a => {
                      if (f === 'Critiques')      return a.severity === 'critical';
                      if (f === 'Avertissements') return a.severity === 'warning';
                      if (f === 'Info')           return a.severity === 'info';
                      return true;
                    }).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active alerts */}
          <h2 className="font-display font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-accent-amber" />
            Alertes Actives
            {activeAlerts.length > 0 && (
              <span className="text-xs font-bold bg-accent-red/15 text-accent-red px-2 py-0.5 rounded-full">{activeAlerts.length}</span>
            )}
          </h2>

          <div className="space-y-3 mb-8">
            {activeAlerts.length === 0 ? (
              <div className="bg-bg-surface border border-white/6 rounded-2xl p-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-accent-mint/10 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-accent-mint" />
                </div>
                <h3 className="font-semibold text-text-primary mb-1">Aucune alerte active</h3>
                <p className="text-text-muted text-sm">Tous les systèmes fonctionnent normalement.</p>
              </div>
            ) : (
              activeAlerts.map(a => (
                <AlertCard
                  key={a.id}
                  alert={a}
                  onAcknowledge={handleAcknowledge}
                  onRequestTech={setTechAlert}
                />
              ))
            )}
          </div>

          {/* History */}
          {historyAlerts.length > 0 && (
            <>
              <h2 className="font-display font-semibold text-text-muted mb-3 text-sm uppercase tracking-wider">
                Historique ({historyAlerts.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {historyAlerts.map(a => (
                  <div key={a.id} className="bg-bg-surface border border-white/5 rounded-xl p-3.5 flex items-center gap-3">
                    <span className={`flex-shrink-0 ${(SEVERITY[a.severity] || SEVERITY.info).color} opacity-60`}>
                      {(SEVERITY[a.severity] || SEVERITY.info).icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-muted line-through">{a.message}</p>
                    </div>
                    <span className="text-[10px] text-text-subtle font-mono">{a.time}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Technician modal */}
      {techAlert && (
        <TechnicianModal alert={techAlert} onClose={() => setTechAlert(null)} />
      )}
    </div>
  );
}
