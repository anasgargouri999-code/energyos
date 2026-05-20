import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plug, BarChart3, Leaf, Zap, Activity, Grid, Bell,
  ArrowRight, CheckCircle2, Sun, Battery, Wind, ShieldCheck,
  TrendingDown, Star, ChevronUp, ChevronDown, Users, Quote
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { MONTHLY_DATA } from '../lib/demoData';
import OverlayChart from '../components/charts/OverlayChart';

/* ── FAQ ITEMS ── */
const FAQ_ITEMS = [
  { q: 'Comment EnergyOS réduit-il ma facture STEG ?', a: 'EnergyOS analyse votre consommation en temps réel et optimise automatiquement les plannings d\'éclairage, climatisation et équipements non critiques. La réduction moyenne constatée est de 17,7% dès le premier mois.' },
  { q: 'Qu\'est-ce que la Gestion Technique du Bâtiment (GTB) ?', a: 'La GTB désigne l\'ensemble des systèmes permettant de superviser et contrôler les équipements d\'un bâtiment (HVAC, éclairage, compteurs). EnergyOS s\'interface via BACnet ou Modbus en moins de 5 minutes.' },
  { q: 'EnergyOS est-il compatible avec mon installation existante ?', a: 'Oui. EnergyOS est compatible avec les protocoles BACnet, Modbus RTU/TCP, LonWorks et RS-485. Notre équipe réalise un audit d\'intégration gratuit avant tout déploiement.' },
  { q: 'Quel ROI puis-je attendre ?', a: 'Sur la base des données réelles de la Polyclinique Errachid (Sfax), le ROI est atteint en 14 mois avec 245 075 kWh économisés par an, soit l\'équivalent de 3 mois de facture STEG remboursés.' },
  { q: 'EnergyOS fonctionne-t-il en mode démo sans GTB ?', a: 'Oui. Le mode démo vous permet d\'explorer toutes les fonctionnalités avec des données réalistes simulées. Aucun matériel n\'est requis pour la démonstration.' },
];

/* ── TESTIMONIALS ── */
const TESTIMONIALS = [
  { name: 'Dr. Samir Ben Salah', role: 'Directeur médical, Clinique El Mourouj · Tunis', text: 'EnergyOS a transformé notre gestion énergétique. Les alertes en temps réel et les plannings automatiques nous ont fait économiser 18% sur notre facture STEG dès le premier mois.', stars: 5, saving: '−18%', avatar: 'SB' },
  { name: 'Ing. Khaled Mansour', role: 'Responsable technique, Polyclinique Ibn Khaldoun · Sousse', text: 'L\'intégration avec notre GTB BACnet s\'est faite en une matinée. Le tableau de bord est extrêmement lisible et les rapports mensuels sont très utiles pour nos réunions de direction.', stars: 5, saving: '−15%', avatar: 'KM' },
  { name: 'Dr. Ines Chérif', role: 'Directrice, Centre Médical El Yasmine · Monastir', text: 'La fonctionnalité de délestage intelligent a éliminé nos dépassements de puissance souscrite. Plus aucune pénalité STEG depuis 8 mois. Je recommande EnergyOS à tous les établissements médicaux.', stars: 5, saving: '−22%', avatar: 'IC' },
];

export default function Landing() {
  const [formData, setFormData] = useState({
    full_name: '', clinic_name: '', email: '', phone: '', country: 'Tunisie', message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chartData = MONTHLY_DATA.labels.map((label, i) => ({
    name: label,
    baseline: MONTHLY_DATA.baseline[i],
    optimized: MONTHLY_DATA.optimized[i],
  }));

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('access_requests').insert([formData]);
      if (error) throw error;
      toast.success('Demande envoyée ! Nous vous contacterons sous 24h.');
      setFormData({ full_name: '', clinic_name: '', email: '', phone: '', country: 'Tunisie', message: '' });
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── INTERSECTION OBSERVER FOR REVEAL ── */
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent-mint/25">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-eco-gradient flex items-center justify-center shadow-eco">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-text-primary tracking-tight">
              Energy<span className="eco-text-gradient">OS</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/solar" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-accent-amber hover:text-accent-amber/80 transition-colors">
              <Sun className="w-3.5 h-3.5" /> Énergie Solaire
            </Link>
            <button onClick={() => scrollTo('request-form')} className="text-sm font-semibold text-text-muted hover:text-text-primary transition-colors">
              Contact
            </button>
            <Link to="/onboarding">
              <button className="text-sm font-bold px-4 py-2 rounded-xl bg-eco-gradient text-white hover:opacity-90 transition-all shadow-eco">
                Démo →
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden reveal">
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{
          backgroundImage: 'linear-gradient(rgb(var(--text-subtle) / 0.1) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--text-subtle) / 0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }} />

        {/* Dynamic Glow Spots */}
        <div className="glow-spot w-[60vw] h-[60vw] -top-[20vw] -left-[10vw]" />
        <div className="glow-spot w-[50vw] h-[50vw] top-[30vh] -right-[15vw] opacity-60" />
        <div className="glow-spot w-[40vw] h-[40vw] -bottom-[10vh] left-[20vw] opacity-40" />

        <div className="max-w-6xl mx-auto px-5 py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left */}
            <div className="flex-1 animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-accent-mint/10 border border-accent-mint/25 rounded-full px-4 py-1.5 mb-6">
                <Leaf className="w-4 h-4 text-accent-mint" />
                <span className="text-sm font-semibold text-accent-mint">Gestion Technique du Bâtiment Médical</span>
              </div>

              <h1 className="font-display text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 text-text-primary">
                Votre clinique consomme trop.<br />
                <span className="eco-text-gradient">EnergyOS</span> s'en occupe.
              </h1>

              <p className="text-lg text-text-muted mb-10 max-w-xl leading-relaxed">
                Supervision intelligente, planification automatique, alertes en temps réel. Réduisez votre facture STEG de 17.7% dès le premier mois.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <button
                  onClick={() => scrollTo('request-form')}
                  className="flex items-center gap-2 px-6 py-3 bg-eco-gradient text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-eco text-sm"
                >
                  Demander l'accès <ArrowRight className="w-4 h-4" />
                </button>
                <Link to="/onboarding">
                  <button className="flex items-center gap-2 px-6 py-3 border border-white/12 text-text-primary font-semibold rounded-xl hover:bg-bg-surface transition-all text-sm">
                    Voir la démo →
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                {['−17.7% consommation', '245 075 kWh/an économisés', 'ROI < 14 mois'].map(s => (
                  <div key={s} className="flex items-center gap-2 bg-accent-mint/8 border border-accent-mint/20 px-4 py-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-mint flex-shrink-0" />
                    <span className="text-sm font-semibold text-text-primary font-mono">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Dashboard mockup */}
            <div className="flex-1 hidden lg:block">
              <div className="relative bg-bg-surface border border-white/10 rounded-2xl p-5 shadow-card-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-white/6">
                  <div className="w-3 h-3 rounded-full bg-accent-red/60" />
                  <div className="w-3 h-3 rounded-full bg-accent-amber/60" />
                  <div className="w-3 h-3 rounded-full bg-accent-mint/60" />
                  <div className="ml-3 h-4 w-32 bg-bg-elevated rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Puissance', val: '87.4 kW', c: 'text-accent-cyan' },
                    { label: 'Aujourd\'hui', val: '348 kWh', c: 'text-accent-mint' },
                    { label: 'cos φ', val: '0.89', c: 'text-accent-amber' },
                    { label: 'Alertes', val: '0', c: 'text-accent-mint' },
                  ].map(m => (
                    <div key={m.label} className="bg-bg-elevated rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-text-muted mb-1">{m.label}</p>
                      <p className={`font-mono font-bold text-lg ${m.c}`}>{m.val}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-bg-elevated rounded-xl p-3 border border-white/5 h-28 flex items-end gap-1.5">
                  {[35, 55, 42, 78, 48, 88, 65, 72, 60, 85, 70, 90].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end">
                      <div className="w-full rounded-t-sm" style={{ height: `${h}%`, background: `rgba(61,186,126,${0.2 + h / 200})` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 relative overflow-hidden reveal">
        <div className="glow-spot w-[40vw] h-[40vw] top-0 -right-[10vw] opacity-30" />
        <div className="max-w-5xl mx-auto px-5 relative z-10">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Déployé en 3 étapes</h2>
            <p className="text-text-muted text-lg">Une intégration fluide. Sans interruption de service.</p>
          </div>
          <div className="relative grid md:grid-cols-3 gap-10">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-accent-mint/30 to-transparent" />
            {[
              { icon: <Plug className="w-8 h-8" />, n: '1', title: 'Connecter', desc: 'Interfaçage GTB via BACnet ou Modbus. Découverte automatique des équipements en moins de 5 minutes.', c: 'bg-accent-mint/12 text-accent-mint' },
              { icon: <BarChart3 className="w-8 h-8" />, n: '2', title: 'Superviser', desc: 'Tableaux de bord dynamiques avec suivi kWh, cos φ, zones et alertes en temps réel.', c: 'bg-accent-cyan/12 text-accent-cyan' },
              { icon: <Leaf className="w-8 h-8" />, n: '3', title: 'Optimiser', desc: 'L\'IA Llama 3.1 recommande des plannings Éco et gère le délestage selon les priorités médicales.', c: 'bg-accent-sage/12 text-accent-sage' },
            ].map(s => (
              <div key={s.n} className="text-center relative z-10">
                <div className={`w-20 h-20 mx-auto rounded-2xl ${s.c} flex items-center justify-center mb-5 relative shadow-card`}>
                  {s.icon}
                  <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-eco-gradient text-white font-bold text-sm flex items-center justify-center shadow-eco">{s.n}</span>
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESULTS CHART ── */}
      <section className="py-20 reveal">
        <div className="max-w-5xl mx-auto px-5">
          <div className="mb-10">
            <h2 className="font-display text-3xl font-bold mb-2">Des résultats réels. Mesurés.</h2>
            <p className="text-text-muted flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-accent-mint" />
              Données réelles — Polyclinique Errachid, Sfax, Tunisie
            </p>
          </div>

          <div className="eco-card p-8 mb-6 relative overflow-hidden">
            <div className="glow-spot w-64 h-64 -top-32 -right-32 opacity-20" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
              <div>
                <h3 className="font-display font-semibold text-text-primary">Consommation mensuelle (kWh)</h3>
                <p className="text-xs text-text-muted">Avant / Après déploiement EnergyOS</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5"><div className="w-3 h-px border-b-2 border-dashed border-text-muted" /><span className="text-text-muted">Avant</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-accent-mint" /><span className="text-text-primary">Avec EnergyOS</span></div>
              </div>
            </div>
            <OverlayChart data={chartData} />
          </div>

          <div className="bg-accent-mint/8 border border-accent-mint/20 rounded-2xl p-5 flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-mint/15 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-accent-mint" />
            </div>
            <div>
              <h4 className="font-semibold text-accent-mint mb-1">Impact Financier Immédiat</h4>
              <p className="text-sm text-text-primary leading-relaxed">
                <span className="font-mono font-bold">{MONTHLY_DATA.totalSaving.toLocaleString()} kWh</span> économisés en 12 mois, soit l'équivalent de <strong>3 mois de facture STEG entièrement remboursés</strong>. ROI atteint en 14 mois.
              </p>
            </div>
          </div>

          <div className="bg-bg-surface border border-white/6 rounded-2xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-elevated border-b border-white/6">
                  <tr>
                    {['Mois', 'Avant GTB', 'Avec EnergyOS', 'Économie'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {chartData.map((row) => {
                    const savings = row.baseline - row.optimized;
                    const pct = ((savings / row.baseline) * 100).toFixed(1);
                    return (
                      <tr key={row.name} className="hover:bg-bg-elevated/40 transition-colors">
                        <td className="px-5 py-3 font-medium text-text-primary">{row.name}</td>
                        <td className="px-5 py-3 font-mono text-text-muted">{row.baseline.toLocaleString()} kWh</td>
                        <td className="px-5 py-3 font-mono text-text-primary">{row.optimized.toLocaleString()} kWh</td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-accent-mint font-semibold">−{savings.toLocaleString()} kWh</span>
                          <span className="text-xs text-text-muted ml-2">({pct}%)</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 relative overflow-hidden reveal">
        <div className="glow-spot w-[50vw] h-[50vw] -bottom-[10vw] -left-[15vw] opacity-40" />
        <div className="max-w-5xl mx-auto px-5 relative z-10">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold mb-3">Fonctionnalités Clés</h2>
            <p className="text-text-muted">Tout ce dont votre établissement de santé a besoin.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: <Activity className="w-5 h-5" />, c: 'text-accent-cyan bg-accent-cyan/10', title: 'Délestage Intelligent', desc: 'Protection automatique contre les dépassements de puissance souscrite. Les zones médicales critiques (Blocs Opératoires, USI) restent toujours alimentées.' },
              { icon: <Zap className="w-5 h-5" />, c: 'text-accent-amber bg-accent-amber/10', title: 'Surveillance cos φ', desc: 'Monitoring continu du facteur de puissance. Alerte immédiate si cos φ < 0.85, évitant les pénalités STEG sur votre facture mensuelle.' },
              { icon: <Grid className="w-5 h-5" />, c: 'text-accent-mint bg-accent-mint/10', title: 'Zonage & Plannings Éco', desc: 'Supervision par zone (médical, admin, support). L\'IA analyse les habitudes et propose des plannings d\'extinction en période creuse.' },
              { icon: <Bell className="w-5 h-5" />, c: 'text-accent-red bg-accent-red/10', title: 'Alertes & Interventions', desc: 'Défauts et anomalies détectés instantanément. Système d\'acquittement pour la traçabilité. Électriciens certifiés disponibles à la demande.' },
            ].map(f => (
              <div key={f.title} className="group eco-card p-8 hover:scale-[1.02]">
                <div className={`w-10 h-10 rounded-xl ${f.c} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-lg mb-2 text-text-primary">{f.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLAR DISCOVER CARD ── */}
      <section className="py-24 relative overflow-hidden reveal">
        <div className="glow-spot w-[50vw] h-[50vw] -top-[10vw] right-[10vw] opacity-20" />
        <div className="max-w-5xl mx-auto px-5 relative z-10">
          <Link to="/solar" className="group block">
            <div className="relative rounded-[28px] overflow-hidden border border-white/8 shadow-card-lg hover:shadow-eco-lg transition-all duration-500 hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #0a1628 50%, #071220 100%)' }}>

              {/* Background glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-30"
                  style={{ background: 'radial-gradient(ellipse at 80% 30%, rgba(14,165,233,0.4) 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 opacity-20"
                  style={{ background: 'radial-gradient(ellipse at 20% 80%, rgba(245,158,11,0.4) 0%, transparent 70%)' }} />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 p-8 md:p-14">
                {/* Left: Image placeholder */}
                <div className="w-full lg:w-[380px] h-[260px] lg:h-[320px] rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0EA5E9 100%)' }}>
                  {/* Replace with actual solar panels image: <img src="/assets/solar-panels-hero.jpg" alt="Panneaux solaires Tunisie EnergyOS" className="w-full h-full object-cover" /> */}
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: 'rgba(245,158,11,0.2)' }}>
                      <Sun className="w-12 h-12" style={{ color: '#F59E0B' }} />
                    </div>
                    <p className="text-white/60 text-sm font-semibold">Image à venir</p>
                    <p className="text-white/40 text-xs mt-1">Panneaux solaires Tunisie</p>
                  </div>
                </div>

                {/* Right: Content */}
                <div className="flex-1 text-left">
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 border"
                    style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }}>
                    <Sun className="w-4 h-4" style={{ color: '#F59E0B' }} />
                    <span className="text-sm font-bold uppercase tracking-wider" style={{ color: '#F59E0B' }}>Découvrez EnergyOS Solaire</span>
                  </div>

                  <h2 className="font-display font-black text-3xl md:text-4xl text-white mb-4 leading-[1.1]">
                    Passez à l'énergie solaire<br />
                    <span style={{ color: '#38BDF8' }}>photovoltaïque</span>
                  </h2>

                  <p className="text-white/60 text-base leading-relaxed mb-6 max-w-md">
                    Réduisez votre facture STEG jusqu'à 90% avec des panneaux solaires certifiés. Installation clé-en-main pour habitations, hôpitaux et agriculture en Tunisie.
                  </p>

                  <div className="flex flex-wrap gap-4 mb-8">
                    {['−73% facture moy.', '25 ans garantie', 'Devis gratuit 24h'].map(s => (
                      <div key={s} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" style={{ color: '#38BDF8' }} />
                        <span className="text-sm font-semibold text-white/80">{s}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-white font-bold group-hover:gap-5 transition-all">
                    <span className="text-base">Explorer l'énergie solaire</span>
                    <ArrowRight className="w-5 h-5" style={{ color: '#38BDF8' }} />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 relative overflow-hidden reveal">
        <div className="glow-spot w-[40vw] h-[40vw] top-0 left-[5vw] opacity-20" />
        <div className="max-w-5xl mx-auto px-5 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent-cyan/10 border border-accent-cyan/25 rounded-full px-4 py-1.5 mb-4">
              <Users className="w-4 h-4 text-accent-cyan" />
              <span className="text-sm font-semibold text-accent-cyan uppercase tracking-wider">Témoignages Clients</span>
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">Ce que pensent nos clients</h2>
            <p className="text-text-muted">Des établissements médicaux qui ont transformé leur gestion énergétique</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="eco-card p-6 flex flex-col gap-4 hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4" style={{ fill: '#F0A030', color: '#F0A030' }} />
                    ))}
                  </div>
                  <span className="text-xs font-bold bg-accent-mint/12 text-accent-mint px-2.5 py-1 rounded-lg">{t.saving}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5 opacity-50" />
                  <p className="text-text-muted text-sm leading-relaxed italic">{t.text}</p>
                </div>
                <div className="flex items-center gap-3 mt-auto pt-3 border-t border-white/6">
                  <div className="w-9 h-9 rounded-full bg-eco-gradient flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{t.name}</p>
                    <p className="text-[11px] text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="py-20 border-t border-white/6 reveal">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3">Questions Fréquentes</h2>
            <p className="text-text-muted text-sm">Tout ce que vous devez savoir sur EnergyOS et la gestion énergétique médicale</p>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`border rounded-xl overflow-hidden transition-all ${openFaq === i ? 'border-accent-mint/40 bg-accent-mint/5' : 'border-white/8 bg-bg-surface'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="font-semibold text-text-primary text-sm">{item.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-accent-mint" />
                    : <ChevronDown className="w-4 h-4 flex-shrink-0 text-text-muted" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUEST FORM ── */}
      <section id="request-form" className="py-20 border-t border-white/6 reveal">
        <div className="max-w-3xl mx-auto px-5">
          <div className="bg-bg-surface border border-accent-mint/15 rounded-2xl p-8 md:p-10 relative overflow-hidden shadow-eco">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-mint/6 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold mb-2">Prêt à réduire votre facture STEG ?</h2>
              <p className="text-text-muted mb-8 text-sm leading-relaxed">
                Demandez un accès privé. Nous déploierons EnergyOS adapté à la configuration de votre clinique.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  {[
                    { name: 'full_name', label: 'Nom & Prénom', placeholder: 'Dr. Ahmed Ben Ali', type: 'text', required: true },
                    { name: 'clinic_name', label: 'Nom de la Clinique', placeholder: 'Polyclinique El Hana', type: 'text', required: true },
                    { name: 'email', label: 'Email Professionnel', placeholder: 'contact@clinique.tn', type: 'email', required: true },
                    { name: 'phone', label: 'Téléphone', placeholder: '+216 71 123 456', type: 'tel', required: false },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-text-primary mb-1.5">{f.label}</label>
                      <input
                        required={f.required}
                        type={f.type}
                        name={f.name}
                        value={formData[f.name]}
                        onChange={handleChange}
                        placeholder={f.placeholder}
                        className="eco-input"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Pays</label>
                  <select name="country" value={formData.country} onChange={handleChange} className="eco-input">
                    {['Tunisie', 'Algérie', 'Maroc', 'Autre'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Message (Optionnel)</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Parlez-nous de vos équipements existants (compteurs, CTA, groupes froids)..."
                    className="eco-input resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-eco-gradient text-white font-bold py-4 rounded-xl hover:opacity-90 active:scale-[0.99] transition-all shadow-eco disabled:opacity-60 text-sm"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Envoyer la demande d'accès</>
                  )}
                </button>

                <p className="text-center text-xs text-text-muted">
                  Vos données sont sécurisées et ne seront jamais partagées.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/6 py-10 reveal">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-5 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-eco-gradient flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-text-primary">Energy<span className="eco-text-gradient">OS</span></span>
            </div>
            <div className="flex gap-6 text-sm text-text-muted">
              <Link to="/onboarding" className="hover:text-text-primary transition-colors">Démo</Link>
              <Link to="/solar" className="hover:text-text-primary transition-colors flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-accent-amber" />Solaire</Link>
              <button onClick={() => scrollTo('request-form')} className="hover:text-text-primary transition-colors">Contact</button>
              <Link to="/admin" className="hover:text-text-primary transition-colors">Administration</Link>
            </div>
          </div>
          <div className="border-t border-white/6 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-text-muted">
            <p>© {new Date().getFullYear()} EnergyOS. Tous droits réservés.</p>
            <p>Projet de Fin d'Études — Ingénierie des Systèmes Intelligents</p>
          </div>
        </div>
      </footer>

      {/* ── BACK TO TOP ── */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-[100] w-12 h-12 rounded-full bg-bg-surface/80 backdrop-blur-md border border-white/10 shadow-eco-lg flex items-center justify-center text-accent-mint transition-all duration-300 hover:scale-110 active:scale-95 group ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
        title="Retour en haut"
      >
        <ChevronUp className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* Global SEO JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "EnergyOS",
          "description": "Plateforme de gestion énergétique intelligente pour cliniques médicales. Réduction de consommation STEG jusqu'à 17.7%.",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TND" },
          "author": { "@type": "Organization", "name": "EnergyOS", "address": { "@type": "PostalAddress", "addressCountry": "TN" } }
        })
      }} />
    </div>
  );
}
