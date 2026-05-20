import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, LogOut, Clock, ChevronDown, ChevronUp, Copy,
  RefreshCw, Lock, Plus, X, Key, Mail, Building, UserCheck,
  Sun, Home, Building2, Sprout, Factory, Phone, MapPin,
  CheckCircle2, AlertCircle, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/* ── helpers ── */
function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-secret': localStorage.getItem('admin_secret') || '',
  };
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_MAP = {
  pending: { label: 'En attente', severity: 'warning' },
  approved: { label: 'Approuvé', severity: 'success' },
  rejected: { label: 'Rejeté', severity: 'danger' },
};

const CLEARANCE_COLORS = {
  full_access: 'bg-accent-mint/15 text-accent-mint border border-accent-mint/30',
  schedule_only: 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30',
  devices_only: 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30',
  read_only: 'bg-white/10 text-text-muted border border-white/15',
  standard: 'bg-accent-mint/15 text-accent-mint border border-accent-mint/30',
  admin: 'bg-accent-red/15 text-accent-red border border-accent-red/30',
};

/* ── Solar request status config ── */
const SOLAR_STATUS = {
  pending:   { label: 'Nouvelle',   color: 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30' },
  contacted: { label: 'Contacté',   color: 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30' },
  quoted:    { label: 'Devis envoyé', color: 'bg-accent-sky/15 text-accent-sky border border-accent-sky/30' },
  installed: { label: 'Installé',   color: 'bg-accent-mint/15 text-accent-mint border border-accent-mint/30' },
  cancelled: { label: 'Annulé',     color: 'bg-accent-red/15 text-accent-red border border-accent-red/30' },
};

const SOLAR_TYPE_LABEL = {
  home: 'Résidentiel', hospital: 'Hôpital/Clinique',
  agriculture: 'Agriculture', commercial: 'Commercial', other: 'Autre',
};

/* ══════════════════════════════════════════
   AUTH GATE
══════════════════════════════════════════ */
function AuthGate({ onAuthenticated }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!secret.trim()) { setError(true); return; }
    localStorage.setItem('admin_secret', secret.trim());
    onAuthenticated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-accent-mint/5 rounded-full blur-3xl" />
      </div>
      <form onSubmit={handleSubmit}
        className="relative bg-bg-surface border border-white/10 rounded-2xl p-8 space-y-6 shadow-card-lg w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-accent-mint/10 rounded-xl">
            <Lock className="w-6 h-6 text-accent-mint" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-display">EnergyOS Admin</h1>
            <p className="text-sm text-text-muted">Entrez le secret administrateur</p>
          </div>
        </div>
        <input
          type="password" value={secret} autoFocus
          onChange={(e) => { setSecret(e.target.value); setError(false); }}
          placeholder="Secret administrateur..."
          className={`eco-input w-full font-mono text-sm ${error ? 'border-accent-red' : ''}`}
        />
        {error && <p className="text-sm text-accent-red -mt-2">Veuillez entrer un secret valide</p>}
        <button type="submit"
          className="w-full py-3 bg-eco-gradient text-white font-semibold rounded-xl hover:opacity-90 transition">
          Accéder au panneau admin
        </button>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, color, loading, sub }) {
  const colorMap = {
    mint: 'text-accent-mint bg-accent-mint/10',
    amber: 'text-accent-amber bg-accent-amber/10',
    cyan: 'text-accent-cyan bg-accent-cyan/10',
    red: 'text-accent-red bg-accent-red/10',
    sage: 'text-accent-sage bg-accent-sage/10',
  };
  return (
    <div className="eco-card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl flex-shrink-0 ${colorMap[color] || colorMap.mint}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-text-muted mb-0.5">{label}</p>
        {loading ? <Skeleton className="h-7 w-12 mt-1" /> :
          <p className="text-2xl font-bold text-text-primary font-mono">{value}</p>
        }
        {sub && <p className="text-[10px] text-text-subtle mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   EXPANDED REQUEST ROW
══════════════════════════════════════════ */
function ExpandedRow({ request }) {
  return (
    <tr>
      <td colSpan={7} className="px-6 py-4 bg-bg-elevated/50 border-b border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-text-muted">Téléphone :</span>
            <span className="ml-2 text-text-primary font-mono">{request.phone || '—'}</span></div>
          <div><span className="text-text-muted">Pays :</span>
            <span className="ml-2 text-text-primary">{request.country || '—'}</span></div>
          {request.message && (
            <div className="sm:col-span-2">
              <span className="text-text-muted">Message :</span>
              <p className="mt-1 text-text-primary bg-bg-primary/50 rounded-xl p-3 border border-white/5">{request.message}</p>
            </div>
          )}
          {request._generatedCode && (
            <div className="sm:col-span-2 flex items-center gap-3">
              <span className="text-text-muted">Code généré :</span>
              <span className="text-accent-mint font-mono font-bold text-lg">{request._generatedCode}</span>
              <button onClick={() => { navigator.clipboard.writeText(request._generatedCode); toast.success('Copié'); }}
                className="p-1 text-text-muted hover:text-accent-mint">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function TableSkeleton({ rows = 5, cols = 7 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full max-w-[120px]" /></td>
      ))}
    </tr>
  ));
}

/* ══════════════════════════════════════════
   TAB: SOLAIRE (Solar Requests)
══════════════════════════════════════════ */
function TabSolaire({ requests, loading, onRefresh, onStatusChange }) {
  const [expanding, setExpanding] = useState(null);

  const typeIcon = { home: <Home className="w-3.5 h-3.5" />, hospital: <Building2 className="w-3.5 h-3.5" />, agriculture: <Sprout className="w-3.5 h-3.5" />, commercial: <Factory className="w-3.5 h-3.5" />, other: <Package className="w-3.5 h-3.5" /> };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-text-primary flex items-center gap-2">
            <Sun className="w-5 h-5 text-accent-amber" /> Demandes Solaires
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Demandes reçues depuis la page /solar</p>
        </div>
        <button onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-accent-mint border border-white/10 rounded-xl hover:bg-bg-elevated transition cursor-pointer">
          <RefreshCw className="w-4 h-4" />Actualiser
        </button>
      </div>

      <div className="eco-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Date', 'Nom', 'Email', 'Type', 'Panneaux', 'Coût estimé', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton rows={4} cols={8} /> :
                requests.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                    <Sun className="w-8 h-8 mx-auto mb-2 text-accent-amber opacity-40" />
                    Aucune demande solaire pour le moment
                  </td></tr>
                ) : requests.map(req => {
                  const st = SOLAR_STATUS[req.status] || SOLAR_STATUS.pending;
                  const isExp = expanding === req.id;
                  return (
                    <React.Fragment key={req.id}>
                      <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3.5 text-text-muted font-mono text-xs whitespace-nowrap">{formatDate(req.created_at)}</td>
                        <td className="px-4 py-3.5">
                          <div className="text-text-primary font-medium text-sm">{req.full_name}</div>
                          {req.phone && <div className="text-text-muted font-mono text-[10px] flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{req.phone}</div>}
                        </td>
                        <td className="px-4 py-3.5 text-text-muted font-mono text-xs whitespace-nowrap">{req.email}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                            {typeIcon[req.request_type] || typeIcon.other}
                            {SOLAR_TYPE_LABEL[req.request_type] || req.request_type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-sm font-bold text-accent-amber whitespace-nowrap">
                          {req.panels_estimate ? `${req.panels_estimate} ` : '—'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-sm text-text-primary whitespace-nowrap">
                          {req.estimated_cost ? `${req.estimated_cost.toLocaleString('fr-FR')} TND` : '—'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={req.status}
                              onChange={e => onStatusChange(req.id, e.target.value)}
                              className="text-[11px] bg-bg-elevated border border-white/10 rounded-lg px-2 py-1 text-text-muted font-semibold cursor-pointer hover:border-accent-mint/30 transition"
                            >
                              {Object.entries(SOLAR_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setExpanding(isExp ? null : req.id)}
                              className="p-1 text-text-muted hover:text-accent-mint transition">
                              {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExp && (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 bg-bg-elevated/40 border-b border-white/5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                              {req.address && <div><span className="text-text-muted text-xs">Adresse :</span><p className="text-text-primary mt-0.5">{req.address}</p></div>}
                              {req.monthly_steg_bill && <div><span className="text-text-muted text-xs">Facture STEG :</span><p className="text-accent-amber font-mono font-bold mt-0.5">{req.monthly_steg_bill} TND/mois</p></div>}
                              {req.monthly_consumption_kwh && <div><span className="text-text-muted text-xs">Consommation :</span><p className="text-accent-cyan font-mono font-bold mt-0.5">{req.monthly_consumption_kwh} kWh/mois</p></div>}
                              {req.message && (
                                <div className="col-span-2 sm:col-span-3">
                                  <span className="text-text-muted text-xs">Message :</span>
                                  <p className="mt-1 text-text-primary bg-bg-primary/50 rounded-xl p-3 border border-white/5 text-sm">{req.message}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   GENERATE CODE MODAL
══════════════════════════════════════════ */
function GenCodeModal({ onClose, onSuccess }) {
  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('standard');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!clinicName.trim() || !email.trim()) { toast.error('Champs obligatoires manquants'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/generate-code`, {
        method: 'POST', headers: adminHeaders(),
        body: JSON.stringify({ clinic_name: clinicName.trim(), email: email.trim(), access_level: accessLevel, custom_code: customCode.trim() || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erreur serveur'); }
      const data = await res.json();
      toast.success(`Code ${data.code} généré !`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Impossible de générer le code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-md shadow-card-lg">
        <div className="flex items-center justify-between p-5 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-accent-mint animate-pulse" />
            <span className="font-display font-bold text-text-primary">Générer un Code d'Accès</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Nom de la Clinique *</label>
            <div className="relative">
              <Building className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input type="text" required value={clinicName} onChange={e => setClinicName(e.target.value)}
                placeholder="Polyclinique Errachid" className="eco-input w-full pl-10 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Adresse Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@errachid.com" className="eco-input w-full pl-10 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Niveau d'Accès</label>
            <select value={accessLevel} onChange={e => setAccessLevel(e.target.value)} className="eco-input w-full text-sm">
              <option value="standard">Standard — Tableau de Bord complet</option>
              <option value="admin">Administrateur — Super Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Code Personnalisé (Optionnel)</label>
            <input type="text" value={customCode} onChange={e => setCustomCode(e.target.value)}
              placeholder="ECO-2026 (laisser vide pour auto)" className="eco-input w-full text-sm font-mono" />
            <p className="text-[10px] text-text-subtle mt-1">Vide = code sécurisé de 8 caractères généré automatiquement.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-white/10 text-text-primary text-sm font-semibold rounded-xl hover:bg-bg-elevated transition">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-eco-gradient text-white text-sm font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Générer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: DEMANDES
══════════════════════════════════════════ */
function TabDemandes({ requests, loading, actionLoading, expandedRow, setExpandedRow, onApprove, onReject, onRefresh, onGenCode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-text-primary">Demandes d'accès</h2>
        <div className="flex gap-2">
          <button onClick={onGenCode}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-eco-gradient text-white font-semibold rounded-xl hover:opacity-90 transition cursor-pointer">
            <Plus className="w-4 h-4" />Générer un Code
          </button>
          <button onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-accent-mint border border-white/10 rounded-xl hover:bg-bg-elevated transition cursor-pointer">
            <RefreshCw className="w-4 h-4" />Actualiser
          </button>
        </div>
      </div>
      <div className="eco-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Date', 'Nom', 'Clinique', 'Email', 'Pays', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton rows={5} cols={7} /> :
                requests.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-text-muted">Aucune demande pour le moment</td></tr>
                ) : requests.map(req => {
                  const si = STATUS_MAP[req.status] || STATUS_MAP.pending;
                  const isExp = expandedRow === req.id;
                  const isAct = actionLoading === req.id;
                  return (
                    <React.Fragment key={req.id}>
                      <tr className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                        onClick={() => setExpandedRow(isExp ? null : req.id)}>
                        <td className="px-5 py-3.5 text-text-muted font-mono text-xs whitespace-nowrap">{formatDate(req.created_at)}</td>
                        <td className="px-5 py-3.5 text-text-primary font-medium whitespace-nowrap">{req.full_name}</td>
                        <td className="px-5 py-3.5 text-text-primary whitespace-nowrap">{req.clinic_name}</td>
                        <td className="px-5 py-3.5 text-text-muted font-mono text-xs whitespace-nowrap">{req.email}</td>
                        <td className="px-5 py-3.5 text-text-muted whitespace-nowrap">{req.country || 'Tunisie'}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Badge severity={si.severity}>{si.label}</Badge>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            {req.status === 'pending' && (<>
                              <button onClick={() => onApprove(req.id)} disabled={isAct}
                                className="px-2.5 py-1 text-xs font-semibold bg-accent-mint/10 text-accent-mint border border-accent-mint/20 rounded-lg hover:bg-accent-mint/20 transition disabled:opacity-50">
                                {isAct ? '...' : 'Approuver'}
                              </button>
                              <button onClick={() => onReject(req.id)} disabled={isAct}
                                className="px-2.5 py-1 text-xs font-semibold bg-accent-red/10 text-accent-red border border-accent-red/20 rounded-lg hover:bg-accent-red/20 transition disabled:opacity-50">
                                Rejeter
                              </button>
                            </>)}
                            {req.status !== 'pending' && <span className="text-xs text-text-subtle">—</span>}
                            {isExp ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                          </div>
                        </td>
                      </tr>
                      {isExp && <ExpandedRow key={`exp-${req.id}`} request={req} />}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   TAB: CODES
══════════════════════════════════════════ */
function TabCodes({ codes, loading, actionLoading, onRevoke, onGenCode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-text-primary italic">Registres d'Accès</h2>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Contrôle des privilèges et jetons GTB</p>
        </div>
        <button onClick={onGenCode}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-eco-gradient text-white font-bold rounded-xl hover:opacity-90 transition cursor-pointer shadow-eco">
          <Key className="w-3.5 h-3.5" />Générer un Jeton
        </button>
      </div>
      <div className="eco-card overflow-hidden border-stone-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                {['Clé', 'Établissement', 'Email', 'Clearance', 'Émis le', 'Expire le', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-[0.1em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton rows={3} cols={8} /> :
                codes.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-text-muted italic">Aucun registre trouvé</td></tr>
                ) : codes.map(code => {
                  const isAct = actionLoading === code.id;
                  return (
                    <tr key={code.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-accent-cyan text-sm">{code.code}</span>
                          <button onClick={() => { navigator.clipboard.writeText(code.code); toast.success('Code copié'); }}
                            className="p-1 text-stone-300 hover:text-accent-cyan transition">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-stone-700 font-medium whitespace-nowrap">{code.clinic_name || '—'}</td>
                      <td className="px-5 py-3.5 text-stone-400 font-mono text-[11px] whitespace-nowrap">{code.email}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${CLEARANCE_COLORS[code.access_level] || CLEARANCE_COLORS.standard}`}>
                          {code.access_level?.replace('_', ' ') || 'standard'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-stone-400 font-mono text-[11px] whitespace-nowrap">{formatDateShort(code.created_at)}</td>
                      <td className="px-5 py-3.5 text-stone-400 font-mono text-[11px] whitespace-nowrap">{formatDateShort(code.expires_at)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Badge severity={code.active ? 'success' : 'danger'}>{code.active ? 'Actif' : 'Révoqué'}</Badge>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {code.active ? (
                          <button onClick={() => onRevoke(code.id)} disabled={isAct}
                            className="px-2.5 py-1 text-[11px] font-bold bg-stone-100 text-stone-500 border border-stone-200 rounded hover:bg-accent-red hover:text-white hover:border-accent-red transition disabled:opacity-50">
                            {isAct ? '...' : 'Révoquer'}
                          </button>
                        ) : <span className="text-xs text-text-subtle">—</span>}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   TAB: CLIENTS
══════════════════════════════════════════ */
function TabClients({ codes, requests, loading }) {
  const clients = codes.filter(c => c.active).map(c => ({
    id: c.id,
    name: c.clinic_name || '—',
    email: c.email,
    level: c.access_level || 'standard',
    since: c.created_at,
    expires: c.expires_at,
    code: c.code,
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-text-primary">
          Clients actifs
          <span className="ml-2 text-xs font-normal text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full">{clients.length}</span>
        </h2>
      </div>

      {clients.length === 0 ? (
        <div className="eco-card p-12 flex flex-col items-center text-center">
          <UserCheck className="w-10 h-10 text-text-muted mb-3" />
          <p className="text-text-muted text-sm">Aucun client actif pour le moment.</p>
          <p className="text-text-subtle text-xs mt-1">Générez et distribuez des codes d'accès pour voir vos clients ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(c => (
            <div key={c.id} className="eco-card p-5 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-eco-gradient flex items-center justify-center text-white font-bold text-base">
                  {(c.name || '?')[0].toUpperCase()}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CLEARANCE_COLORS[c.level] || CLEARANCE_COLORS.standard}`}>
                  {c.level}
                </span>
              </div>
              <h3 className="font-display font-semibold text-text-primary text-sm mb-0.5">{c.name}</h3>
              <p className="text-xs text-text-muted font-mono mb-3">{c.email}</p>
              <div className="border-t border-white/6 pt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Code</span>
                  <span className="font-mono font-bold text-accent-mint">{c.code}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Client depuis</span>
                  <span className="text-text-primary">{formatDateShort(c.since)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Expiration</span>
                  <span className="text-text-primary">{formatDateShort(c.expires)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(() => !!localStorage.getItem('admin_secret'));
  const [activeTab, setActiveTab] = useState('demandes');

  // Server data
  const [requests, setRequests] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Solar requests
  const [solarRequests, setSolarRequests] = useState([]);
  const [loadingSolar, setLoadingSolar] = useState(true);

  // Modals
  const [showGenModal, setShowGenModal] = useState(false);

  /* ── API calls ── */
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/requests`, { headers: adminHeaders() });
      if (res.status === 401) { localStorage.removeItem('admin_secret'); setAuthenticated(false); toast.error('Secret admin invalide'); return; }
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch { toast.error('Impossible de charger les demandes'); }
    finally { setLoadingRequests(false); }
  }, []);

  const fetchCodes = useCallback(async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/codes`, { headers: adminHeaders() });
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setCodes(data.codes || []);
    } catch { toast.error('Impossible de charger les codes'); }
    finally { setLoadingCodes(false); }
  }, []);

  const fetchSolarRequests = useCallback(async () => {
    setLoadingSolar(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/solar-requests`, { headers: adminHeaders() });
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setSolarRequests(data.requests || []);
    } catch { toast.error('Impossible de charger les demandes solaires'); }
    finally { setLoadingSolar(false); }
  }, []);

  async function handleSolarStatusChange(id, status) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/solar-requests/${id}/status`, {
        method: 'PATCH', headers: adminHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Erreur');
      setSolarRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toast.success(`Statut mis à jour : ${SOLAR_STATUS[status]?.label}`);
    } catch { toast.error('Erreur lors de la mise à jour du statut'); }
  }

  useEffect(() => {
    if (authenticated) { fetchRequests(); fetchCodes(); fetchSolarRequests(); }
  }, [authenticated, fetchRequests, fetchCodes, fetchSolarRequests]);

  async function handleApprove(requestId) {
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ request_id: requestId }) });
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      toast.success(`Code envoyé à ${data.email}`);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved', _generatedCode: data.code } : r));
      fetchCodes();
    } catch { toast.error("Erreur lors de l'approbation"); }
    finally { setActionLoading(null); }
  }

  async function handleReject(requestId) {
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/reject`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ request_id: requestId }) });
      if (!res.ok) throw new Error('Erreur');
      toast.success('Demande rejetée');
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
    } catch { toast.error('Erreur lors du rejet'); }
    finally { setActionLoading(null); }
  }

  async function handleRevoke(codeId) {
    setActionLoading(codeId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/revoke`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ code_id: codeId }) });
      if (!res.ok) throw new Error('Erreur');
      toast.success('Code révoqué');
      setCodes(prev => prev.map(c => c.id === codeId ? { ...c, active: false } : c));
    } catch { toast.error('Erreur lors de la révocation'); }
    finally { setActionLoading(null); }
  }

  function handleLogout() {
    localStorage.removeItem('admin_secret');
    setAuthenticated(false);
    setRequests([]); setCodes([]); setSolarRequests([]);
  }

  /* ── Stats ── */
  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    clients: codes.filter(c => c.active).length,
    solarNew: solarRequests.filter(r => r.status === 'pending').length,
    solarTotal: solarRequests.length,
  };

  if (!authenticated) return <AuthGate onAuthenticated={() => setAuthenticated(true)} />;

  const TABS = [
    { id: 'demandes', label: 'Demandes', count: stats.pending },
    { id: 'codes', label: 'Codes' },
    { id: 'clients', label: 'Clients', count: stats.clients },
    { id: 'solaire', label: 'Solaire', count: stats.solarNew },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-bg-surface/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-eco-gradient flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold text-text-primary font-display">EnergyOS Admin</h1>
            <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-red/15 text-accent-red border border-accent-red/20">
              SUPER ADMIN
            </span>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 rounded-xl transition cursor-pointer">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ─── Stats ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Demandes en attente" value={stats.pending} color="amber" loading={loadingRequests} />
          <StatCard icon={UserCheck} label="Clients actifs" value={stats.clients} color="mint" loading={loadingCodes} />
          <StatCard icon={Sun} label="Demandes solaires" value={stats.solarNew} color="amber" loading={loadingSolar} sub="nouvelles" />
          <StatCard icon={Package} label="Total solaire" value={stats.solarTotal} color="cyan" loading={loadingSolar} />
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-1 bg-bg-surface border border-white/6 rounded-2xl p-1.5 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === t.id
                  ? 'bg-eco-gradient text-white shadow-eco'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                }`}>
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.id ? 'bg-white/20 text-white' : 'bg-accent-mint/15 text-accent-mint'
                  }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        {activeTab === 'demandes' && (
          <TabDemandes
            requests={requests} loading={loadingRequests}
            actionLoading={actionLoading} expandedRow={expandedRow}
            setExpandedRow={setExpandedRow}
            onApprove={handleApprove} onReject={handleReject}
            onRefresh={() => { fetchRequests(); fetchCodes(); }}
            onGenCode={() => setShowGenModal(true)}
          />
        )}
        {activeTab === 'codes' && (
          <TabCodes
            codes={codes} loading={loadingCodes}
            actionLoading={actionLoading} onRevoke={handleRevoke}
            onGenCode={() => setShowGenModal(true)}
          />
        )}
        {activeTab === 'clients' && (
          <TabClients codes={codes} requests={requests} loading={loadingCodes} />
        )}
        {activeTab === 'solaire' && (
          <TabSolaire
            requests={solarRequests} loading={loadingSolar}
            onRefresh={fetchSolarRequests}
            onStatusChange={handleSolarStatusChange}
          />
        )}
      </main>

      {showGenModal && (
        <GenCodeModal
          onClose={() => setShowGenModal(false)}
          onSuccess={() => fetchCodes()}
        />
      )}
    </div>
  );
}
