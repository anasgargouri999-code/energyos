import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useStore } from '../store';
import {
  LogOut, Globe, Key, ShieldAlert, Code, Plus, X, Copy,
  Activity, Leaf, Clock, Zap, Calendar, AlertTriangle,
  Users, Lock, Eye, Edit3, Settings as SettingsIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const CLEARANCE_LEVELS = [
  {
    value: 'full_access',
    label: 'Accès complet',
    desc:  'Toutes les fonctionnalités — tableau de bord, planification, alertes, paramètres.',
    icon:  <ShieldAlert className="w-4 h-4" />,
    color: 'text-accent-mint',
    bg:    'bg-accent-mint/10 border-accent-mint/25',
  },
  {
    value: 'schedule_only',
    label: 'Planification uniquement',
    desc:  'Peut gérer les cycles et plannings d\'équipements. Lecture seule pour le reste.',
    icon:  <Calendar className="w-4 h-4" />,
    color: 'text-accent-cyan',
    bg:    'bg-accent-cyan/10 border-accent-cyan/25',
  },
  {
    value: 'devices_only',
    label: 'Contrôle des équipements',
    desc:  'Peut changer les modes des zones (normal/eco/off). Pas de planification.',
    icon:  <Zap className="w-4 h-4" />,
    color: 'text-accent-amber',
    bg:    'bg-accent-amber/10 border-accent-amber/25',
  },
  {
    value: 'read_only',
    label: 'Lecture seule',
    desc:  'Consultation du tableau de bord et des alertes uniquement. Aucune action.',
    icon:  <Eye className="w-4 h-4" />,
    color: 'text-text-muted',
    bg:    'bg-bg-elevated border-white/10',
  },
];

const ACTIVITY_ICONS = {
  zone_mode: <Zap className="w-3.5 h-3.5 text-accent-cyan" />,
  schedule:  <Calendar className="w-3.5 h-3.5 text-accent-mint" />,
  alert:     <AlertTriangle className="w-3.5 h-3.5 text-accent-amber" />,
  ai:        <Leaf className="w-3.5 h-3.5 text-accent-sage" />,
  auth:      <Lock className="w-3.5 h-3.5 text-accent-amber" />,
  sim:       <SettingsIcon className="w-3.5 h-3.5 text-accent-cyan" />,
  system:    <Code className="w-3.5 h-3.5 text-text-muted" />,
};

function formatRelTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)   return 'À l\'instant';
  if (mins < 60)  return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours}h`;
  return new Date(isoStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/* ── Manager Code Generation Modal ── */
function CodeGenModal({ onClose }) {
  const [name, setName]         = useState('');
  const [clearance, setClearance] = useState('schedule_only');
  const [expiry, setExpiry]     = useState('30');
  const [generated, setGenerated] = useState(null);

  const handleGenerate = () => {
    if (!name.trim()) { toast.error('Entrez un nom pour identifier ce code.'); return; }
    const prefix = { full_access: 'FULL', schedule_only: 'SCH', devices_only: 'DEV', read_only: 'READ' }[clearance];
    const code = `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    setGenerated(code);
    toast.success(`Code ${code} généré — partagez-le avec votre collaborateur.`);
  };

  const handleCopy = () => {
    if (generated) {
      navigator.clipboard.writeText(generated);
      toast.success('Code copié !');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-card-lg animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-mint/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-accent-mint" />
            </div>
            <div>
              <h3 className="font-display font-bold text-text-primary">Générer un code d'accès</h3>
              <p className="text-xs text-text-muted">Pour un collaborateur ou technicien</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-bg-elevated transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Nom / Rôle du collaborateur</label>
            <input
              type="text"
              placeholder="Ex : Technicien HVAC, Comptable..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="eco-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Niveau d'accès</label>
            <div className="grid grid-cols-1 gap-2">
              {CLEARANCE_LEVELS.map(lvl => (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => setClearance(lvl.value)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    clearance === lvl.value ? lvl.bg : 'bg-bg-elevated border-white/6 hover:bg-bg-surface'
                  }`}
                >
                  <span className={`mt-0.5 ${clearance === lvl.value ? lvl.color : 'text-text-muted'}`}>{lvl.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${clearance === lvl.value ? lvl.color : 'text-text-primary'}`}>{lvl.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{lvl.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Expiration</label>
            <select
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              className="eco-input"
            >
              <option value="7">7 jours</option>
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
              <option value="365">1 an</option>
            </select>
          </div>

          {generated ? (
            <div className="bg-accent-mint/10 border border-accent-mint/25 rounded-xl p-4">
              <p className="text-xs text-accent-mint font-semibold mb-2 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Code généré
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono font-bold text-xl text-text-primary tracking-widest">{generated}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-accent-mint/15 text-accent-mint hover:bg-accent-mint/25 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copier
                </button>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Expire dans {expiry} jours · Niveau : <strong className="text-text-primary">{CLEARANCE_LEVELS.find(l => l.value === clearance)?.label}</strong>
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 bg-eco-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-eco"
            >
              <Plus className="w-4 h-4" />
              Générer le code
            </button>
          )}

          <button onClick={onClose} className="w-full py-2.5 text-sm text-text-muted border border-white/8 rounded-xl hover:bg-bg-elevated transition-colors">
            {generated ? 'Fermer' : 'Annuler'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Settings Page ── */
export default function Settings() {
  const navigate = useNavigate();
  const {
    mode, gtbEndpoint, accessCode,
    setMode, setAccessCode, setGtbEndpoint, setZones, setAlerts, updateLiveData, setGroqConfig,
    activityLog, clearActivityLog, theme, toggleTheme,
  } = useStore();

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeTab, setActiveTab]         = useState('account');

  const TABS = [
    { id: 'account',   label: 'Compte & Connexion', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'access',    label: 'Codes d\'accès',      icon: <Users className="w-4 h-4" /> },
    { id: 'activity',  label: 'Journal d\'activité', icon: <Activity className="w-4 h-4" /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    setMode(null);
    setAccessCode(null);
    setGtbEndpoint(null);
    setZones([]);
    setAlerts([]);
    updateLiveData({});
    setGroqConfig(null);
    navigate('/onboarding');
  };

  const maskedCode = accessCode ? `${accessCode.slice(0, 4)}${'•'.repeat(Math.max(0, accessCode.length - 4))}` : '—';

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Paramètres" />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Tab bar */}
            <div className="flex gap-1 bg-bg-surface border border-white/6 rounded-xl p-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-eco-gradient text-white shadow-eco'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ─── Account tab ─── */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                {/* GTB Connection */}
                <div className="bg-bg-surface border border-white/6 rounded-2xl p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <Globe className="w-4.5 h-4.5 text-accent-cyan" />
                    <h2 className="font-display font-semibold text-text-primary">Connexion GTB</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-text-muted mb-1.5">Point de terminaison actuel</p>
                      <p className="text-sm font-mono bg-bg-elevated px-3 py-1.5 rounded-xl border border-white/6 text-text-primary inline-block break-all">
                        {gtbEndpoint || 'Aucun (Mode Démo)'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/connect')}
                      className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-white/10 text-text-primary hover:bg-bg-elevated transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Modifier
                    </button>
                  </div>
                </div>

                {/* Mode + Theme */}
                <div className="bg-bg-surface border border-white/6 rounded-2xl p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <ShieldAlert className="w-4.5 h-4.5 text-accent-mint" />
                    <h2 className="font-display font-semibold text-text-primary">Préférences</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-bg-elevated rounded-xl border border-white/6">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Mode de données</p>
                        <p className="text-xs text-text-muted mt-0.5">{mode === 'demo' ? 'Données simulées' : 'Données en direct'}</p>
                      </div>
                      <button
                        onClick={() => setMode(mode === 'demo' ? 'authenticated' : 'demo')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          mode === 'demo'
                            ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/25 hover:bg-accent-amber/20'
                            : 'bg-accent-mint/10 text-accent-mint border-accent-mint/25 hover:bg-accent-mint/20'
                        }`}
                      >
                        {mode === 'demo' ? 'Passer en Live' : 'Passer en Démo'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-bg-elevated rounded-xl border border-white/6">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Thème d'interface</p>
                        <p className="text-xs text-text-muted mt-0.5">{theme === 'dark' ? 'Mode sombre (forêt)' : 'Mode clair (crème)'}</p>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 bg-bg-surface text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all"
                      >
                        {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auth */}
                <div className="bg-bg-surface border border-white/6 rounded-2xl p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <Key className="w-4.5 h-4.5 text-accent-amber" />
                    <h2 className="font-display font-semibold text-text-primary">Sécurité</h2>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-muted mb-1">Code d'accès actif</p>
                      <p className="font-mono font-bold text-lg text-text-primary tracking-widest">{maskedCode}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Se déconnecter
                    </button>
                  </div>
                </div>

                {/* About */}
                <div className="bg-bg-surface border border-white/6 rounded-2xl p-5 text-sm text-text-muted space-y-1.5">
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="w-4 h-4 text-text-subtle" />
                    <span className="font-display font-semibold text-text-primary">À propos</span>
                  </div>
                  <p>EnergyOS v2.0 — Plateforme GTB Médicale</p>
                  <p>Stack : React 19 · Vite · Tailwind · Zustand · Groq AI</p>
                  <p className="text-text-subtle">Projet de Fin d'Études — Ingénierie des Systèmes Intelligents</p>
                </div>
              </div>
            )}

            {/* ─── Access codes tab ─── */}
            {activeTab === 'access' && (
              <div className="space-y-4">
                <div className="bg-bg-surface border border-white/6 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4.5 h-4.5 text-accent-mint" />
                      <h2 className="font-display font-semibold text-text-primary">Codes pour collaborateurs</h2>
                    </div>
                    <button
                      onClick={() => setShowCodeModal(true)}
                      className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-eco-gradient text-white hover:opacity-90 transition-all shadow-eco"
                    >
                      <Plus className="w-4 h-4" /> Nouveau code
                    </button>
                  </div>
                  <p className="text-sm text-text-muted mb-5 leading-relaxed">
                    Créez des codes d'accès limités pour vos techniciens, comptables ou managers d'étage. Chaque code peut avoir un niveau d'accès différent.
                  </p>

                  {/* Clearance level guide */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CLEARANCE_LEVELS.map(lvl => (
                      <div key={lvl.value} className={`flex items-start gap-3 p-3.5 rounded-xl border ${lvl.bg}`}>
                        <span className={`flex-shrink-0 mt-0.5 ${lvl.color}`}>{lvl.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${lvl.color}`}>{lvl.label}</p>
                          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{lvl.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Activity log tab ─── */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="bg-bg-surface border border-white/6 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-white/6">
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-4.5 h-4.5 text-accent-mint" />
                      <h2 className="font-display font-semibold text-text-primary">Journal d'activité</h2>
                    </div>
                    {activityLog.length > 0 && (
                      <button
                        onClick={() => { clearActivityLog(); toast.success('Journal effacé'); }}
                        className="text-xs font-semibold text-text-muted hover:text-accent-red transition-colors px-3 py-1.5 rounded-lg hover:bg-accent-red/10"
                      >
                        Effacer tout
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-white/5">
                    {activityLog.length === 0 ? (
                      <div className="p-10 text-center">
                        <Clock className="w-8 h-8 text-text-subtle mx-auto mb-3" />
                        <p className="text-text-muted text-sm">Aucune activité enregistrée.</p>
                        <p className="text-text-subtle text-xs mt-1">Les actions (modes zones, planifications, alertes) apparaîtront ici.</p>
                      </div>
                    ) : (
                      activityLog.map(entry => (
                        <div key={entry.id} className="flex items-center gap-3.5 px-5 py-3 hover:bg-bg-elevated/40 transition-colors">
                          <span className="flex-shrink-0">
                            {ACTIVITY_ICONS[entry.type] || ACTIVITY_ICONS.system}
                          </span>
                          <p className="flex-1 text-sm text-text-primary truncate">{entry.description}</p>
                          <span className="text-[10px] text-text-muted font-mono whitespace-nowrap">
                            {formatRelTime(entry.timestamp)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {showCodeModal && <CodeGenModal onClose={() => setShowCodeModal(false)} />}
    </div>
  );
}
