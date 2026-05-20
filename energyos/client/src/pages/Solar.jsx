import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun, Zap, ArrowRight, ChevronUp, CheckCircle2,
  Home, Leaf, TrendingDown, Battery, Shield, Star,
  Calculator, Activity, Building2, Sprout, ChevronDown,
  Phone, Mail, MapPin, ArrowLeft,
  Cpu, Wrench, Droplets, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

/* ─── Solar theme palette ───────────────────────────────── */
const T = {
  bg:       '#F0F9FF',
  surface:  '#FFFFFF',
  card:     '#FFFFFF',
  border:   '#BAE6FD',
  borderMid:'#7DD3FC',
  cyan:     '#0EA5E9',
  deep:     '#0369A1',
  navy:     '#0C1A2E',
  mid:      '#1E40AF',
  muted:    '#475569',
  subtle:   '#94A3B8',
  light:    '#E0F2FE',
  gold:     '#F59E0B',
  goldLight:'#FEF3C7',
  green:    '#22C55E',
  gradH:    'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
  gradSun:  'linear-gradient(135deg, #F59E0B 0%, #EF4444 60%, #DC2626 100%)',
  gradCard: 'linear-gradient(145deg, rgba(14,165,233,0.08) 0%, rgba(2,132,199,0.04) 100%)',
};

/* ─── Simulation constants ──────────────────────────────── */
const STEG_RATE      = 0.19;    // TND/kWh residential average
const PANEL_KWH_MO   = 60;      // kWh/panel/month  (400W × 5h × 30d)
const COST_PER_PANEL = 1100;    // TND installed (400W, all-in)
const OVERHEAD       = 0.18;    // inverter + cables + labor

/* ─── Chart data ────────────────────────────────────────── */
const HOSPITAL_DATA = [
  { m:'Jan', avant:16200, après:9800 }, { m:'Fév', avant:15400, après:9200 },
  { m:'Mar', avant:14800, après:8600 }, { m:'Avr', avant:14200, après:8200 },
  { m:'Mai', avant:16800, après:9600 }, { m:'Juin',avant:18200, après:10200 },
  { m:'Juil',avant:19600, après:11000 },{ m:'Aoû', avant:18800, après:10600 },
  { m:'Sep', avant:16200, après:9400 }, { m:'Oct', avant:15600, après:9000 },
  { m:'Nov', avant:15200, après:9200 }, { m:'Déc', avant:16800, après:9800 },
];
const AGRI_DATA = [
  { m:'Jan', avant:1200, après:180 },  { m:'Fév', avant:1400, après:200 },
  { m:'Mar', avant:2800, après:380 },  { m:'Avr', avant:3600, après:400 },
  { m:'Mai', avant:4200, après:420 },  { m:'Juin',avant:4800, après:460 },
  { m:'Juil',avant:5200, après:480 },  { m:'Aoû', avant:4600, après:440 },
  { m:'Sep', avant:3400, après:380 },  { m:'Oct', avant:2200, après:300 },
  { m:'Nov', avant:1400, après:220 },  { m:'Déc', avant:1100, après:180 },
];
const HOME_DATA = [
  { m:'Jan', avant:280, après:95 }, { m:'Fév', avant:265, après:88 },
  { m:'Mar', avant:240, après:75 }, { m:'Avr', avant:220, après:65 },
  { m:'Mai', avant:310, après:82 }, { m:'Juin',avant:380, après:95 },
  { m:'Juil',avant:420, après:105 },{ m:'Aoû', avant:400, après:98 },
  { m:'Sep', avant:320, après:82 }, { m:'Oct', avant:260, après:76 },
  { m:'Nov', avant:240, après:80 }, { m:'Déc', avant:275, après:92 },
];

/* ─── Testimonials ──────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Dr. Mehdi Elloumi',
    role: 'Directeur, Polyclinique Al Hayat · Sfax',
    text: 'Grâce à EnergyOS Solaire, notre facture STEG a chuté de 38% en 4 mois. L\'installation s\'est faite en une journée, sans interruption d\'activité. Investissement totalement justifié.',
    stars: 5, saving: '−38%', avatar: 'ME',
  },
  {
    name: 'Anis Chouchane',
    role: 'Agriculteur · Kairouan',
    text: 'Mes 24 panneaux alimentent entièrement mes pompes d\'irrigation. ROI en moins de 4 ans, économie de 4 600 TND par an. Je regrette de ne pas l\'avoir fait plus tôt.',
    stars: 5, saving: '−89%', avatar: 'AC',
  },
  {
    name: 'Fatma Ben Amor',
    role: 'Résidence privée · Sousse',
    text: 'Installation propre en une seule journée. Ma facture est passée de 310 TND à 85 TND par mois. L\'équipe EnergyOS était professionnelle et réactive.',
    stars: 5, saving: '−73%', avatar: 'FB',
  },
];

/* ─── FAQ items ─────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'Combien de panneaux solaires faut-il pour une maison en Tunisie ?',
    a: 'Pour une maison consommant 300 kWh/mois (facture STEG ~57 TND), comptez 5 à 6 panneaux de 400W. Notre simulateur calcule précisément votre besoin à partir de votre facture STEG ou de votre consommation mensuelle.',
  },
  {
    q: 'Quelle est la rentabilité des panneaux solaires en Tunisie ?',
    a: 'Avec plus de 3 000 heures de soleil par an, la Tunisie offre un retour sur investissement en 3 à 7 ans selon votre secteur. Après cette période, votre énergie est quasi-gratuite pendant 20 ans supplémentaires.',
  },
  {
    q: 'Y a-t-il des aides de l\'État pour l\'installation solaire ?',
    a: 'Oui. Le programme PROSOL de la STEG permet de financer l\'installation à faible taux d\'intérêt sur 5 ans, avec une subvention pouvant atteindre 30% du coût total. EnergyOS vous accompagne dans les démarches.',
  },
  {
    q: 'Quelle est la durée de vie des panneaux photovoltaïques ?',
    a: 'Les panneaux solaires de qualité garantissent 25 à 30 ans de fonctionnement avec moins de 0,5% de dégradation annuelle. La garantie constructeur couvre généralement 25 ans sur la performance.',
  },
  {
    q: 'Puis-je vendre l\'électricité solaire produite en surplus à la STEG ?',
    a: 'Oui. La loi n°2015-12 autorise les particuliers et entreprises à injecter leur surplus sur le réseau et à être crédités sur leur facture STEG (mécanisme net-metering). EnergyOS gère la démarche pour vous.',
  },
  {
    q: 'Combien de temps dure l\'installation d\'un système solaire ?',
    a: 'Pour une installation résidentielle (4-10 panneaux), l\'installation se fait en 1 journée. Pour les installations industrielles ou hospitalières (30+ panneaux), comptez 2 à 4 jours selon la superficie.',
  },
];

/* ─── Solar facts ────────────────────────────────────────── */
const SOLAR_FACTS = [
  { Icon: Sun,          iconColor: '#F59E0B', val: '3 000+',  label: 'heures de soleil/an en Tunisie',  sub: 'Parmi les plus élevés d\'Afrique du Nord' },
  { Icon: Droplets,     iconColor: '#0EA5E9', val: '−75%',    label: 'coûts d\'irrigation agricole',    sub: 'Pompes solaires autonomes 24h/24' },
  { Icon: Leaf,         iconColor: '#22C55E', val: '3.8T',    label: 'CO₂ évité par 10 panneaux/an',    sub: '≡ planter 190 arbres chaque année' },
  { Icon: Shield,       iconColor: '#6366F1', val: '30%',     label: 'subvention PROSOL disponible',    sub: 'Programme STEG pour installations solaires' },
  { Icon: Zap,          iconColor: '#F59E0B', val: '25 ans',  label: 'durée de vie garantie',           sub: 'Performance > 80% après 25 ans' },
  { Icon: TrendingDown, iconColor: '#0EA5E9', val: '3-7 ans', label: 'retour sur investissement',       sub: 'Selon secteur et consommation' },
];

/* ══════════════════════════════════════════════════════════
   SOLAR CALCULATOR COMPONENT
══════════════════════════════════════════════════════════ */
function SolarCalculator({ onOrderNow }) {
  const [mode, setMode] = useState('bill'); // 'bill' | 'kwh'
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [animating, setAnimating] = useState(false);

  function simulate() {
    const v = parseFloat(value);
    if (!v || v <= 0) { toast.error('Entrez une valeur valide'); return; }
    const kwhMo = mode === 'bill' ? v / STEG_RATE : v;
    const panels = Math.max(1, Math.ceil(kwhMo / PANEL_KWH_MO));
    const baseCost = panels * COST_PER_PANEL;
    const totalCost = Math.round(baseCost * (1 + OVERHEAD) / 100) * 100;
    const annualSave = Math.round(kwhMo * STEG_RATE * 12 * 0.80);
    const payback = (totalCost / annualSave).toFixed(1);
    const co2Saved = Math.round(kwhMo * 12 * 0.47 / 1000 * 10) / 10; // kgCO2/kWh Tunisia
    setAnimating(true);
    setTimeout(() => { setResult({ panels, totalCost, annualSave, payback, co2Saved, kwhMo: Math.round(kwhMo) }); setAnimating(false); }, 300);
  }

  return (
    <div style={{ background: T.surface, borderRadius: 24, border: `2px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 20px 60px rgba(14,165,233,0.12)' }}>
      {/* Header */}
      <div style={{ background: T.gradH, padding: '24px 32px' }}>
        <div className="flex items-center gap-3">
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 10 }}>
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'Sora, sans-serif', color: '#fff', fontWeight: 800, fontSize: 20, margin: 0 }}>
              Simulateur Solaire
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0 }}>Calculez votre besoin en panneaux instantanément</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: T.light, borderRadius: 12, padding: 4 }}>
          {[
            { id: 'bill', label: 'Facture STEG mensuelle', unit: 'TND/mois' },
            { id: 'kwh', label: 'Consommation mensuelle', unit: 'kWh/mois' },
          ].map(opt => (
            <button key={opt.id} onClick={() => { setMode(opt.id); setResult(null); setValue(''); }}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                background: mode === opt.id ? T.cyan : 'transparent',
                color: mode === opt.id ? '#fff' : T.muted,
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            {mode === 'bill' ? 'Montant de votre facture STEG mensuelle' : 'Votre consommation électrique mensuelle'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={value}
              onChange={e => { setValue(e.target.value); setResult(null); }}
              onKeyDown={e => e.key === 'Enter' && simulate()}
              placeholder={mode === 'bill' ? 'ex: 250' : 'ex: 400'}
              style={{
                width: '100%', padding: '14px 70px 14px 18px', borderRadius: 12,
                border: `2px solid ${T.border}`, fontSize: 18, fontWeight: 700,
                color: T.navy, background: T.bg, outline: 'none', boxSizing: 'border-box',
              }}
            />
            <span style={{
              position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, fontWeight: 700, color: T.cyan,
            }}>
              {mode === 'bill' ? 'TND' : 'kWh'}
            </span>
          </div>
        </div>

        <button onClick={simulate}
          style={{
            width: '100%', padding: '15px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: T.gradH, color: '#fff', fontWeight: 800, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', boxShadow: '0 6px 20px rgba(14,165,233,0.35)',
          }}>
          <Sun className="w-5 h-5" /> Calculer mes panneaux
        </button>

        {/* Results */}
        {result && !animating && (
          <div style={{ marginTop: 24 }}>
            <div style={{ height: 1, background: T.border, marginBottom: 24 }} />
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
              Pour une consommation de <strong style={{ color: T.deep }}>{result.kwhMo.toLocaleString()} kWh/mois</strong> :
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Panneaux nécessaires', val: result.panels, unit: 'panneaux 400W', icon: '☀️', bg: T.light, color: T.deep },
                { label: 'Coût total estimé', val: result.totalCost.toLocaleString(), unit: 'TND installés', icon: '💰', bg: T.goldLight, color: '#92400E' },
                { label: 'Économies annuelles', val: result.annualSave.toLocaleString(), unit: 'TND/an économisés', icon: '📉', bg: '#DCFCE7', color: '#166534' },
                { label: 'Retour investissement', val: result.payback, unit: 'années', icon: '⏱️', bg: '#EDE9FE', color: '#5B21B6' },
              ].map(item => (
                <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 18 }}>{item.icon}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: item.color, lineHeight: 1.2 }}>
                    {item.val}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{item.unit}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: item.color, marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: `linear-gradient(135deg, #ECFDF5, #D1FAE5)`, border: '1px solid #6EE7B7', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>🌿</span>
              <p style={{ margin: 0, fontSize: 13, color: '#065F46' }}>
                Ce système évite l'émission de <strong>{result.co2Saved} T CO₂/an</strong> — l'équivalent de planter {Math.round(result.co2Saved * 50)} arbres.
              </p>
            </div>

            <button onClick={onOrderNow}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: '#0F172A', color: '#fff', fontWeight: 800, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              Commander maintenant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   IMPACT CHART CARD
══════════════════════════════════════════════════════════ */
function ImpactCard({ icon: Icon, title, subtitle, data, unit, reduction, chartType = 'bar', color }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`,
      padding: 28, boxShadow: '0 4px 24px rgba(14,165,233,0.08)',
    }}>
      <div className="flex items-center gap-3 mb-4">
        <div style={{ background: T.light, borderRadius: 12, padding: 10 }}>
          <Icon className="w-5 h-5" style={{ color: T.cyan }} />
        </div>
        <div>
          <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, color: T.navy, margin: 0, fontSize: 16 }}>{title}</h4>
          <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>{subtitle}</p>
        </div>
        <div style={{ marginLeft: 'auto', background: '#DCFCE7', borderRadius: 8, padding: '4px 10px' }}>
          <span style={{ fontWeight: 800, color: '#166534', fontSize: 14 }}>{reduction}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        {chartType === 'area' ? (
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="m" tick={{ fontSize: 10, fill: T.subtle }} />
            <YAxis tick={{ fontSize: 10, fill: T.subtle }} />
            <Tooltip
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${v.toLocaleString()} ${unit}`, undefined]}
            />
            <Area type="monotone" dataKey="avant" stroke="#94A3B8" fill="#F1F5F9" strokeDasharray="4 2" name="Avant" />
            <Area type="monotone" dataKey="après" stroke={color} fill={`${color}25`} strokeWidth={2} name="Avec solaire" />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="m" tick={{ fontSize: 10, fill: T.subtle }} />
            <YAxis tick={{ fontSize: 10, fill: T.subtle }} />
            <Tooltip
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${v.toLocaleString()} ${unit}`, undefined]}
            />
            <Bar dataKey="avant" fill="#CBD5E1" radius={[3, 3, 0, 0]} name="Avant" />
            <Bar dataKey="après" fill={color} radius={[3, 3, 0, 0]} name="Avec solaire" />
          </BarChart>
        )}
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, background: '#CBD5E1', borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: T.muted }}>Avant solaire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: T.muted }}>Avec EnergyOS Solaire</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FAQ ITEM
══════════════════════════════════════════════════════════ */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1px solid ${open ? T.borderMid : T.border}`, borderRadius: 14,
      background: open ? T.light : T.surface, overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '18px 22px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontWeight: 700, color: T.navy, fontSize: 15 }}>{q}</span>
        {open ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: T.cyan }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: T.muted }} />}
      </button>
      {open && (
        <div style={{ padding: '0 22px 18px', fontSize: 14, color: T.muted, lineHeight: 1.7 }}>{a}</div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SOLAR FACTS CAROUSEL
══════════════════════════════════════════════════════════ */
function SolarFactsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);
  const VISIBLE = 3;
  const total = SOLAR_FACTS.length;

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % total);
    }, 3500);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const goPrev = () => { setActiveIndex(i => (i - 1 + total) % total); startTimer(); };
  const goNext = () => { setActiveIndex(i => (i + 1) % total); startTimer(); };

  const visibleFacts = Array.from({ length: VISIBLE }, (_, pos) => ({
    fact: SOLAR_FACTS[(activeIndex + pos) % total],
    key: `${(activeIndex + pos) % total}-${pos}`,
  }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {visibleFacts.map(({ fact: f, key }) => {
          const { Icon } = f;
          return (
            <div key={key} style={{
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
              padding: '24px 20px', textAlign: 'center',
              boxShadow: '0 2px 12px rgba(14,165,233,0.06)',
              transition: 'transform 0.25s, box-shadow 0.25s',
              animation: 'solar-card-enter 0.38s ease both',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(14,165,233,0.16)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(14,165,233,0.06)'; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `${f.iconColor}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Icon className="w-6 h-6" style={{ color: f.iconColor }} />
              </div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 24, color: T.cyan, marginBottom: 4 }}>{f.val}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 6 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{f.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 28 }}>
        <button onClick={goPrev}
          style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan; e.currentTarget.style.color = T.cyan; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {SOLAR_FACTS.map((_, i) => (
            <button key={i} onClick={() => { setActiveIndex(i); startTimer(); }}
              style={{ width: i === activeIndex ? 22 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === activeIndex ? T.cyan : T.border, transition: 'all 0.3s', padding: 0 }} />
          ))}
        </div>
        <button onClick={goNext}
          style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan; e.currentTarget.style.color = T.cyan; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function Solar() {
  const [scrollY, setScrollY] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const formRef = useRef(null);
  const calcRef = useRef(null);
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', address: '',
    request_type: 'home', monthly_steg_bill: '', monthly_consumption_kwh: '',
    panels_estimate: '', estimated_cost: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onScroll = () => { setScrollY(window.scrollY); setShowTop(window.scrollY > 500); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Reveal animation */
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('solar-visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.solar-reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  function scrollToForm() { formRef.current?.scrollIntoView({ behavior: 'smooth' }); }
  function scrollToCalc() { calcRef.current?.scrollIntoView({ behavior: 'smooth' }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        request_type: formData.request_type,
        monthly_steg_bill: formData.monthly_steg_bill ? parseFloat(formData.monthly_steg_bill) : null,
        monthly_consumption_kwh: formData.monthly_consumption_kwh ? parseFloat(formData.monthly_consumption_kwh) : null,
        panels_estimate: formData.panels_estimate ? parseInt(formData.panels_estimate) : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        message: formData.message || null,
      };
      const { error } = await supabase.from('solar_requests').insert([payload]);
      if (error) throw error;
      toast.success('Demande envoyée ! Notre équipe vous contactera sous 24h.');
      setFormData({ full_name:'', email:'', phone:'', address:'', request_type:'home', monthly_steg_bill:'', monthly_consumption_kwh:'', panels_estimate:'', estimated_cost:'', message:'' });
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── inject CSS for reveal + parallax ── */
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .solar-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
      .solar-reveal.solar-visible { opacity: 1; transform: none; }
      .solar-reveal-delay-1.solar-visible { transition-delay: 0.1s; }
      .solar-reveal-delay-2.solar-visible { transition-delay: 0.2s; }
      .solar-reveal-delay-3.solar-visible { transition-delay: 0.3s; }
      @keyframes solar-spin { to { transform: rotate(360deg); } }
      @keyframes solar-pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
      @keyframes solar-float { 0%,100%{transform:translateY(0) translateZ(0)} 50%{transform:translateY(-7px) translateZ(0)} }
      @keyframes solar-ray { 0%,100%{opacity:0.3} 50%{opacity:0.9} }
      @keyframes solar-card-enter { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      .solar-page input:focus, .solar-page select:focus, .solar-page textarea:focus {
        border-color: #0EA5E9 !important; outline: none !important;
        box-shadow: 0 0 0 3px rgba(14,165,233,0.15) !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="solar-page" style={{ background: T.bg, color: T.navy, minHeight: '100vh', fontFamily: 'Nunito, sans-serif' }}>

      {/* ── STICKY NAV ──────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(240,249,255,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.muted, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              <ArrowLeft className="w-4 h-4" /> EnergyOS
            </Link>
            <span style={{ color: T.border }}>|</span>
            <div className="flex items-center gap-2">
              <div style={{ width: 30, height: 30, borderRadius: 8, background: T.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sun className="w-4 h-4 text-white" />
              </div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 16, color: T.navy }}>
                Énergie<span style={{ color: T.cyan }}>Solaire</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={scrollToCalc}
              style={{ fontSize: 13, fontWeight: 600, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
              Simuler
            </button>
            <button onClick={scrollToForm}
              style={{
                fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 10,
                background: T.gradH, color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
              }}>
              Demander un devis →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '92vh' }}>
        {/* Parallax BG */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 80% 60% at 65% 40%, rgba(14,165,233,0.13) 0%, transparent 70%)`,
          transform: `translateY(${scrollY * 0.25}px)`,
        }} />

        {/* Full-width two-column grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
          alignItems: 'center', minHeight: '92vh',
          position: 'relative', zIndex: 10,
        }}>
          {/* Left: text content */}
          <div style={{
            padding: 'clamp(60px, 8vh, 100px) clamp(32px, 5vw, 80px) clamp(60px, 8vh, 100px) clamp(32px, 6vw, 100px)',
            transform: `translateY(${scrollY * 0.05}px)`,
          }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: T.light, border: `1px solid ${T.borderMid}`,
              borderRadius: 100, padding: '6px 16px', marginBottom: 24,
            }}>
              <Sun className="w-4 h-4" style={{ color: T.gold }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T.deep }}>Énergie Solaire · Tunisie · PROSOL</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(38px, 4.5vw, 64px)', fontWeight: 900, lineHeight: 1.05, color: T.navy, marginBottom: 20 }}>
              Panneaux solaires<br />
              <span style={{ background: 'linear-gradient(90deg, #0EA5E9, #0284C7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                photovoltaïques
              </span>{' '}
              pour la<br />Tunisie
            </h1>

            <p style={{ fontSize: 18, color: T.muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 520 }}>
              Installation solaire clé-en-main pour habitations, hôpitaux, et agriculture.
              Réduisez votre facture STEG de <strong style={{ color: T.deep }}>jusqu'à 90%</strong> avec un système certifié garanti 25 ans.
            </p>

            {/* Stats bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, marginBottom: 36 }}>
              {[
                { val: '3 000+', label: 'heures soleil/an' },
                { val: '−73%', label: 'réduction moy. facture' },
                { val: '25 ans', label: 'garantie performance' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 30, color: T.cyan }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={scrollToCalc}
                style={{
                  padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: T.gradH, color: '#fff', fontWeight: 800, fontSize: 15,
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 8px 24px rgba(14,165,233,0.4)',
                }}>
                <Calculator className="w-4 h-4" /> Simuler ma consommation
              </button>
              <button onClick={scrollToForm}
                style={{
                  padding: '14px 28px', borderRadius: 12, cursor: 'pointer',
                  background: T.surface, color: T.deep, fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: `2px solid ${T.borderMid}`,
                }}>
                Demander un devis →
              </button>
            </div>
          </div>

          {/* Right: SVG graphic */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(40px, 5vh, 80px) clamp(32px, 5vw, 80px)',
            transform: `translateY(${scrollY * 0.1}px)`,
          }}>
            <svg viewBox="0 0 500 500" style={{ width: '100%', maxWidth: 560, height: 'auto', opacity: 0.9 }}>
              {[220, 190, 160].map((r, i) => (
                <circle key={r} cx={250} cy={250} r={r}
                  fill="none" stroke={`rgba(14,165,233,${0.06 + i * 0.04})`} strokeWidth={i === 0 ? 1 : 2}
                  strokeDasharray={i === 2 ? '6 4' : 'none'}
                  style={{ animation: `solar-pulse ${3 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
              ))}
              <defs>
                <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="40%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </radialGradient>
                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(14,165,233,0.25)" />
                  <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                </radialGradient>
                <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
              </defs>
              <circle cx={250} cy={250} r={200} fill="url(#glowGrad)" />
              <g style={{ transformOrigin: '250px 250px', animation: 'solar-spin 30s linear infinite' }}>
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 * Math.PI) / 180;
                  const x1 = 250 + Math.cos(angle) * 110;
                  const y1 = 250 + Math.sin(angle) * 110;
                  const x2 = 250 + Math.cos(angle) * 145;
                  const y2 = 250 + Math.sin(angle) * 145;
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(245,158,11,0.6)" strokeWidth={i % 3 === 0 ? 3 : 1.5}
                    style={{ animation: `solar-ray ${1.5 + (i % 4) * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />;
                })}
              </g>
              <circle cx={250} cy={250} r={95} fill="url(#sunGrad)"
                style={{ animation: 'solar-pulse 4s ease-in-out infinite', filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.5))' }} />
              <g transform="translate(60, 300)" style={{ animation: 'solar-float 5s ease-in-out infinite', animationDelay: '0.5s', willChange: 'transform' }}>
                <rect x={0} y={0} width={160} height={110} rx={8} fill="url(#panelGrad)" opacity={0.95} />
                {[40, 80, 120].map(x => <line key={x} x1={x} y1={0} x2={x} y2={110} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />)}
                {[27, 55, 82].map(y => <line key={y} x1={0} y1={y} x2={160} y2={y} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />)}
                <rect x={0} y={0} width={160} height={110} rx={8} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
                <text x={80} y={135} textAnchor="middle" fontSize={11} fill={T.deep} fontWeight={700}>Panneau 400W</text>
              </g>
              <g transform="translate(310, 320)" style={{ animation: 'solar-float 4.5s ease-in-out infinite', animationDelay: '1.2s', willChange: 'transform' }}>
                {/* shadow rendered as SVG rect so no CSS filter repaint on animated element */}
                <rect x={2} y={4} width={130} height={70} rx={10} fill="rgba(14,165,233,0.10)" />
                <rect x={0} y={0} width={130} height={70} rx={10} fill="white" />
                <rect x={0} y={0} width={130} height={5} rx={10} fill={T.cyan} />
                <text x={65} y={27} textAnchor="middle" fontSize={9} fill={T.muted} fontWeight={600}>PRODUCTION JOURNALIÈRE</text>
                <text x={65} y={46} textAnchor="middle" fontSize={18} fill={T.deep} fontWeight={800} fontFamily="JetBrains Mono">2.4 kWh</text>
                <text x={65} y={62} textAnchor="middle" fontSize={9} fill="#22C55E" fontWeight={700}>↑ +8% vs hier</text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* ── CALCULATOR SECTION ──────────────────────────── */}
      <section ref={calcRef} className="solar-reveal" style={{ padding: '80px 20px', background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 48, alignItems: 'center' }}>
            {/* Left: info */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.light, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 14px', marginBottom: 18 }}>
                <Calculator className="w-3.5 h-3.5" style={{ color: T.cyan }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.deep, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Simulateur Gratuit</span>
              </div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 36, fontWeight: 900, color: T.navy, lineHeight: 1.2, marginBottom: 16 }}>
                Combien de panneaux<br />
                <span style={{ color: T.cyan }}>solaires vous faut-il ?</span>
              </h2>
              <p style={{ color: T.muted, fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
                Entrez votre facture STEG mensuelle ou votre consommation en kWh. Notre algorithme calcule instantanément le nombre de panneaux, le coût estimé, et votre retour sur investissement.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Calcul basé sur 5h d\'ensoleillement/jour (Tunisie)',
                  'Panneaux 400W haute performance',
                  'Prix tout inclus : panneau + onduleur + pose',
                  'Estimation conservatrice (résultats souvent meilleurs)',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: T.green }} />
                    <span style={{ fontSize: 14, color: T.muted }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: calculator */}
            <SolarCalculator onOrderNow={scrollToForm} />
          </div>
        </div>
      </section>

      {/* ── IMPACT BY SECTOR ────────────────────────────── */}
      <section className="solar-reveal" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.light, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 14px', marginBottom: 16 }}>
              <Activity className="w-3.5 h-3.5" style={{ color: T.cyan }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.deep, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Impact Réel · Données Mesurées</span>
            </div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 36, fontWeight: 900, color: T.navy }}>
              L'énergie solaire photovoltaïque<br />
              <span style={{ color: T.cyan }}>transforme chaque secteur</span>
            </h2>
            <p style={{ color: T.muted, fontSize: 16, maxWidth: 600, margin: '12px auto 0' }}>
              Hôpitaux, agriculture ou résidentiel — les panneaux solaires en Tunisie offrent des économies massives grâce à l'ensoleillement exceptionnel du pays.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            <div className="solar-reveal solar-reveal-delay-1">
              {/* Placeholder image for hospital */}
              <div style={{ height: 180, borderRadius: '20px 20px 0 0', overflow: 'hidden', background: 'linear-gradient(135deg, #1E3A5F, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, position: 'relative' }}>
                <Building2 className="w-12 h-12 text-white opacity-70" />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hôpital & Clinique</span>
                {/* Replace with actual image: <img src="/assets/solar-hospital.jpg" alt="Panneaux solaires hôpital Tunisie" /> */}
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  Photo à venir
                </div>
              </div>
              <ImpactCard
                icon={Building2} title="Établissements médicaux" subtitle="Coût électrique mensuel (TND)"
                data={HOSPITAL_DATA} unit="TND" reduction="−40%" chartType="bar" color={T.cyan}
              />
            </div>

            <div className="solar-reveal solar-reveal-delay-2">
              <div style={{ height: 180, borderRadius: '20px 20px 0 0', overflow: 'hidden', background: 'linear-gradient(135deg, #14532D, #22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, position: 'relative' }}>
                <Sprout className="w-12 h-12 text-white opacity-70" />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Agriculture & Irrigation</span>
                {/* Replace with: <img src="/assets/solar-agriculture.jpg" alt="Pompes solaires irrigation Tunisie" /> */}
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>Photo à venir</div>
              </div>
              <ImpactCard
                icon={Sprout} title="Agriculture & Irrigation" subtitle="Coût pompage mensuel (TND)"
                data={AGRI_DATA} unit="TND" reduction="−89%" chartType="area" color="#22C55E"
              />
            </div>

            <div className="solar-reveal solar-reveal-delay-3">
              <div style={{ height: 180, borderRadius: '20px 20px 0 0', overflow: 'hidden', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, position: 'relative' }}>
                <Home className="w-12 h-12 text-white opacity-70" />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Résidentiel & Maison</span>
                {/* Replace with: <img src="/assets/solar-home.jpg" alt="Panneaux solaires maison Tunisie" /> */}
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>Photo à venir</div>
              </div>
              <ImpactCard
                icon={Home} title="Résidentiel & Maison" subtitle="Facture STEG mensuelle (TND)"
                data={HOME_DATA} unit="TND" reduction="−73%" chartType="bar" color="#8B5CF6"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLAR FACTS CARDS ───────────────────────────── */}
      <section className="solar-reveal" style={{ padding: '60px 20px', background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 30, fontWeight: 900, color: T.navy, textAlign: 'center', marginBottom: 12 }}>
            Pourquoi l'énergie solaire en Tunisie ?
          </h2>
          <p style={{ color: T.muted, textAlign: 'center', marginBottom: 40, fontSize: 15 }}>
            Photovoltaïque, autoconsommation, net-metering — le contexte tunisien est idéal pour l'investissement solaire.
          </p>
          <SolarFactsCarousel />
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="solar-reveal" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 34, fontWeight: 900, color: T.navy }}>
              Installation solaire en <span style={{ color: T.cyan }}>3 étapes simples</span>
            </h2>
            <p style={{ color: T.muted, fontSize: 15, maxWidth: 500, margin: '10px auto 0' }}>De l'audit à la production — nous gérons tout.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, position: 'relative' }}>
            {[
              { n: '01', icon: <Calculator className="w-7 h-7" />, title: 'Audit & Simulation', desc: 'Nous analysons votre consommation, votre toiture et votre exposition solaire. Vous recevez une simulation précise sous 24h.' },
              { n: '02', icon: <Zap className="w-7 h-7" />, title: 'Installation Certifiée', desc: 'Nos techniciens accrédités installent votre système en 1 à 4 jours. Pose propre, câblage conforme, mise en service comprise.' },
              { n: '03', icon: <Activity className="w-7 h-7" />, title: 'Monitoring IoT', desc: 'La plateforme EnergyOS surveille votre production solaire en temps réel. Alertes, rapports mensuels, optimisation continue.' },
            ].map((step, i) => (
              <div key={step.n} className={`solar-reveal solar-reveal-delay-${i + 1}`} style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20,
                padding: 28, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 16, right: 16, fontFamily: 'Sora, sans-serif', fontSize: 40, fontWeight: 900, color: T.border, lineHeight: 1 }}>{step.n}</div>
                <div style={{ background: T.gradH, width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 18 }}>
                  {step.icon}
                </div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18, color: T.navy, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────── */}
      <section className="solar-reveal" style={{ padding: '80px 20px', background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 32, fontWeight: 900, color: T.navy }}>
              Ce que disent nos clients
            </h2>
            <p style={{ color: T.muted, fontSize: 15 }}>Ils ont réduit leur facture STEG avec EnergyOS Solaire</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`solar-reveal solar-reveal-delay-${i + 1}`} style={{
                background: T.card, border: `1px solid ${T.border}`, borderRadius: 20,
                padding: 28, boxShadow: '0 4px 20px rgba(14,165,233,0.08)',
              }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: T.gradH,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, color: '#fff', fontFamily: 'Sora, sans-serif',
                    }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: T.navy }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{t.role}</div>
                    </div>
                  </div>
                  <div style={{ background: '#DCFCE7', borderRadius: 8, padding: '4px 10px', fontWeight: 800, fontSize: 14, color: '#166534' }}>{t.saving}</div>
                </div>
                <div className="flex mb-3">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4" style={{ fill: T.gold, color: T.gold }} />
                  ))}
                </div>
                <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.7, fontStyle: 'italic' }}>"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="solar-reveal" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 32, fontWeight: 900, color: T.navy }}>
              Questions fréquentes sur les<br />
              <span style={{ color: T.cyan }}>panneaux solaires en Tunisie</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── MINI ARTICLE CARDS ──────────────────────────── */}
      <section className="solar-reveal" style={{ padding: '60px 20px', background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.light, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 14px', marginBottom: 28 }}>
            <Leaf className="w-3.5 h-3.5" style={{ color: T.cyan }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.deep, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Énergie Verte · Tunisie</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {[
              {
                tag: 'Photovoltaïque',
                title: 'Système solaire on-grid vs off-grid',
                desc: 'Un système connecté au réseau (on-grid) vous permet de vendre votre surplus à la STEG. Un système autonome (off-grid) vous rend totalement indépendant.',
                Icon: Zap, iconColor: '#0EA5E9',
              },
              {
                tag: 'Technologie',
                title: 'Monocristallin vs polycristallin',
                desc: 'Les panneaux monocristallins offrent 20-22% d\'efficacité contre 15-17% pour le polycristallin. Idéal pour toitures à surface limitée.',
                Icon: Cpu, iconColor: '#6366F1',
              },
              {
                tag: 'Financement',
                title: 'PROSOL & aides de l\'État',
                desc: 'Le programme PROSOL ELEC de la STEG subventionne les installations photovoltaïques résidentielles jusqu\'à 30% avec prêt bancaire à taux réduit.',
                Icon: TrendingDown, iconColor: '#22C55E',
              },
              {
                tag: 'Maintenance',
                title: 'Entretien d\'un système solaire',
                desc: 'Un nettoyage 2 fois par an suffit. Sans pièces mobiles, les panneaux solaires n\'ont quasiment aucun entretien. Durée de vie 25-30 ans.',
                Icon: Wrench, iconColor: '#F59E0B',
              },
            ].map((article, i) => (
              <div key={i} style={{
                background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
                padding: '22px 20px', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderMid; e.currentTarget.style.boxShadow = '0 8px 24px rgba(14,165,233,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${article.iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <article.Icon className="w-5 h-5" style={{ color: article.iconColor }} />
                </div>
                <div style={{ display: 'inline-block', background: T.light, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: T.deep, marginBottom: 10 }}>{article.tag}</div>
                <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 15, color: T.navy, marginBottom: 8, lineHeight: 1.4 }}>{article.title}</h4>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{article.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUEST FORM ────────────────────────────────── */}
      <section ref={formRef} className="solar-reveal" id="solar-form" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 34, fontWeight: 900, color: T.navy }}>
              Demandez votre<br />
              <span style={{ color: T.cyan }}>devis solaire gratuit</span>
            </h2>
            <p style={{ color: T.muted, fontSize: 15, marginTop: 10 }}>
              Audit gratuit · Réponse sous 24h · Installation certifiée STEG
            </p>
          </div>

          <div style={{
            background: T.surface, borderRadius: 24, border: `2px solid ${T.border}`,
            padding: '40px 36px', boxShadow: '0 20px 60px rgba(14,165,233,0.1)',
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {[
                  { name: 'full_name', label: 'Nom & Prénom *', placeholder: 'Ahmed Ben Ali', type: 'text', required: true },
                  { name: 'email', label: 'Email *', placeholder: 'contact@example.com', type: 'email', required: true },
                  { name: 'phone', label: 'Téléphone', placeholder: '+216 71 123 456', type: 'tel', required: false },
                  { name: 'address', label: 'Ville / Adresse', placeholder: 'Tunis, Sfax…', type: 'text', required: false },
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{f.label}</label>
                    <input
                      required={f.required} type={f.type} name={f.name}
                      value={formData[f.name]} onChange={e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: 10, border: `2px solid ${T.border}`,
                        fontSize: 14, color: T.navy, background: T.bg, boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Type d'installation *</label>
                <select name="request_type" value={formData.request_type}
                  onChange={e => setFormData(p => ({ ...p, request_type: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `2px solid ${T.border}`, fontSize: 14, color: T.navy, background: T.bg }}>
                  <option value="home">Résidentiel / Maison</option>
                  <option value="hospital">Hôpital / Clinique</option>
                  <option value="agriculture">Agriculture / Irrigation</option>
                  <option value="commercial">Commercial / Entreprise</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Facture STEG mensuelle (TND)</label>
                  <input type="number" name="monthly_steg_bill" value={formData.monthly_steg_bill}
                    onChange={e => setFormData(p => ({ ...p, monthly_steg_bill: e.target.value }))}
                    placeholder="ex: 280"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `2px solid ${T.border}`, fontSize: 14, color: T.navy, background: T.bg, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Consommation mensuelle (kWh)</label>
                  <input type="number" name="monthly_consumption_kwh" value={formData.monthly_consumption_kwh}
                    onChange={e => setFormData(p => ({ ...p, monthly_consumption_kwh: e.target.value }))}
                    placeholder="ex: 400"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `2px solid ${T.border}`, fontSize: 14, color: T.navy, background: T.bg, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Message / Informations complémentaires</label>
                <textarea name="message" value={formData.message}
                  onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  rows={3} placeholder="Surface de toiture disponible, contraintes particulières, délai souhaité…"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `2px solid ${T.border}`, fontSize: 14, color: T.navy, background: T.bg, resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button type="submit" disabled={submitting}
                style={{
                  width: '100%', padding: '16px 24px', borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                  background: submitting ? T.border : T.gradH, color: '#fff', fontWeight: 800, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: submitting ? 'none' : '0 8px 24px rgba(14,165,233,0.4)',
                  transition: 'all 0.2s',
                }}>
                {submitting ? (
                  <span style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <><Sun className="w-5 h-5" /> Envoyer ma demande de devis gratuit</>
                )}
              </button>

              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {[
                  { icon: <Shield className="w-3.5 h-3.5" />, text: 'Audit 100% gratuit' },
                  { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: 'Réponse sous 24h' },
                  { icon: <Battery className="w-3.5 h-3.5" />, text: 'Installation certifiée' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-1.5">
                    <span style={{ color: T.cyan }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: '40px 20px', background: T.surface }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: T.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sun className="w-4 h-4 text-white" />
              </div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 16, color: T.navy }}>
                EnergyOS <span style={{ color: T.cyan }}>Solaire</span>
              </span>
            </div>
            <nav className="flex flex-wrap gap-6">
              {[
                { label: 'Simulateur', action: scrollToCalc },
                { label: 'Impact', action: () => null },
                { label: 'Devis gratuit', action: scrollToForm },
              ].map(l => (
                <button key={l.label} onClick={l.action}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: T.muted }}>
                  {l.label}
                </button>
              ))}
              <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: T.muted, textDecoration: 'none' }}>← EnergyOS</Link>
            </nav>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 24, paddingTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
            <p style={{ fontSize: 12, color: T.subtle }}>© {new Date().getFullYear()} EnergyOS Solaire — Panneaux solaires photovoltaïques Tunisie</p>
            <p style={{ fontSize: 12, color: T.subtle }}>Installation solaire · PROSOL · Net-metering · Énergie renouvelable</p>
          </div>
        </div>
      </footer>

      {/* ── BACK TO TOP ─────────────────────────────────── */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 100,
          width: 48, height: 48, borderRadius: '50%', border: `2px solid ${T.borderMid}`,
          background: T.surface, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(14,165,233,0.2)',
          opacity: showTop ? 1 : 0, transform: showTop ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.3s', pointerEvents: showTop ? 'auto' : 'none',
          color: T.cyan,
        }}>
        <ChevronUp className="w-5 h-5" />
      </button>

      {/* SEO JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Installation Panneaux Solaires Photovoltaïques Tunisie — EnergyOS Solaire',
        description: 'Service d\'installation de panneaux solaires photovoltaïques en Tunisie. Résidentiel, hôpitaux, agriculture. Devis gratuit, PROSOL, net-metering, garantie 25 ans.',
        provider: { '@type': 'Organization', name: 'EnergyOS', address: { '@type': 'PostalAddress', addressCountry: 'TN' } },
        areaServed: { '@type': 'Country', name: 'Tunisia' },
        serviceType: 'Installation panneaux solaires',
        keywords: 'panneaux solaires Tunisie, énergie solaire, photovoltaïque, PROSOL, STEG, installation solaire, prix panneaux solaires, énergie renouvelable Tunisie',
      })}} />
    </div>
  );
}
