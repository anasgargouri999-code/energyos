import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Zap, Bot, Lock } from 'lucide-react';

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accessCode, setAccessCodeInput] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const setMode = useStore((state) => state.setMode);
  const setAccessCodeStore = useStore((state) => state.setAccessCode);
  const navigate = useNavigate();

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const cards = [
    {
      id: 0,
      icon: <Zap className="w-12 h-12 text-accent-cyan" />,
      title: "Supervision en temps réel",
      description: "Suivez votre consommation énergétique, analysez vos performances et détectez les anomalies instantanément."
    },
    {
      id: 1,
      icon: <Bot className="w-12 h-12 text-accent-cyan" />,
      title: "Configuration IA automatique",
      description: "Notre assistant Groq optimise vos paramètres GTB en fonction de l'historique et des prévisions."
    },
    {
      id: 2,
      icon: <Lock className="w-12 h-12 text-accent-cyan" />,
      title: "Accès multi-niveaux sécurisé",
      description: "Contrôlez les autorisations et l'accès de chaque utilisateur en toute sécurité."
    }
  ];

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    // Only register a swipe if they moved their finger at least 50px
    if (touchStartX.current - touchEndX.current > 50) {
      // swipe left (next)
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
    if (touchStartX.current - touchEndX.current < -50) {
      // swipe right (prev)
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  const handleValidateCode = async () => {
    const trimmedCode = accessCode.trim();
    if (!trimmedCode) return;
    
    setLoading(true);
    setError(false);

    // Hardcoded demo code bypass
    if (trimmedCode.toUpperCase() === 'DEMO-2025-TEST') {
      setTimeout(() => {
        setMode('authenticated');
        setAccessCodeStore('DEMO-2025-TEST');
        localStorage.setItem('energyos_mode', 'authenticated');
        localStorage.setItem('energyos_accessCode', 'DEMO-2025-TEST');
        navigate('/connect');
        setLoading(false);
      }, 600);
      return;
    }
    
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/auth/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode })
      });
      
      if (!response.ok) {
        throw new Error('Code invalide');
      }
      
      const data = await response.json();
      
      if (data.valid) {
        setMode('authenticated');
        setAccessCodeStore(trimmedCode);
        localStorage.setItem('energyos_mode', 'authenticated');
        localStorage.setItem('energyos_accessCode', trimmedCode);
        navigate('/connect');
      } else {
        throw new Error('Code invalide');
      }
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 500); // Remove shake class after animation
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setMode('demo');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center pt-12 pb-6 px-6 font-body text-text-primary overflow-x-hidden">
      {/* Header */}
      <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-green mb-8">
        EnergyOS
      </h1>

      {/* Carousel */}
      <div 
        className="relative w-full max-w-sm overflow-hidden rounded-2xl flex-1 max-h-[300px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {cards.map((card) => (
            <div key={card.id} className="min-w-full flex flex-col items-center justify-center p-8 bg-bg-surface border border-white/5 rounded-2xl">
              <div className="mb-6 p-4 bg-bg-elevated rounded-full border border-white/10 shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                {card.icon}
              </div>
              <h2 className="text-xl font-display font-semibold mb-3 text-center">{card.title}</h2>
              <p className="text-text-muted text-center leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex gap-2 mt-6 mb-12">
        {cards.map((_, idx) => (
          <button
            key={idx}
            className={`h-2 rounded-full transition-all duration-300 ${currentIndex === idx ? 'w-6 bg-accent-cyan' : 'w-2 bg-text-muted/30'}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Action Screen */}
      <div className="w-full max-w-sm mt-auto flex flex-col gap-4">
        <div className="bg-bg-surface p-6 rounded-2xl border border-white/5 space-y-4">
          <label className="block text-sm font-semibold text-text-subtle uppercase tracking-wider">
            Entrer un code d'accès
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Ex: XYZ-123"
              className={`flex-1 bg-bg-primary border rounded-xl px-4 py-3 text-center font-mono tracking-widest outline-none transition-colors ${error ? 'border-accent-red animate-shake' : 'border-white/10 focus:border-accent-cyan'}`}
              value={accessCode}
              onChange={(e) => setAccessCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidateCode()}
            />
          </div>
          {error && <p className="text-accent-red text-sm text-center">Code invalide. Veuillez réessayer.</p>}
          <button 
            onClick={handleValidateCode}
            disabled={loading || !accessCode.trim()}
            className="w-full bg-accent-cyan text-bg-primary font-semibold py-3 rounded-xl hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin border-2 border-bg-primary border-t-transparent rounded-full w-5 h-5" />
            ) : "Valider"}
          </button>
        </div>

        <button 
          onClick={handleDemo}
          className="w-full border border-white/10 text-text-primary py-3 rounded-xl hover:bg-bg-elevated transition"
        >
          Continuer en mode démo
        </button>
      </div>
    </div>
  );
}
