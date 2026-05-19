import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, LogOut, Users, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Copy, RefreshCw, Lock,
  Plus, X, Key, Mail, Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/* ────────────────────── helpers ────────────────────── */

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-secret': localStorage.getItem('admin_secret') || '',
  };
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_MAP = {
  pending: { label: 'En attente', severity: 'warning' },
  approved: { label: 'Approuvé', severity: 'success' },
  rejected: { label: 'Rejeté', severity: 'danger' },
};

/* ────────────────── Auth Gate Modal ────────────────── */

function AuthGate({ onAuthenticated }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!secret.trim()) {
      setError(true);
      return;
    }
    localStorage.setItem('admin_secret', secret.trim());
    onAuthenticated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md mx-4">
        {/* Glow effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 bg-accent-cyan/5 rounded-full blur-3xl" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative bg-bg-surface border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-accent-cyan/10 rounded-xl">
              <Lock className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary font-display">
                EnergyOS Admin
              </h1>
              <p className="text-sm text-text-muted">
                Entrez le secret administrateur
              </p>
            </div>
          </div>

          <div>
            <input
              id="admin-secret-input"
              type="password"
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setError(false); }}
              placeholder="Secret administrateur..."
              autoFocus
              className={`w-full px-4 py-3 bg-bg-elevated border rounded-xl text-text-primary placeholder:text-text-muted font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan/40 transition ${
                error ? 'border-accent-red' : 'border-white/10'
              }`}
            />
            {error && (
              <p className="mt-2 text-sm text-accent-red">
                Veuillez entrer un secret valide
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-accent-cyan text-bg-primary font-semibold rounded-xl hover:brightness-110 transition"
          >
            Accéder au panneau admin
          </button>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────── Stat Card ──────────────────── */

function StatCard({ icon: Icon, label, value, color, loading }) {
  const colorClasses = {
    cyan: 'text-accent-cyan bg-accent-cyan/10',
    amber: 'text-accent-amber bg-accent-amber/10',
    green: 'text-accent-green bg-accent-green/10',
    red: 'text-accent-red bg-accent-red/10',
  };

  return (
    <div className="bg-bg-surface border border-white/5 rounded-2xl p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-text-muted">{label}</p>
        {loading ? (
          <Skeleton className="h-7 w-12 mt-1" />
        ) : (
          <p className="text-2xl font-bold text-text-primary font-mono">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ────────────────── Expanded Row ────────────────── */

function ExpandedRow({ request }) {
  return (
    <tr>
      <td colSpan={7} className="px-6 py-4 bg-bg-elevated/50 border-b border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-muted">Téléphone :</span>
            <span className="ml-2 text-text-primary font-mono">
              {request.phone || '—'}
            </span>
          </div>
          <div>
            <span className="text-text-muted">Pays :</span>
            <span className="ml-2 text-text-primary">
              {request.country || '—'}
            </span>
          </div>
          {request.message && (
            <div className="sm:col-span-2">
              <span className="text-text-muted">Message :</span>
              <p className="mt-1 text-text-primary bg-bg-primary/50 rounded-xl p-3 border border-white/5">
                {request.message}
              </p>
            </div>
          )}
          {request._generatedCode && (
            <div className="sm:col-span-2">
              <span className="text-text-muted">Code généré :</span>
              <span className="ml-2 text-accent-cyan font-mono font-bold text-lg">
                {request._generatedCode}
              </span>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─────────────── Table Skeleton ─────────────── */

function TableSkeleton({ rows = 5, cols = 7 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-6 py-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  ));
}

/* ══════════════════ MAIN COMPONENT ══════════════════ */

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(
    () => !!localStorage.getItem('admin_secret')
  );
  const [requests, setRequests] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // request_id being acted on

  // Manual code generation states
  const [showGenModal, setShowGenModal] = useState(false);
  const [genClinicName, setGenClinicName] = useState('');
  const [genEmail, setGenEmail] = useState('');
  const [genAccessLevel, setGenAccessLevel] = useState('standard');
  const [genCustomCode, setGenCustomCode] = useState('');
  const [genLoading, setGenLoading] = useState(false);

  async function handleGenerateManualCode(e) {
    e.preventDefault();
    if (!genClinicName.trim() || !genEmail.trim()) {
      toast.error('Veuillez remplir les champs obligatoires.');
      return;
    }
    setGenLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/generate-code`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          clinic_name: genClinicName.trim(),
          email: genEmail.trim(),
          access_level: genAccessLevel,
          custom_code: genCustomCode.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur serveur');
      }

      const data = await res.json();
      toast.success(`Code ${data.code} généré avec succès !`);
      
      // Reset form
      setGenClinicName('');
      setGenEmail('');
      setGenAccessLevel('standard');
      setGenCustomCode('');
      setShowGenModal(false);

      // Reload
      fetchCodes();
    } catch (err) {
      toast.error(err.message || 'Impossible de générer le code');
    } finally {
      setGenLoading(false);
    }
  }

  /* ── Fetch data ── */

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/requests`, {
        headers: adminHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('admin_secret');
          setAuthenticated(false);
          toast.error('Secret admin invalide');
          return;
        }
        throw new Error('Erreur serveur');
      }
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      toast.error('Impossible de charger les demandes');
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const fetchCodes = useCallback(async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/codes`, {
        headers: adminHeaders(),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setCodes(data.codes || []);
    } catch (err) {
      toast.error('Impossible de charger les codes');
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchRequests();
      fetchCodes();
    }
  }, [authenticated, fetchRequests, fetchCodes]);

  /* ── Actions ── */

  async function handleApprove(requestId) {
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ request_id: requestId }),
      });
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      toast.success(`Code envoyé à ${data.email}`);
      // Mark the generated code on the request for display
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: 'approved', _generatedCode: data.code }
            : r
        )
      );
      fetchCodes();
    } catch (err) {
      toast.error("Erreur lors de l'approbation");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(requestId) {
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/reject`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ request_id: requestId }),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success('Demande rejetée');
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: 'rejected' } : r
        )
      );
    } catch (err) {
      toast.error('Erreur lors du rejet');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevoke(codeId) {
    setActionLoading(codeId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/revoke`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ code_id: codeId }),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success('Code révoqué');
      setCodes((prev) =>
        prev.map((c) => (c.id === codeId ? { ...c, active: false } : c))
      );
    } catch (err) {
      toast.error('Erreur lors de la révocation');
    } finally {
      setActionLoading(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin_secret');
    setAuthenticated(false);
    setRequests([]);
    setCodes([]);
  }

  /* ── Stats ── */

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  /* ── Auth Gate ── */

  if (!authenticated) {
    return <AuthGate onAuthenticated={() => setAuthenticated(true)} />;
  }

  /* ── Main Layout ── */

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-40 bg-bg-surface/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-cyan/10 rounded-lg">
              <Shield className="w-5 h-5 text-accent-cyan" />
            </div>
            <h1 className="text-lg font-bold text-text-primary font-display">
              EnergyOS Admin
            </h1>
          </div>
          <button
            id="admin-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total demandes"
            value={stats.total}
            color="cyan"
            loading={loadingRequests}
          />
          <StatCard
            icon={Clock}
            label="En attente"
            value={stats.pending}
            color="amber"
            loading={loadingRequests}
          />
          <StatCard
            icon={CheckCircle}
            label="Approuvées"
            value={stats.approved}
            color="green"
            loading={loadingRequests}
          />
          <StatCard
            icon={XCircle}
            label="Rejetées"
            value={stats.rejected}
            color="red"
            loading={loadingRequests}
          />
        </div>

        {/* ─── Requests Table ─── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary font-display">
              Demandes d'accès
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGenModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent-cyan text-bg-primary font-semibold rounded-xl hover:brightness-110 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Générer un Code
              </button>
              <button
                id="refresh-requests-btn"
                onClick={() => { fetchRequests(); fetchCodes(); }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-accent-cyan border border-white/10 rounded-xl hover:bg-bg-elevated transition"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>

          <div className="bg-bg-surface border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Date', 'Nom', 'Clinique', 'Email', 'Pays', 'Statut', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loadingRequests ? (
                    <TableSkeleton rows={5} cols={7} />
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                        Aucune demande pour le moment
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => {
                      const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.pending;
                      const isExpanded = expandedRow === req.id;
                      const isActing = actionLoading === req.id;

                      return (
                        <React.Fragment key={req.id}>
                          <tr
                            className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                            onClick={() =>
                              setExpandedRow(isExpanded ? null : req.id)
                            }
                          >
                            <td className="px-6 py-4 text-text-muted whitespace-nowrap font-mono text-xs">
                              {formatDate(req.created_at)}
                            </td>
                            <td className="px-6 py-4 text-text-primary font-medium whitespace-nowrap">
                              {req.full_name}
                            </td>
                            <td className="px-6 py-4 text-text-primary whitespace-nowrap">
                              {req.clinic_name}
                            </td>
                            <td className="px-6 py-4 text-text-muted whitespace-nowrap font-mono text-xs">
                              {req.email}
                            </td>
                            <td className="px-6 py-4 text-text-muted whitespace-nowrap">
                              {req.country || 'Tunisie'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge severity={statusInfo.severity}>
                                {statusInfo.label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {req.status === 'pending' && (
                                  <>
                                    <button
                                      id={`approve-${req.id}`}
                                      onClick={() => handleApprove(req.id)}
                                      disabled={isActing}
                                      className="px-3 py-1.5 text-xs font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-lg hover:bg-accent-green/20 transition disabled:opacity-50"
                                    >
                                      {isActing ? '...' : 'Approuver'}
                                    </button>
                                    <button
                                      id={`reject-${req.id}`}
                                      onClick={() => handleReject(req.id)}
                                      disabled={isActing}
                                      className="px-3 py-1.5 text-xs font-semibold bg-accent-red/10 text-accent-red border border-accent-red/20 rounded-lg hover:bg-accent-red/20 transition disabled:opacity-50"
                                    >
                                      Rejeter
                                    </button>
                                  </>
                                )}
                                {req.status !== 'pending' && (
                                  <span className="text-xs text-text-subtle">—</span>
                                )}
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-text-muted" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-text-muted" />
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <ExpandedRow key={`exp-${req.id}`} request={req} />
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── Active Codes Table ─── */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary font-display mb-4">
            Codes d'accès
          </h2>

          <div className="bg-bg-surface border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Code', 'Clinique', 'Email', 'Niveau', 'Créé le', 'Expire le', 'Actif', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loadingCodes ? (
                    <TableSkeleton rows={3} cols={8} />
                  ) : codes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                        Aucun code émis
                      </td>
                    </tr>
                  ) : (
                    codes.map((code) => {
                      const isActing = actionLoading === code.id;
                      return (
                        <tr
                          key={code.id}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-accent-cyan text-sm">
                                {code.code}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(code.code);
                                  toast.success('Code copié');
                                }}
                                className="p-1 text-text-muted hover:text-accent-cyan transition"
                                title="Copier le code"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-primary whitespace-nowrap">
                            {code.clinic_name || '—'}
                          </td>
                          <td className="px-6 py-4 text-text-muted whitespace-nowrap font-mono text-xs">
                            {code.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge severity="info">{code.access_level || 'standard'}</Badge>
                          </td>
                          <td className="px-6 py-4 text-text-muted whitespace-nowrap font-mono text-xs">
                            {formatDate(code.created_at)}
                          </td>
                          <td className="px-6 py-4 text-text-muted whitespace-nowrap font-mono text-xs">
                            {formatDate(code.expires_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge severity={code.active ? 'success' : 'danger'}>
                              {code.active ? 'Actif' : 'Révoqué'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {code.active ? (
                              <button
                                id={`revoke-${code.id}`}
                                onClick={() => handleRevoke(code.id)}
                                disabled={isActing}
                                className="px-3 py-1.5 text-xs font-semibold bg-accent-red/10 text-accent-red border border-accent-red/20 rounded-lg hover:bg-accent-red/20 transition disabled:opacity-50"
                              >
                                {isActing ? '...' : 'Révoquer'}
                              </button>
                            ) : (
                              <span className="text-xs text-text-subtle">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        {/* Manual Code Generation Modal */}
        {showGenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-bg-surface border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in scale-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-5">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-accent-cyan animate-pulse" />
                  <span className="font-semibold text-text-primary text-sm font-display">
                    Générer un Code d'Accès
                  </span>
                </div>
                <button
                  onClick={() => setShowGenModal(false)}
                  className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGenerateManualCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Nom de la Clinique *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      required
                      value={genClinicName}
                      onChange={(e) => setGenClinicName(e.target.value)}
                      placeholder="Ex: Polyclinique Errachid"
                      className="w-full pl-10 pr-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-cyan transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Adresse Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      required
                      value={genEmail}
                      onChange={(e) => setGenEmail(e.target.value)}
                      placeholder="Ex: admin@errachid.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-cyan transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Niveau d'Accès
                  </label>
                  <select
                    value={genAccessLevel}
                    onChange={(e) => setGenAccessLevel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-cyan transition-colors"
                  >
                    <option value="standard">Standard (Tableau de Bord)</option>
                    <option value="admin">Administrateur (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Code d'accès Personnalisé (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={genCustomCode}
                    onChange={(e) => setGenCustomCode(e.target.value)}
                    placeholder="Ex: ECO-2026 (Laisser vide pour auto)"
                    className="w-full px-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary font-mono placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-cyan transition-colors"
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    Si vide, le système génère un code sécurisé unique de 8 caractères.
                  </p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="flex-1 py-2.5 border border-white/10 text-text-primary text-sm font-semibold rounded-xl hover:bg-bg-elevated transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={genLoading}
                    className="flex-1 py-2.5 bg-accent-cyan text-bg-primary text-sm font-bold rounded-xl hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Générer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
