import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plug, BarChart3, Leaf, Zap, Activity, Grid, Bell, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { MONTHLY_DATA } from '../lib/demoData';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import OverlayChart from '../components/charts/OverlayChart';

export default function Landing() {
  const [formData, setFormData] = useState({
    full_name: '',
    clinic_name: '',
    email: '',
    phone: '',
    country: 'Tunisie',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chartData = MONTHLY_DATA.labels.map((label, index) => ({
    name: label,
    baseline: MONTHLY_DATA.baseline[index],
    optimized: MONTHLY_DATA.optimized[index],
  }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('access_requests')
        .insert([formData]);

      if (error) throw error;
      
      toast.success("Demande envoyée avec succès ! Nous vous contacterons bientôt.");
      setFormData({
        full_name: '',
        clinic_name: '',
        email: '',
        phone: '',
        country: 'Tunisie',
        message: ''
      });
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('request-form').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent-cyan/30">
      
      {/* SECTION 1 - Hero */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            {/* Left Column */}
            <div className="w-full lg:w-[60%] animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="inline-flex items-center space-x-2 bg-accent-cyan/10 border border-accent-cyan/20 rounded-full px-4 py-1.5 mb-6">
                <Zap className="w-4 h-4 text-accent-cyan" />
                <span className="text-sm font-medium text-accent-cyan">🏥 Gestion Technique du Bâtiment</span>
              </div>
              
              <h1 className="font-display text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Votre clinique consomme trop.<br />
                <span className="text-accent-cyan">EnergyOS</span> s'en occupe.
              </h1>
              
              <p className="font-body text-xl text-text-muted mb-10 max-w-2xl leading-relaxed">
                Plateforme de supervision énergétique intelligente. Connectez votre GTB. Visualisez. Économisez.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                <Button size="lg" onClick={scrollToForm} className="w-full sm:w-auto group">
                  Demander l'accès
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Link to="/onboarding" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full">
                    Voir la démo →
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="border border-accent-cyan/30 bg-accent-cyan/5 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <p className="font-mono text-accent-cyan font-semibold">−17.7% consommation</p>
                </div>
                <div className="border border-accent-cyan/30 bg-accent-cyan/5 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <p className="font-mono text-accent-cyan font-semibold">245 075 kWh économisés/an</p>
                </div>
                <div className="border border-accent-cyan/30 bg-accent-cyan/5 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <p className="font-mono text-accent-cyan font-semibold">ROI &lt; 2 ans</p>
                </div>
              </div>
            </div>

            {/* Right Column (CSS Dashboard Mockup) */}
            <div className="w-full lg:w-[40%] hidden md:block">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {/* Decorative glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-cyan/20 rounded-full blur-[100px]"></div>
                
                {/* Mockup Container */}
                <div className="relative bg-bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-1000 delay-300">
                  <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-accent-red"></div>
                      <div className="w-3 h-3 rounded-full bg-accent-amber"></div>
                      <div className="w-3 h-3 rounded-full bg-accent-green"></div>
                    </div>
                    <div className="h-4 w-24 bg-white/5 rounded"></div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Widget 1 */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-bg-elevated/50 border border-white/5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                          <Zap className="text-accent-cyan w-5 h-5" />
                        </div>
                        <div>
                          <div className="h-3 w-20 bg-white/20 rounded mb-2"></div>
                          <div className="h-2 w-12 bg-white/10 rounded"></div>
                        </div>
                      </div>
                      <div className="h-6 w-16 bg-accent-cyan/20 rounded"></div>
                    </div>

                    {/* Chart Mockup */}
                    <div className="p-4 rounded-xl bg-bg-elevated/50 border border-white/5 h-32 flex items-end space-x-2">
                      {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 bg-accent-cyan/20 rounded-t-sm" style={{ height: `${h}%` }}>
                          <div className="w-full bg-accent-cyan" style={{ height: '4px' }}></div>
                        </div>
                      ))}
                    </div>

                    {/* Status Rows */}
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated/30">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
                            <div className="h-2 w-24 bg-white/10 rounded"></div>
                          </div>
                          <div className="h-2 w-8 bg-white/5 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* SECTION 2 - How It Works */}
      <section className="py-24 bg-bg-surface/50 border-y border-white/5 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Déployé en 3 étapes</h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">Une intégration fluide avec vos équipements existants. Sans interruption de service.</p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-white/5 via-accent-cyan/30 to-white/5"></div>
            
            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-bg-elevated border border-white/10 rounded-2xl flex items-center justify-center mb-6 relative group">
                  <div className="absolute inset-0 bg-accent-cyan/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Plug className="w-10 h-10 text-text-primary" />
                  <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent-cyan text-bg-primary font-bold flex items-center justify-center shadow-lg">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Connecter</h3>
                <p className="text-text-muted">Interfaçage avec votre GTB via BACnet ou Modbus. Découverte automatique des équipements.</p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-bg-elevated border border-white/10 rounded-2xl flex items-center justify-center mb-6 relative group">
                  <div className="absolute inset-0 bg-accent-amber/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <BarChart3 className="w-10 h-10 text-text-primary" />
                  <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent-amber text-bg-primary font-bold flex items-center justify-center shadow-lg">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Superviser</h3>
                <p className="text-text-muted">Tableaux de bord dynamiques. Suivi de la consommation (kWh) et du facteur de puissance en temps réel.</p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-bg-elevated border border-white/10 rounded-2xl flex items-center justify-center mb-6 relative group">
                  <div className="absolute inset-0 bg-accent-green/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Leaf className="w-10 h-10 text-text-primary" />
                  <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent-green text-bg-primary font-bold flex items-center justify-center shadow-lg">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Optimiser</h3>
                <p className="text-text-muted">IA intégrée pour recommander des plannings Éco et gérer le délestage selon les priorités médicales.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - Energy Savings Chart */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Des résultats réels. Mesurés.</h2>
            <p className="text-text-muted flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-accent-green" />
              Données réelles — Polyclinique Errachid, Sfax, Tunisie
            </p>
          </div>

          <Card className="p-8 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-bold">Évolution de la consommation énergétique</h3>
                <p className="text-sm text-text-muted">Comparatif Avant/Après déploiement EnergyOS</p>
              </div>
              <div className="flex space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-[#64748B] border-dashed rounded-full mr-2"></div>
                  <span className="text-text-muted">Avant GTB</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-accent-green rounded-full mr-2"></div>
                  <span className="text-text-primary">Avec EnergyOS</span>
                </div>
              </div>
            </div>
            
            <OverlayChart data={chartData} />
          </Card>

          <div className="bg-accent-green/10 border border-accent-green/30 rounded-2xl p-6 flex items-start gap-4 mb-8">
            <div className="bg-accent-green/20 p-3 rounded-xl mt-1">
              <Leaf className="w-6 h-6 text-accent-green" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-accent-green mb-1">Impact Financier Immédiat</h4>
              <p className="text-text-primary leading-relaxed">
                <span className="font-mono font-bold">{MONTHLY_DATA.totalSaving.toLocaleString()} kWh</span> économisés sur la première année, représentant l'équivalent de <strong className="text-white">3 mois de facture STEG entièrement offerts</strong>. Retour sur investissement réalisé en 14 mois.
              </p>
            </div>
          </div>

          {/* Savings Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-bg-elevated text-text-muted">
                  <tr>
                    <th className="px-6 py-4 font-medium">Mois</th>
                    <th className="px-6 py-4 font-medium text-right">Consommation initiale</th>
                    <th className="px-6 py-4 font-medium text-right">Consommation optimisée</th>
                    <th className="px-6 py-4 font-medium text-right">Économie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {chartData.map((row, i) => {
                    const savings = row.baseline - row.optimized;
                    const percent = ((savings / row.baseline) * 100).toFixed(1);
                    return (
                      <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium text-text-primary">{row.name}</td>
                        <td className="px-6 py-4 font-mono text-text-muted text-right">{row.baseline.toLocaleString()} kWh</td>
                        <td className="px-6 py-4 font-mono text-text-primary text-right">{row.optimized.toLocaleString()} kWh</td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono text-accent-green">-{savings.toLocaleString()} kWh</span>
                          <span className="text-xs text-text-muted ml-2">({percent}%)</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* SECTION 4 - Features grid */}
      <section className="py-24 bg-bg-surface/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Fonctionnalités Clés</h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">Tout ce dont vous avez besoin pour maîtriser l'énergie de votre établissement de santé.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 hover:border-accent-cyan/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-bg-primary border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-accent-cyan" />
              </div>
              <h3 className="text-xl font-bold mb-3">Délestage Intelligent</h3>
              <p className="text-text-muted leading-relaxed">
                Protection automatique contre les dépassements de puissance souscrite. Coupe temporairement les charges non-critiques tout en garantissant l'alimentation des zones prioritaires (Blocs Opératoires, USI).
              </p>
            </Card>

            <Card className="p-8 hover:border-accent-amber/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-bg-primary border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-accent-amber" />
              </div>
              <h3 className="text-xl font-bold mb-3">Surveillance Cos Phi</h3>
              <p className="text-text-muted leading-relaxed">
                Surveillance continue du facteur de puissance. Alertes immédiates si le Cos φ chute sous le seuil STEG (0.85), évitant ainsi les pénalités sur votre facture.
              </p>
            </Card>

            <Card className="p-8 hover:border-accent-green/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-bg-primary border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Grid className="w-6 h-6 text-accent-green" />
              </div>
              <h3 className="text-xl font-bold mb-3">Zonage & Plannings Éco</h3>
              <p className="text-text-muted leading-relaxed">
                Supervision par zone (médical, admin, support). L'IA embarquée analyse les habitudes et propose des plannings d'extinction ou de réduction de consigne CVC en période creuse.
              </p>
            </Card>

            <Card className="p-8 hover:border-accent-red/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-bg-primary border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bell className="w-6 h-6 text-accent-red" />
              </div>
              <h3 className="text-xl font-bold mb-3">Alertes Centralisées</h3>
              <p className="text-text-muted leading-relaxed">
                Recevez les défauts (équipement hors ligne, anomalie de conso) instantanément. Interface claire avec système d'acquittement pour la traçabilité des interventions techniques.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 5 - Request Access Form */}
      <section id="request-form" className="py-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <Card className="p-8 md:p-12 border-accent-cyan/20 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/10 blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold mb-2">Prêt à réduire votre facture STEG ?</h2>
              <p className="text-text-muted mb-8">
                Demandez un accès privé. Nous déploierons un environnement démo adapté à la configuration de votre clinique.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Nom & Prénom</label>
                    <input 
                      required
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                      placeholder="Dr. Ahmed Ben Ali"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Nom de la Clinique</label>
                    <input 
                      required
                      type="text"
                      name="clinic_name"
                      value={formData.clinic_name}
                      onChange={handleInputChange}
                      className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                      placeholder="Polyclinique El Hana"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Email Professionnel</label>
                    <input 
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                      placeholder="contact@clinique.tn"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Téléphone</label>
                    <input 
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                      placeholder="+216 71 123 456"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Pays</label>
                  <select 
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors appearance-none"
                  >
                    <option value="Tunisie">Tunisie</option>
                    <option value="Algérie">Algérie</option>
                    <option value="Maroc">Maroc</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Message (Optionnel)</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors resize-none"
                    placeholder="Parlez-nous de vos équipements existants (compteurs, CTA, groupes froids)..."
                  ></textarea>
                </div>

                <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                </Button>
                <p className="text-xs text-text-muted text-center mt-4">
                  Vos données sont sécurisées et ne seront jamais partagées avec des tiers.
                </p>
              </form>
            </div>
          </Card>
        </div>
      </section>

      {/* SECTION 6 - Footer */}
      <footer className="border-t border-white/5 bg-bg-primary pt-12 pb-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-accent-cyan" />
              <span className="font-display font-bold text-xl tracking-tight">Energy<span className="text-accent-cyan">OS</span></span>
            </div>
            <div className="flex space-x-6 text-sm text-text-muted">
              <Link to="/onboarding" className="hover:text-text-primary transition-colors">Démo</Link>
              <a href="#request-form" className="hover:text-text-primary transition-colors">Contact</a>
              <Link to="/admin" className="hover:text-text-primary transition-colors">Administration</Link>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
            <p>© {new Date().getFullYear()} EnergyOS. Tous droits réservés.</p>
            <p>Projet de Fin d'Études — Ingénierie des Systèmes Intelligents</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
