import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Copy, Check, ExternalLink, ChevronRight,
  Terminal, Server, Globe, Database, Key, Cpu,
  GitBranch, Package, Settings, BookOpen, ArrowLeft,
  AlertTriangle, CheckCircle2, Info, Wifi, Activity,
  FileCode, Layers, Shield, Rocket
} from 'lucide-react';

/* ── Section IDs ── */
const SECTIONS = [
  { id: 'overview',       label: 'Vue d\'ensemble',         icon: BookOpen },
  { id: 'prerequisites',  label: 'Prérequis',               icon: Package },
  { id: 'installation',   label: 'Installation',            icon: Terminal },
  { id: 'environment',    label: 'Variables d\'Env.',        icon: Settings },
  { id: 'backend',        label: 'Serveur Backend',         icon: Server },
  { id: 'frontend',       label: 'Client Frontend',         icon: Globe },
  { id: 'simulator',      label: 'Simulateur Node-RED',     icon: Cpu },
  { id: 'gtb-connect',    label: 'Connexion GTB',           icon: Wifi },
  { id: 'auth',           label: 'Authentification',        icon: Key },
  { id: 'database',       label: 'Base de Données',         icon: Database },
  { id: 'api-reference',  label: 'Référence API',           icon: FileCode },
  { id: 'architecture',   label: 'Architecture',            icon: Layers },
  { id: 'deployment',     label: 'Déploiement',             icon: Rocket },
  { id: 'troubleshooting',label: 'Dépannage',               icon: AlertTriangle },
];

/* ── Copy button for code blocks ── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded-md hover:bg-white/8"
      title="Copier"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-accent-mint" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  );
}

/* ── Code block ── */
function Code({ children, lang = '' }) {
  const text = typeof children === 'string' ? children.trim() : '';
  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-white/8">
      <div className="flex items-center justify-between px-4 py-2 bg-white/4 border-b border-white/6">
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{lang || 'bash'}</span>
        <CopyButton text={text} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed" style={{ background: '#080d14', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}>
        <code>{text}</code>
      </pre>
    </div>
  );
}

/* ── Inline code ── */
function IC({ children }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md text-[0.82em] font-mono text-accent-cyan" style={{ background: 'rgba(0,212,255,0.08)' }}>
      {children}
    </code>
  );
}

/* ── Alert callout ── */
function Callout({ type = 'info', children }) {
  const styles = {
    info:    { icon: Info,         bg: 'bg-accent-cyan/6',  border: 'border-accent-cyan/20',  text: 'text-accent-cyan' },
    warning: { icon: AlertTriangle, bg: 'bg-accent-amber/6', border: 'border-accent-amber/20', text: 'text-accent-amber' },
    success: { icon: CheckCircle2,  bg: 'bg-accent-mint/6',  border: 'border-accent-mint/20',  text: 'text-accent-mint' },
    danger:  { icon: AlertTriangle, bg: 'bg-accent-red/6',   border: 'border-accent-red/20',   text: 'text-accent-red' },
  };
  const s = styles[type];
  const Icon = s.icon;
  return (
    <div className={`flex gap-3 p-4 rounded-xl border my-4 ${s.bg} ${s.border}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${s.text}`} />
      <div className="text-sm text-text-primary leading-relaxed">{children}</div>
    </div>
  );
}

/* ── Section heading ── */
function Section({ id, title, icon: Icon, children }) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/6">
        <div className="w-9 h-9 rounded-xl bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4.5 h-4.5 text-accent-cyan" />
        </div>
        <h2 className="text-2xl font-display font-bold text-text-primary">{title}</h2>
      </div>
      <div className="space-y-4 text-text-primary">{children}</div>
    </section>
  );
}

/* ── Table component ── */
function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-white/8">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-text-primary font-mono text-xs leading-relaxed">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Badge ── */
function Badge({ children, variant = 'default' }) {
  const v = {
    default: 'bg-white/8 text-text-muted',
    cyan: 'bg-accent-cyan/12 text-accent-cyan',
    mint: 'bg-accent-mint/12 text-accent-mint',
    amber: 'bg-accent-amber/12 text-accent-amber',
    red: 'bg-accent-red/12 text-accent-red',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${v[variant]}`}>
      {children}
    </span>
  );
}

/* ── Step indicator ── */
function Step({ num, title, children }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-cyan/12 border border-accent-cyan/25 flex items-center justify-center text-sm font-bold text-accent-cyan font-mono mt-0.5">
        {num}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-text-primary mb-2">{title}</p>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Main page                                  */
/* ─────────────────────────────────────────── */
export default function Documentation() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef(null);

  /* Scrollspy via IntersectionObserver */
  useEffect(() => {
    const observers = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">

      {/* ── Top header ── */}
      <header className="sticky top-0 z-50 h-16 bg-bg-surface/90 backdrop-blur-md border-b border-white/6 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-eco-gradient flex items-center justify-center shadow-eco">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-text-primary hidden sm:block">
              Energy<span className="eco-text-gradient">OS</span>
            </span>
          </Link>
          <ChevronRight className="w-4 h-4 text-text-subtle" />
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-cyan" />
            <span className="text-sm font-semibold text-text-primary">Documentation</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="cyan">v2.0</Badge>
          <Link
            to="/dashboard"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-bg-elevated border border-white/8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Tableau de Bord
          </Link>
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors border border-white/8"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex max-w-screen-xl mx-auto">

        {/* ── Left sidebar ── */}
        <aside className={`
          fixed lg:sticky lg:top-16 top-16 left-0 z-40
          w-72 lg:w-64 h-[calc(100vh-4rem)] overflow-y-auto
          bg-bg-surface lg:bg-transparent border-r border-white/6 lg:border-none
          transition-transform duration-300 scrollbar-thin
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-6 pb-8 px-4 flex-shrink-0
        `}>
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-mono px-2 mb-3">Sur cette page</p>
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all cursor-pointer ${
                  activeSection === id
                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{label}</span>
                {activeSection === id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-cyan flex-shrink-0" />}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-white/6 px-2">
            <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest mb-3">Ressources</p>
            <a href="https://nodered.org/docs/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-text-muted hover:text-accent-cyan transition-colors py-1.5">
              <ExternalLink className="w-3 h-3" /> Node-RED Docs
            </a>
            <a href="https://supabase.com/docs" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-text-muted hover:text-accent-cyan transition-colors py-1.5">
              <ExternalLink className="w-3 h-3" /> Supabase Docs
            </a>
            <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-text-muted hover:text-accent-cyan transition-colors py-1.5">
              <ExternalLink className="w-3 h-3" /> Console Groq
            </a>
          </div>
        </aside>

        {/* Sidebar backdrop (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main content ── */}
        <main ref={contentRef} className="flex-1 min-w-0 px-6 lg:px-12 py-10 lg:py-12 max-w-4xl">

          {/* Hero */}
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="mint">Guide Officiel</Badge>
              <Badge>EnergyOS v2.0</Badge>
            </div>
            <h1 className="text-4xl font-display font-black text-text-primary mb-4 leading-tight">
              Documentation<br />
              <span className="eco-text-gradient">EnergyOS</span>
            </h1>
            <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
              Guide complet d'installation, configuration et déploiement de la plateforme EnergyOS — système de gestion énergétique pour établissements médicaux.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                { label: 'React 19', variant: 'cyan' },
                { label: 'Express 5', variant: 'mint' },
                { label: 'Node-RED', variant: 'amber' },
                { label: 'Supabase', variant: 'default' },
                { label: 'Groq AI', variant: 'default' },
              ].map((b) => <Badge key={b.label} variant={b.variant}>{b.label}</Badge>)}
            </div>
          </div>

          {/* ── OVERVIEW ── */}
          <Section id="overview" title="Vue d'ensemble" icon={BookOpen}>
            <p className="text-text-muted leading-relaxed">
              EnergyOS est une plateforme SaaS de supervision énergétique dédiée aux établissements médicaux en Tunisie. Elle connecte les systèmes GTB (Gestion Technique du Bâtiment) via BACnet/Modbus, analyse la consommation en temps réel et utilise l'IA Groq pour générer des recommandations d'optimisation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {[
                { icon: Activity, title: 'Supervision Temps Réel', desc: 'Puissance, cos φ, température, modes de zone — polling toutes les 3 secondes depuis le GTB.' },
                { icon: Cpu, title: 'Simulation Node-RED', desc: '98 nodes préconfigurés simulant un hôpital de 10 zones avec données réalistes.' },
                { icon: Shield, title: 'Authentification par Code', desc: 'Codes d\'accès gérés dans Supabase. Mode démo disponible sans configuration réseau.' },
                { icon: Zap, title: 'IA Groq Intégrée', desc: 'Llama 3.1 génère des rapports d\'audit énergétique clinique et des plannings éco-optimisés.' },
              ].map((f) => (
                <div key={f.title} className="bg-bg-surface border border-white/6 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <f.icon className="w-4 h-4 text-accent-cyan" />
                    <span className="font-semibold text-text-primary text-sm">{f.title}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-display font-bold text-text-primary mt-8 mb-3">Structure du Projet</h3>
            <Code lang="plaintext">{`
energyos/
├── client/               # React 19 SPA (Vite + Tailwind + Zustand)
│   ├── src/
│   │   ├── pages/        # Landing, Dashboard, Alerts, Schedule…
│   │   ├── components/   # UI, dashboard cards, charts
│   │   ├── store/        # Zustand global state
│   │   └── lib/          # Supabase, Groq, demo data
│   └── vite.config.js
├── server/               # Express 5 API proxy
│   ├── routes/           # auth, admin, gtb, groq
│   ├── middleware/        # auth guard, logger
│   └── index.js
├── database/             # Supabase SQL migrations
├── docs/                 # Architecture diagrams
├── .env                  # Shared environment variables
└── package.json

simulation/energyos-simulation/
├── generate-flow.js      # Source of truth — generates Node-RED flow
├── flows/
│   └── energyos-main-flow.json   # Import this into Node-RED
└── data/
    ├── zones.json
    └── devices.json
            `}</Code>
          </Section>

          {/* ── PREREQUISITES ── */}
          <Section id="prerequisites" title="Prérequis" icon={Package}>
            <p className="text-text-muted">Assurez-vous que les outils suivants sont installés avant de commencer :</p>
            <Table
              headers={['Outil', 'Version Minimale', 'Remarque']}
              rows={[
                ['Node.js', '>= 18.0', 'Requis pour le serveur et le client'],
                ['npm', '>= 9.0', 'Inclus avec Node.js'],
                ['Git', 'Toute version récente', 'Pour cloner le dépôt'],
                ['Node-RED', '>= 3.0', 'Optionnel — simulation GTB uniquement'],
              ]}
            />
            <p className="text-text-muted mt-4">Comptes externes nécessaires :</p>
            <Table
              headers={['Service', 'Usage', 'Plan']}
              rows={[
                ['Supabase', 'Base de données + auth', 'Free tier suffisant'],
                ['Groq AI', 'Rapports IA (Llama 3.1)', 'Free tier — console.groq.com'],
              ]}
            />
            <Callout type="success">
              EnergyOS fonctionne entièrement en <strong>mode démo</strong> sans Supabase ni Groq configurés. Idéal pour explorer les fonctionnalités localement.
            </Callout>
          </Section>

          {/* ── INSTALLATION ── */}
          <Section id="installation" title="Installation" icon={Terminal}>
            <Step num="1" title="Cloner le dépôt">
              <Code lang="bash">{`git clone https://github.com/votre-org/energyos.git
cd energyos`}</Code>
            </Step>

            <Step num="2" title="Installer les dépendances racine">
              <Code lang="bash">{`# Depuis le dossier racine energyos/
npm install`}</Code>
            </Step>

            <Step num="3" title="Installer les dépendances du serveur">
              <Code lang="bash">{`cd server
npm install
cd ..`}</Code>
            </Step>

            <Step num="4" title="Installer les dépendances du client">
              <Code lang="bash">{`cd client
npm install
cd ..`}</Code>
            </Step>

            <Step num="5" title="Installer le simulateur Node-RED (optionnel)">
              <Code lang="bash">{`# Installer Node-RED globalement
npm install -g node-red

# Générer le fichier de flow depuis les sources
cd ../simulation/energyos-simulation
npm install   # si un package.json existe
node generate-flow.js
# → Génère flows/energyos-main-flow.json (98 nodes)`}</Code>
              <Callout type="info">
                Le simulateur est indépendant du projet principal. Il réside dans <IC>simulation/energyos-simulation/</IC> et expose une API HTTP sur le port <IC>1880</IC>.
              </Callout>
            </Step>

            <Callout type="success">
              L'installation est terminée. Passez à la configuration des variables d'environnement.
            </Callout>
          </Section>

          {/* ── ENVIRONMENT ── */}
          <Section id="environment" title="Variables d'Environnement" icon={Settings}>
            <p className="text-text-muted leading-relaxed">
              Créez le fichier <IC>.env</IC> à la racine du dossier <IC>energyos/</IC> (pas dans <IC>client/</IC> ni dans <IC>server/</IC>). Vite lit automatiquement les variables <IC>VITE_*</IC> depuis ce répertoire parent grâce au paramètre <IC>envDir: '../'</IC>.
            </p>
            <Code lang="bash">{`# Depuis energyos/server/ ou energyos/client/
# Le fichier doit être placé à energyos/.env`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Contenu du fichier <IC>.env</IC></h3>
            <Code lang="env">{`# ==========================================
# Supabase — Base de données et Auth
# ==========================================
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_KEY=votre_cle_service_role_secrete

# ==========================================
# Backend Express
# ==========================================
PORT=3001
NODE_ENV=development
ADMIN_SECRET=votre_secret_admin_fort

# URL de base de l'API (pour les appels fetch côté client)
VITE_API_BASE_URL=http://localhost:3001

# ==========================================
# Groq AI — Génération de rapports IA
# ==========================================
VITE_GROQ_API_KEY=gsk_votre_cle_groq

# ==========================================
# Mode Démo
# ==========================================
VITE_DEMO_MODE=true`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Description des Variables</h3>
            <Table
              headers={['Variable', 'Requis', 'Description']}
              rows={[
                ['VITE_SUPABASE_URL', 'Non*', 'URL publique du projet Supabase'],
                ['VITE_SUPABASE_ANON_KEY', 'Non*', 'Clé anon (safe côté client)'],
                ['SUPABASE_SERVICE_KEY', 'Non*', 'Clé service role (serveur uniquement, jamais exposée)'],
                ['PORT', 'Non', 'Port du serveur Express (défaut: 3001)'],
                ['NODE_ENV', 'Non', '"development" ou "production"'],
                ['ADMIN_SECRET', 'Oui', 'Secret pour accéder au panneau /admin'],
                ['VITE_API_BASE_URL', 'Non', 'URL de base de l\'API Express (défaut: http://localhost:3001)'],
                ['VITE_GROQ_API_KEY', 'Non*', 'Clé API Groq pour les rapports IA'],
                ['VITE_DEMO_MODE', 'Non', '"true" active le mode démo sans backend'],
              ]}
            />
            <p className="text-xs text-text-muted">* Non requis pour le mode démo, requis pour le mode authentifié complet.</p>

            <Callout type="warning">
              Ne commitez jamais le fichier <IC>.env</IC> dans Git. Ajoutez <IC>.env</IC> à votre <IC>.gitignore</IC>. La clé <IC>SUPABASE_SERVICE_KEY</IC> donne un accès complet à votre base — elle ne doit jamais être exposée côté client.
            </Callout>
          </Section>

          {/* ── BACKEND ── */}
          <Section id="backend" title="Serveur Backend" icon={Server}>
            <p className="text-text-muted leading-relaxed">
              Le serveur Express 5 agit comme proxy entre le client React et les services externes (GTB/Node-RED, Supabase, Groq). Il tourne sur le port <IC>3001</IC> par défaut.
            </p>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Démarrage</h3>
            <Code lang="bash">{`# Depuis energyos/server/

# Mode développement (nodemon — rechargement automatique)
npm run dev

# Mode production
npm start`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Routes disponibles</h3>
            <Table
              headers={['Route', 'Méthode', 'Description']}
              rows={[
                ['/api/health', 'GET', 'Vérification de santé — retourne { status: "ok" }'],
                ['/api/auth/validate-code', 'POST', 'Valide un code d\'accès via Supabase'],
                ['/api/admin/*', 'GET/POST', 'Routes admin — nécessite header x-admin-secret'],
                ['/api/gtb/ping', 'GET ?url=', 'Ping le serveur GTB/Node-RED'],
                ['/api/gtb/zones', 'GET ?url=', 'Récupère les zones depuis le GTB'],
                ['/api/gtb/live', 'GET ?url=', 'Données énergie en temps réel'],
                ['/api/gtb/alerts', 'GET ?url=', 'Liste des alertes actives'],
                ['/api/gtb/control', 'POST', 'Envoie une commande de contrôle à une zone'],
                ['/api/gtb/config', 'GET/POST ?url=', 'Lit/écrit la configuration (plannings, scénarios)'],
                ['/api/gtb/zones/reset', 'POST', 'Remet toutes les zones en mode normal'],
                ['/api/groq/optimize', 'POST', 'Génère une config d\'optimisation via Groq AI'],
              ]}
            />

            <Callout type="info">
              Toutes les routes <IC>/api/gtb/*</IC> proxifient les requêtes vers le serveur GTB dont l'URL est passée en paramètre <IC>?url=</IC> ou dans le corps de la requête. Si aucune URL n'est fournie, <IC>/api/gtb/control</IC> retourne une réponse mock de succès (fallback démo).
            </Callout>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Test de santé</h3>
            <Code lang="bash">{`curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}`}</Code>
          </Section>

          {/* ── FRONTEND ── */}
          <Section id="frontend" title="Client Frontend" icon={Globe}>
            <p className="text-text-muted leading-relaxed">
              Le client est une SPA React 19 construite avec Vite. Il tourne sur le port <IC>5173</IC> en développement. Toutes les communications GTB passent par l'Express proxy — le client ne contacte jamais Node-RED directement (isolation CORS).
            </p>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Démarrage</h3>
            <Code lang="bash">{`# Depuis energyos/client/
npm run dev      # → http://localhost:5173

# Build de production
npm run build    # → dist/

# Prévisualisation du build
npm run preview  # → http://localhost:4173

# Linting
npm run lint`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Routes de l'Application</h3>
            <Table
              headers={['Route', 'Auth', 'Description']}
              rows={[
                ['/', 'Public', 'Page d\'accueil — présentation commerciale'],
                ['/onboarding', 'Public', 'Saisie du code d\'accès — entrée dans l\'application'],
                ['/connect', 'Public', 'Configuration de la connexion GTB/simulateur'],
                ['/documentation', 'Public', 'Cette page'],
                ['/solar', 'Public', 'Calculateur d\'installation solaire'],
                ['/dashboard', 'Protégé', 'Tableau de bord principal avec Vue Blueprint'],
                ['/dashboard/energy', 'Protégé', 'Analyses énergétiques et graphiques'],
                ['/dashboard/schedule', 'Protégé', 'Planification des équipements'],
                ['/dashboard/alerts', 'Protégé', 'Alertes en temps réel'],
                ['/dashboard/settings', 'Protégé', 'Paramètres et fil d\'activité'],
                ['/admin', 'Admin Secret', 'Panneau d\'administration'],
              ]}
            />

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Proxy Vite (développement)</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              En développement, Vite proxifie automatiquement <IC>/api/*</IC> vers <IC>http://localhost:3001</IC>. Les deux services doivent tourner simultanément.
            </p>
            <Code lang="bash">{`# Terminal 1 — Backend
cd energyos/server && npm run dev

# Terminal 2 — Frontend
cd energyos/client && npm run dev`}</Code>
          </Section>

          {/* ── SIMULATOR ── */}
          <Section id="simulator" title="Simulateur Node-RED" icon={Cpu}>
            <p className="text-text-muted leading-relaxed">
              Le simulateur Node-RED remplace un vrai GTB pour les démos, les tests et le développement. Il expose une API HTTP complète sur le port <IC>1880</IC> et simule en temps réel 10 zones hospitalières.
            </p>

            <Callout type="warning">
              Le fichier <IC>flows/energyos-main-flow.json</IC> est un <strong>artifact généré</strong>. Ne l'éditez jamais manuellement. Modifiez toujours <IC>generate-flow.js</IC> puis régénérez.
            </Callout>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Démarrage du simulateur</h3>
            <Step num="1" title="Démarrer Node-RED">
              <Code lang="bash">{`node-red
# → Accessible sur http://localhost:1880`}</Code>
            </Step>

            <Step num="2" title="Générer (ou régénérer) le flow">
              <Code lang="bash">{`cd simulation/energyos-simulation
node generate-flow.js
# → Flow generated: flows/energyos-main-flow.json
# → Total nodes: 98`}</Code>
            </Step>

            <Step num="3" title="Importer le flow dans Node-RED">
              <p className="text-sm text-text-muted mb-2">Dans l'interface Node-RED (<IC>http://localhost:1880</IC>) :</p>
              <ol className="list-none space-y-1.5 text-sm text-text-muted">
                <li className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 mt-0.5 text-accent-cyan flex-shrink-0" /> Menu hamburger (☰) en haut à droite</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 mt-0.5 text-accent-cyan flex-shrink-0" /> <strong>Import</strong> → <strong>Sélectionner un fichier</strong></li>
                <li className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 mt-0.5 text-accent-cyan flex-shrink-0" /> Sélectionner <IC>flows/energyos-main-flow.json</IC></li>
                <li className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 mt-0.5 text-accent-cyan flex-shrink-0" /> Cliquer <strong>Import</strong> puis <strong>Deploy</strong></li>
              </ol>
            </Step>

            <Step num="4" title="Vérifier que le simulateur répond">
              <Code lang="bash">{`curl http://localhost:1880/api/ping
# → {"status":"ok","simulator":"energyos","zones":10}

curl http://localhost:1880/api/energy/live
# → {"total_power_kw":213.4,"cos_phi":0.87,...}`}</Code>
            </Step>

            <h3 className="text-base font-semibold text-text-primary mt-8 mb-3">Endpoints du simulateur</h3>
            <Table
              headers={['Endpoint', 'Méthode', 'Description']}
              rows={[
                ['/api/ping', 'GET', 'Test de connectivité'],
                ['/api/zones', 'GET', 'Liste des 10 zones avec appareils intégrés'],
                ['/api/energy/live', 'GET', 'Métriques live (kW, cos φ, peak)'],
                ['/api/alerts', 'GET', 'Alertes actives'],
                ['/api/alerts/:id/acknowledge', 'POST', 'Acquitter une alerte'],
                ['/api/config', 'GET', 'Lire la configuration (plannings, scénarios)'],
                ['/api/config', 'POST', 'Mettre à jour temp_ext, scenario, eco_schedules…'],
                ['/api/control', 'POST', 'Contrôle d\'une zone (mode, dimmer, temp, load_cap)'],
                ['/api/zones/:id/mode', 'POST', 'Changer le mode d\'une zone'],
                ['/api/zones/reset', 'POST', 'Remettre toutes les zones en mode normal'],
              ]}
            />

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Scénarios disponibles via <IC>POST /api/config</IC></h3>
            <Code lang="json">{`// Pic estival
{ "temp_ext": 38, "occupancy_pct": 98, "scenario": "summer_peak", "load_override_pct": 88 }

// Coupure secteur
{ "emergency_stop": true, "scenario": "blackout" }

// Conditions normales
{
  "temp_ext": 28, "occupancy_pct": 75,
  "gtb_active": true, "noise_enabled": true,
  "emergency_stop": false, "scenario": "normal", "load_override_pct": null
}`}</Code>
          </Section>

          {/* ── GTB CONNECT ── */}
          <Section id="gtb-connect" title="Connexion GTB" icon={Wifi}>
            <p className="text-text-muted leading-relaxed">
              La page <IC>/connect</IC> permet de configurer et tester la connexion au GTB (ou simulateur). L'URL est persistée dans <IC>localStorage</IC> sous la clé <IC>energyos_gtb_url</IC> et dans le store Zustand (<IC>gtbEndpoint</IC>).
            </p>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Procédure de connexion</h3>
            <Step num="1" title="Accéder à la page Connexion">
              <p className="text-sm text-text-muted">Naviguer vers <IC>/connect</IC> depuis l'interface ou via le bouton de la page d'accueil.</p>
            </Step>
            <Step num="2" title="Saisir l'URL du GTB">
              <Code lang="text">{`# Simulateur local
http://localhost:1880

# Simulateur via ngrok (tunnel public)
https://xxxx-xx-xx.ngrok-free.app

# GTB réel (BACnet/Modbus Gateway)
http://192.168.1.100:8080`}</Code>
            </Step>
            <Step num="3" title="Tester la connexion">
              <p className="text-sm text-text-muted">Le bouton <strong>Tester la Connexion</strong> appelle <IC>GET /api/gtb/ping?url=&lt;votre-url&gt;</IC> et affiche le statut en temps réel.</p>
            </Step>
            <Step num="4" title="Sauvegarder">
              <p className="text-sm text-text-muted">Cliquer <strong>Connecter & Sauvegarder</strong>. Le dashboard commence à poller les données toutes les 3 secondes.</p>
            </Step>

            <Callout type="info">
              Si le GTB est injoignable, le dashboard bascule automatiquement sur les données de démo. Aucune perte de fonctionnalité côté interface.
            </Callout>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Accès distant via ngrok</h3>
            <p className="text-sm text-text-muted leading-relaxed mb-3">Pour exposer le simulateur depuis un réseau local vers internet :</p>
            <Code lang="bash">{`# Installer ngrok
npm install -g ngrok

# Exposer Node-RED
ngrok http 1880
# → https://xxxx-xx-xx.ngrok-free.app

# Utiliser cette URL dans la page /connect de l'application déployée`}</Code>
            <Callout type="warning">
              Les URLs ngrok gratuites expirent toutes les 2 heures et changent à chaque redémarrage. Pour un déploiement stable, utilisez un tunnel payant ou configurez un reverse proxy.
            </Callout>
          </Section>

          {/* ── AUTH ── */}
          <Section id="auth" title="Authentification" icon={Key}>
            <p className="text-text-muted leading-relaxed">
              EnergyOS utilise un système d'authentification par <strong>codes d'accès</strong> (sans JWT ni session). Les codes sont stockés dans la table Supabase <IC>access_codes</IC>.
            </p>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Modes d'accès</h3>
            <Table
              headers={['Mode', 'Code Requis', 'Accès', 'Persistance']}
              rows={[
                ['Démo', 'DEMO', 'Tableau de bord complet avec données simulées', 'localStorage energyos_mode=demo'],
                ['Authentifié', 'Code Supabase valide', 'Tableau de bord avec données live GTB', 'localStorage energyos_mode=authenticated'],
                ['Admin', 'ADMIN_SECRET', 'Panneau /admin (gestion codes, stats)', 'Header x-admin-secret par requête'],
              ]}
            />

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Créer un code d'accès (Supabase)</h3>
            <Code lang="sql">{`-- Dans l'éditeur SQL Supabase
INSERT INTO access_codes (code, clinic_name, max_uses, active)
VALUES ('MON-CODE-2024', 'Polyclinique Example', 5, true);`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Flux d'authentification</h3>
            <Code lang="text">{`1. Utilisateur saisit le code sur /onboarding
2. POST /api/auth/validate-code { code }
3. Serveur vérifie dans Supabase (access_codes table)
4. Si valide → mode = 'authenticated' sauvegardé en Zustand + localStorage
5. AuthGuard débloque les routes /dashboard/*
6. Pour 'DEMO' → mode = 'demo' (pas de vérification Supabase)`}</Code>

            <Callout type="info">
              L'accès admin se fait directement sur <IC>/admin</IC>. Le code <IC>ADMIN_SECRET</IC> peut aussi être saisi sur <IC>/onboarding</IC> pour un accès admin bypass direct.
            </Callout>
          </Section>

          {/* ── DATABASE ── */}
          <Section id="database" title="Base de Données" icon={Database}>
            <p className="text-text-muted leading-relaxed">
              EnergyOS utilise Supabase (PostgreSQL) pour l'authentification, la gestion des codes d'accès, et l'historique des métriques. Les migrations sont dans <IC>database/</IC>.
            </p>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Exécuter les migrations</h3>
            <p className="text-sm text-text-muted mb-3">Dans le <strong>SQL Editor</strong> de votre projet Supabase, exécutez les fichiers dans l'ordre :</p>
            <Code lang="sql">{`-- 1. Schéma initial (tables + indexes)
-- Coller le contenu de database/001_initial_schema.sql

-- 2. Politiques RLS (Row Level Security)
-- Coller le contenu de database/002_rls_policies.sql

-- 3. Table demandes solaires (optionnel)
-- Coller le contenu de database/003_solar_requests.sql`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Tables principales</h3>
            <Table
              headers={['Table', 'Description', 'Accès Client']}
              rows={[
                ['clinics', 'Établissements médicaux enregistrés', 'Service role uniquement'],
                ['access_requests', 'Demandes d\'accès depuis la landing page', 'INSERT anonyme'],
                ['access_codes', 'Codes d\'accès valides', 'SELECT anonyme/authentifié'],
                ['zones', 'Zones de l\'établissement (backup DB)', 'Service role uniquement'],
                ['devices', 'Équipements GTB (backup DB)', 'Service role uniquement'],
                ['energy_metrics', 'Historique des mesures énergétiques', 'Service role uniquement'],
                ['alerts_log', 'Journal des alertes', 'Service role uniquement'],
                ['ai_optimizations', 'Historique des optimisations IA', 'Service role uniquement'],
              ]}
            />

            <Callout type="success">
              En mode démo, aucune table n'est requise. Seule <IC>access_codes</IC> est lue en mode authentifié. Les données de zones et métriques viennent du GTB via l'API — pas de la base de données.
            </Callout>
          </Section>

          {/* ── API REFERENCE ── */}
          <Section id="api-reference" title="Référence API" icon={FileCode}>
            <p className="text-text-muted leading-relaxed">Exemples de requêtes vers les routes Express principales.</p>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Contrôle d'une zone</h3>
            <Code lang="bash">{`curl -X POST http://localhost:3001/api/gtb/control \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "http://localhost:1880",
    "zoneId": "z1",
    "parameter": "mode",
    "value": "eco"
  }'

# Paramètres disponibles: mode | dimmer | temp | load_cap
# Valeurs mode: "normal" | "eco" | "off"
# Valeurs dimmer: 0-100
# Valeurs temp: 18-28 (°C)
# Valeurs load_cap: 0-100 (%)`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Mettre à jour la configuration</h3>
            <Code lang="bash">{`curl -X POST http://localhost:3001/api/gtb/config \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "http://localhost:1880",
    "config": {
      "temp_ext": 35,
      "occupancy_pct": 90,
      "gtb_active": true,
      "noise_enabled": true,
      "eco_schedules": [
        { "zone": "z5", "eco_start": "18:00", "eco_end": "07:00" }
      ]
    }
  }'`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Validation d'un code d'accès</h3>
            <Code lang="bash">{`curl -X POST http://localhost:3001/api/auth/validate-code \\
  -H "Content-Type: application/json" \\
  -d '{ "code": "DEMO" }'

# Réponse succès:
# { "valid": true, "mode": "demo", "clinic": "Mode Démo" }

# Réponse échec:
# { "valid": false, "error": "Code invalide ou expiré" }`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Accès Admin</h3>
            <Code lang="bash">{`curl http://localhost:3001/api/admin/stats \\
  -H "x-admin-secret: votre_admin_secret"

# → Stats d'utilisation, liste des accès, codes actifs`}</Code>
          </Section>

          {/* ── ARCHITECTURE ── */}
          <Section id="architecture" title="Architecture" icon={Layers}>
            <p className="text-text-muted leading-relaxed">
              EnergyOS est une architecture à trois niveaux. Le client ne communique jamais directement avec le GTB — toutes les requêtes transitent par l'Express proxy pour des raisons CORS et de sécurité.
            </p>

            <Code lang="plaintext">{`
┌─────────────────────────────────────────────────────────┐
│                    NAVIGATEUR / CLIENT                   │
│  React 19 · Vite · Zustand · Tailwind                   │
│  http://localhost:5173                                   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │Dashboard │  │ Alerts   │  │ Schedule │  │  AI    │  │
│  │+ Blueprint│  │(polling) │  │(plannings)│  │(Groq)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │              │              │             │       │
│       └──────────────┴──────────────┴─────────────┘      │
│                        /api/* (fetch)                     │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  SERVEUR EXPRESS 5                       │
│  http://localhost:3001                                   │
│                                                         │
│  /api/auth  →  Supabase (validation codes)              │
│  /api/gtb/* →  Proxy GTB (axios, timeout 5s)            │
│  /api/groq  →  Groq SDK (rapports IA)                   │
│  /api/admin →  Stats + gestion (x-admin-secret)         │
└─────────┬──────────────────────────┬────────────────────┘
          │                          │
          ▼                          ▼
┌──────────────────┐    ┌───────────────────────┐
│   NODE-RED        │    │   SUPABASE             │
│   (Simulateur)    │    │   (PostgreSQL)         │
│   :1880           │    │                        │
│                  │    │  access_codes          │
│  /api/zones      │    │  access_requests       │
│  /api/energy/live│    │  energy_metrics        │
│  /api/alerts     │    │  alerts_log            │
│  /api/config     │    │  ai_optimizations      │
│  /api/control    │    │                        │
└──────────────────┘    └───────────────────────┘`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-8 mb-3">Flux de données temps réel</h3>
            <Code lang="plaintext">{`Dashboard.jsx
  └── useEffect (setInterval 3s)
       ├── GET /api/gtb/zones?url=...    → setZones()
       ├── GET /api/gtb/live?url=...     → updateLiveData()
       └── GET /api/gtb/alerts?url=...   → setAlerts()

Alerts.jsx
  └── useEffect (setInterval 3s)
       └── GET /api/gtb/alerts?url=...   → addAlert() (merge par id)`}</Code>

            <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Store Zustand — état global</h3>
            <Table
              headers={['Clé', 'Type', 'Description']}
              rows={[
                ['mode', 'string | null', '"demo" | "authenticated" | null'],
                ['gtbEndpoint', 'string', 'URL du GTB — persistée en localStorage'],
                ['zones', 'Zone[]', 'Zones avec appareils intégrés'],
                ['alerts', 'Alert[]', 'Alertes actives et historique'],
                ['liveData', 'LiveData', 'total_power_kw, cos_phi, peak_kw_today'],
                ['schedules', 'Schedule[]', 'Cycles de planification'],
                ['blackoutMode', 'boolean', 'Indicateur de coupure secteur'],
                ['groqConfig', 'object', 'Configuration IA générée'],
              ]}
            />
          </Section>

          {/* ── DEPLOYMENT ── */}
          <Section id="deployment" title="Déploiement" icon={Rocket}>
            <h3 className="text-base font-semibold text-text-primary mb-4">Frontend — Netlify</h3>
            <Step num="1" title="Connecter le dépôt GitHub à Netlify">
              <p className="text-sm text-text-muted">Créer un nouveau site dans Netlify → <strong>Import from Git</strong>.</p>
            </Step>
            <Step num="2" title="Configurer le build">
              <Table
                headers={['Paramètre', 'Valeur']}
                rows={[
                  ['Base directory', 'energyos/client'],
                  ['Build command', 'npm run build'],
                  ['Publish directory', 'energyos/client/dist'],
                ]}
              />
            </Step>
            <Step num="3" title="Variables d'environnement Netlify">
              <p className="text-sm text-text-muted mb-2">Dans <strong>Site settings → Environment variables</strong>, ajouter :</p>
              <Code lang="env">{`VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_API_BASE_URL=https://votre-backend.onrender.com
VITE_GROQ_API_KEY=gsk_votre_cle_groq
VITE_DEMO_MODE=false`}</Code>
            </Step>
            <Step num="4" title="Redirection SPA (netlify.toml)">
              <p className="text-sm text-text-muted mb-2">Vérifier que <IC>energyos/client/netlify.toml</IC> contient :</p>
              <Code lang="toml">{`[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`}</Code>
            </Step>

            <h3 className="text-base font-semibold text-text-primary mt-8 mb-4">Backend — Render</h3>
            <Step num="1" title="Créer un Web Service sur Render">
              <p className="text-sm text-text-muted">Choisir <strong>New → Web Service</strong>, connecter le dépôt.</p>
            </Step>
            <Step num="2" title="Configurer le service">
              <Table
                headers={['Paramètre', 'Valeur']}
                rows={[
                  ['Root directory', 'energyos/server'],
                  ['Build command', 'npm install'],
                  ['Start command', 'npm start'],
                  ['Environment', 'Node'],
                ]}
              />
            </Step>
            <Step num="3" title="Variables d'environnement Render">
              <Code lang="env">{`PORT=3001
NODE_ENV=production
ADMIN_SECRET=votre_secret_fort
SUPABASE_SERVICE_KEY=votre_service_key`}</Code>
            </Step>

            <Callout type="warning">
              Après le déploiement, mettez à jour <IC>VITE_API_BASE_URL</IC> dans Netlify avec l'URL de votre service Render, puis déclenchez un nouveau build Netlify.
            </Callout>
          </Section>

          {/* ── TROUBLESHOOTING ── */}
          <Section id="troubleshooting" title="Dépannage" icon={AlertTriangle}>
            {[
              {
                problem: 'Le simulateur ne répond pas (connexion refusée sur :1880)',
                solutions: [
                  'Vérifier que Node-RED est lancé : node-red',
                  'Vérifier que le flow est importé ET déployé (bouton Deploy rouge en haut)',
                  'Vérifier qu\'aucun pare-feu ne bloque le port 1880',
                ],
              },
              {
                problem: 'Le dashboard affiche toujours les données de démo malgré une connexion GTB configurée',
                solutions: [
                  'Ouvrir la console navigateur et vérifier les erreurs réseau sur /api/gtb/*',
                  'Sur /connect, cliquer Tester la Connexion — si rouge, l\'URL est incorrecte',
                  'Vérifier que le serveur Express tourne (http://localhost:3001/api/health)',
                ],
              },
              {
                problem: 'Erreur CORS lors des appels API',
                solutions: [
                  'Ne jamais appeler Node-RED (:1880) directement depuis le client',
                  'Tous les appels doivent passer par /api/gtb/* (Express proxy)',
                  'En production, VITE_API_BASE_URL doit pointer vers le backend Render (HTTPS)',
                ],
              },
              {
                problem: 'Les variables VITE_* ne sont pas lues par Vite',
                solutions: [
                  'Le fichier .env doit être à la racine energyos/ (pas dans client/ ni server/)',
                  'vite.config.js doit avoir envDir: "../" — vérifier qu\'il n\'a pas été modifié',
                  'Redémarrer le serveur Vite après toute modification du .env',
                ],
              },
              {
                problem: 'Erreur "Code invalide" à l\'onboarding alors que le code semble correct',
                solutions: [
                  'En mode DEMO, utiliser exactement le code "DEMO" (majuscules)',
                  'Pour un vrai code, vérifier dans Supabase que la ligne existe et active = true',
                  'Vérifier que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont corrects',
                ],
              },
              {
                problem: 'generate-flow.js génère une erreur ou le flow importé ne fonctionne pas',
                solutions: [
                  'Vérifier que Node.js >= 18 est utilisé',
                  'Le fichier est CommonJS — ignorer le hint "ES module" de l\'IDE',
                  'Après import dans Node-RED, cliquer Deploy avant de tester',
                ],
              },
            ].map((item, i) => (
              <div key={i} className="mb-6 bg-bg-surface border border-white/6 rounded-xl overflow-hidden">
                <div className="flex items-start gap-3 px-4 py-3 border-b border-white/6 bg-white/[0.02]">
                  <AlertTriangle className="w-4 h-4 text-accent-amber flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-text-primary">{item.problem}</p>
                </div>
                <ul className="px-4 py-3 space-y-2">
                  {item.solutions.map((sol, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-text-muted">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-mint flex-shrink-0 mt-0.5" />
                      {sol}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Footer CTA */}
            <div className="mt-12 p-6 rounded-2xl border border-white/8 bg-bg-surface flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-display font-bold text-text-primary">Besoin d'aide supplémentaire ?</p>
                <p className="text-sm text-text-muted mt-1">Consultez les issues GitHub ou ouvrez un ticket pour votre déploiement.</p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-accent-cyan text-bg-primary font-bold text-sm rounded-xl hover:brightness-110 transition"
                >
                  <Zap className="w-4 h-4" />
                  Ouvrir le Dashboard
                </Link>
              </div>
            </div>
          </Section>

        </main>
      </div>
    </div>
  );
}
