import React from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import OverlayChart from '../components/charts/OverlayChart';
import { MONTHLY_DATA } from '../lib/demoData';
import { TrendingDown, Zap, Users } from 'lucide-react';

export default function Energy() {
  const chartData = MONTHLY_DATA.labels.map((label, index) => ({
    name: label,
    baseline: MONTHLY_DATA.baseline[index],
    optimized: MONTHLY_DATA.optimized[index],
  }));

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Analyse Énergétique" />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2 text-text-muted">
                <Zap className="w-5 h-5" />
                <h3 className="font-medium">Indice de Performance (IPE)</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-text-primary font-mono">473.8</span>
                <span className="text-text-muted text-sm">kWh/m²</span>
              </div>
              <div className="mt-2 text-sm text-accent-green flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                <span>-17.7% vs Baseline (575.9)</span>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2 text-text-muted">
                <Users className="w-5 h-5" />
                <h3 className="font-medium">Énergie par Patient-Jour</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-text-primary font-mono">14.2</span>
                <span className="text-text-muted text-sm">kWh/pj</span>
              </div>
              <div className="mt-2 text-sm text-text-muted">Estimation sur 30 jours</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2 text-text-muted">
                <TrendingDown className="w-5 h-5" />
                <h3 className="font-medium">Économie Totale Annuelle</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-accent-green font-mono">245 075</span>
                <span className="text-text-muted text-sm">kWh</span>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-6">Comparaison Consommation Mensuelle (Baseline vs Optimisé)</h2>
            <div className="h-80 w-full">
              <OverlayChart data={chartData} />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-4 text-text-muted font-medium">Mois</th>
                    <th className="p-4 text-text-muted font-medium">Baseline (kWh)</th>
                    <th className="p-4 text-text-muted font-medium">Optimisé (kWh)</th>
                    <th className="p-4 text-text-muted font-medium">Économie (kWh)</th>
                    <th className="p-4 text-text-muted font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTHLY_DATA.labels.map((label, idx) => {
                    const baseline = MONTHLY_DATA.baseline[idx];
                    const opt = MONTHLY_DATA.optimized[idx];
                    const saving = baseline - opt;
                    const pct = ((saving / baseline) * 100).toFixed(1);
                    return (
                      <tr key={label} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-4 text-text-primary font-medium">{label}</td>
                        <td className="p-4 text-text-muted font-mono">{baseline.toLocaleString('fr-FR')}</td>
                        <td className="p-4 text-text-primary font-mono">{opt.toLocaleString('fr-FR')}</td>
                        <td className="p-4 text-accent-green font-mono">-{saving.toLocaleString('fr-FR')}</td>
                        <td className="p-4 text-accent-green font-mono">-{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="bg-accent-green/10 border border-accent-green/20 rounded-2xl p-6 text-center">
            <h3 className="text-accent-green font-semibold mb-2">Bilan Annuel Projeté</h3>
            <p className="text-text-primary text-lg font-display">
              <span className="line-through text-text-muted mr-2">1 382 142 kWh</span>
              → 1 137 067 kWh — Économie: <span className="text-accent-green font-bold">245 075 kWh (17.7%)</span>
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
