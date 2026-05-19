import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import OverlayChart from '../components/charts/OverlayChart';
import { MONTHLY_DATA } from '../lib/demoData';
import { isDbConfigured, fetchMonthlySavings } from '../lib/db';
import { TrendingDown, Zap, Users, Wallet } from 'lucide-react';

export default function Energy() {
  const [data, setData] = useState(MONTHLY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavings() {
      if (isDbConfigured()) {
        const { data: dbData, error } = await fetchMonthlySavings();
        if (dbData) {
          setData(dbData);
          setLoading(false);
          return;
        }
      }
      setData(MONTHLY_DATA);
      setLoading(false);
    }
    loadSavings();
  }, []);

  const totalBaseline = data.baseline.reduce((sum, v) => sum + v, 0);
  const totalOptimized = data.optimized.reduce((sum, v) => sum + v, 0);
  const totalSaving = totalBaseline - totalOptimized;
  const savingPercent = ((totalSaving / totalBaseline) * 100).toFixed(1);

  // Polyclinique Errachid parameters: 4200 m2
  const surfaceArea = 4200;
  const ipeBaseline = (totalBaseline / surfaceArea).toFixed(1);
  const ipeOptimized = (totalOptimized / surfaceArea).toFixed(1);

  // Total bill in millimes to DT converter
  const totalBillDT = data.bills
    ? (data.bills.reduce((sum, v) => sum + v, 0) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
    : ((totalOptimized * 0.230)).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  const totalSavingDT = data.bills
    ? ((totalSaving * 0.230)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
    : ((totalSaving * 0.230)).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  const chartData = data.labels.map((label, index) => ({
    name: label,
    baseline: data.baseline[index],
    optimized: data.optimized[index],
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
                <span className="text-3xl font-display font-bold text-text-primary font-mono">{ipeOptimized}</span>
                <span className="text-text-muted text-sm">kWh/m²</span>
              </div>
              <div className="mt-2 text-sm text-accent-green flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                <span>-{savingPercent}% vs Baseline ({ipeBaseline})</span>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2 text-text-muted">
                <Wallet className="w-5 h-5" />
                <h3 className="font-medium">Facture Annuelle STEG</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-text-primary font-mono">{totalBillDT}</span>
                <span className="text-text-muted text-sm">DT</span>
              </div>
              <div className="mt-2 text-sm text-text-muted">Calculé sur tarifs réels STEG</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2 text-text-muted">
                <TrendingDown className="w-5 h-5" />
                <h3 className="font-medium">Économie Annuelle</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-accent-green font-mono">
                  {totalSaving.toLocaleString('fr-FR')}
                </span>
                <span className="text-text-muted text-sm">kWh ({totalSavingDT} DT)</span>
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
                    <th className="p-4 text-text-muted font-medium">Facture STEG (DT)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.labels.map((label, idx) => {
                    const baseline = data.baseline[idx];
                    const opt = data.optimized[idx];
                    const saving = baseline - opt;
                    const pct = ((saving / baseline) * 100).toFixed(1);
                    const bill = data.bills ? (data.bills[idx] / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : (opt * 0.230).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
                    return (
                      <tr key={label} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-4 text-text-primary font-medium">{label}</td>
                        <td className="p-4 text-text-muted font-mono">{baseline.toLocaleString('fr-FR')}</td>
                        <td className="p-4 text-text-primary font-mono">{opt.toLocaleString('fr-FR')}</td>
                        <td className="p-4 text-accent-green font-mono">
                          -{saving.toLocaleString('fr-FR')} <span className="text-[10px] text-accent-green/80">(-{pct}%)</span>
                        </td>
                        <td className="p-4 text-text-primary font-mono">{bill} DT</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="bg-accent-green/10 border border-accent-green/20 rounded-2xl p-6 text-center shadow-lg shadow-accent-green/5">
            <h3 className="text-accent-green font-semibold mb-2">Bilan Énergétique Annuel</h3>
            <p className="text-text-primary text-lg font-display">
              <span className="line-through text-text-muted mr-2">{totalBaseline.toLocaleString('fr-FR')} kWh</span>
              → {totalOptimized.toLocaleString('fr-FR')} kWh — Économie : <span className="text-accent-green font-bold">{totalSaving.toLocaleString('fr-FR')} kWh ({savingPercent}%)</span>
            </p>
            <p className="text-text-muted text-sm mt-2 font-medium">
              Économie financière estimée : <span className="text-accent-cyan font-bold text-base font-mono">{totalSavingDT} DT</span> / an (basé sur le tarif moyen STEG)
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
