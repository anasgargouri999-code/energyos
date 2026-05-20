import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { getApiBaseUrl } from '../lib/api';
import { Leaf, BarChart3, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

const SLIDES = [
  {
    icon: BarChart3,
    color: 'text-accent-mint',
    bg: 'bg-accent-mint/10',
    title: 'Supervision en temps réel',
    description: 'Suivez votre consommation énergétique zone par zone. Détectez les anomalies avant qu\'elles deviennent des problèmes coûteux.',
  },
  {
    icon: Leaf,
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
    title: 'Éco-optimisation intelligente',
    description: 'L\'IA intégrée analyse votre profil de consommation et propose des plannings d\'extinction optimisés. Économisez jusqu\'à 17.7%.',
  },
  {
    icon: ShieldCheck,
    color: 'text-accent-sage',
    bg: 'bg-accent-sage/10',
    title: 'Accès multi-niveaux sécurisé',
    description: 'Gérez les permissions de chaque collaborateur — planning uniquement, lecture seule, ou accès complet. Votre clinique, vos règles.',
  },
];

export default function Onboarding() {
  const [slide, setSlide] = useState(0);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const setMode = useStore((s) => s.setMode);
  const setAccessCode = useStore((s) => s.setAccessCode);
  const navigate = useNavigate();

  const touchStart = useRef(0);
  const touchEnd   = useRef(0);

  const onTouchStart = (e) => { touchStart.current = e.targetTouches[0].clientX; };
  const onTouchMove  = (e) => { touchEnd.current   = e.targetTouches[0].clientX; };
  const onTouchEnd   = () => {
    const diff = touchStart.current - touchEnd.current;
    if (diff > 50 && slide < SLIDES.length - 1) setSlide(s => s + 1);
    if (diff < -50 && slide > 0)               setSlide(s => s - 1);
  };

  const handleValidate = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(false);

    // Demo bypass
    if (trimmed === 'DEMO-2025-TEST') {
      setTimeout(() => {
        setMode('authenticated');
        setAccessCode(trimmed);
        localStorage.setItem('energyos_mode', 'authenticated');
        localStorage.setItem('energyos_accessCode', trimmed);
        navigate('/connect');
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.valid) {
        setMode('authenticated');
        setAccessCode(trimmed);
        localStorage.setItem('energyos_mode', 'authenticated');
        localStorage.setItem('energyos_accessCode', trimmed);
        navigate('/connect');
      } else {
        throw new Error();
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setMode('demo');
    localStorage.setItem('energyos_mode', 'demo');
    navigate('/dashboard');
  };

  const CurrentIcon = SLIDES[slide].icon;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-5 py-8">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-xl bg-eco-gradient flex items-center justify-center shadow-eco">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-display font-bold text-2xl text-text-primary tracking-tight">
          Energy<span className="eco-text-gradient">OS</span>
        </span>
      </div>

      {/* Slide carousel */}
      <div
        className="relative w-full max-w-sm overflow-hidden mb-2"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-350 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {SLIDES.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="min-w-full flex flex-col items-center text-center px-4 py-8"
              >
                <div className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center mb-5 shadow-eco`}>
                  <Icon className={`w-8 h-8 ${s.color}`} />
                </div>
                <h2 className="font-display font-bold text-xl text-text-primary mb-3 leading-snug">
                  {s.title}
                </h2>
                <p className="text-text-muted text-sm leading-relaxed max-w-xs">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mb-8">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`h-2 rounded-full transition-all duration-250 ${
              slide === i ? 'w-6 bg-accent-mint' : 'w-2 bg-text-subtle'
            }`}
            aria-label={`Diapositive ${i + 1}`}
          />
        ))}
      </div>

      {/* Code entry + actions */}
      <div className="w-full max-w-sm space-y-3">
        <div className="bg-bg-surface border border-white/6 rounded-2xl p-5 space-y-3 shadow-card">
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
            Code d'accès
          </label>
          <input
            type="text"
            placeholder="Ex : ECO-2026"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            className={`eco-input text-center font-mono tracking-widest text-base uppercase ${
              error ? 'ring-2 ring-accent-red/50 border-accent-red/40 animate-shake' : ''
            }`}
          />
          {error && (
            <p className="text-xs text-accent-red text-center font-medium">
              Code invalide — veuillez réessayer.
            </p>
          )}
          <button
            onClick={handleValidate}
            disabled={loading || !code.trim()}
            className="w-full flex items-center justify-center gap-2 bg-eco-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-eco"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Accéder à la plateforme <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        <button
          onClick={handleDemo}
          className="w-full py-3 text-sm text-text-muted hover:text-text-primary border border-white/8 hover:border-white/15 rounded-xl hover:bg-bg-elevated transition-colors"
        >
          Continuer en mode démo →
        </button>

        <p className="text-center text-xs text-text-subtle">
          Vous n'avez pas de code ?{' '}
          <a href="/" className="text-accent-mint hover:underline">Faire une demande d'accès</a>
        </p>
      </div>
    </div>
  );
}
