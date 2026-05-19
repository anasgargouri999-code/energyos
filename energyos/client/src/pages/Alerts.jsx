import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useStore } from '../store';
import { DEMO_ALERTS } from '../lib/demoData';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Alerts() {
  const { mode, alerts, setAlerts } = useStore();
  const [filter, setFilter] = useState('Tous'); // Tous | Critiques | Avertissements | Info

  useEffect(() => {
    if (mode === 'demo' && alerts.length === 0) {
      setAlerts(DEMO_ALERTS);
    }
  }, [mode, alerts.length, setAlerts]);

  const handleAcknowledge = (id) => {
    const updated = alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a);
    setAlerts(updated);
    toast.success("Alerte acquittée");
  };

  const getIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-accent-red" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-accent-amber" />;
      default: return <Info className="w-5 h-5 text-accent-cyan" />;
    }
  };

  const getBadgeVariant = (severity) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      default: return 'success';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'critical': return 'Critique';
      case 'warning': return 'Avertissement';
      default: return 'Info';
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'Tous') return true;
    if (filter === 'Critiques') return a.severity === 'critical';
    if (filter === 'Avertissements') return a.severity === 'warning';
    if (filter === 'Info') return a.severity === 'info';
    return true;
  });

  const activeAlerts = filteredAlerts.filter(a => !a.acknowledged);
  const historyAlerts = filteredAlerts.filter(a => a.acknowledged);

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Alertes" />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {['Tous', 'Critiques', 'Avertissements', 'Info'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  filter === tab ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <h2 className="text-lg font-semibold text-text-primary mb-4">Alertes Actives</h2>
          <div className="space-y-4 mb-8">
            {activeAlerts.length === 0 ? (
              <Card className="p-8 flex flex-col items-center justify-center text-center border-dashed border-white/20">
                <div className="w-12 h-12 bg-accent-green/10 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-accent-green" />
                </div>
                <h3 className="text-text-primary font-medium">Aucune alerte active</h3>
                <p className="text-text-muted text-sm mt-1">Tous les systèmes fonctionnent normalement.</p>
              </Card>
            ) : (
              activeAlerts.map(alert => (
                <Card key={alert.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-shrink-0 mt-1 sm:mt-0">
                    {getIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={getBadgeVariant(alert.severity)}>{getSeverityLabel(alert.severity)}</Badge>
                      <span className="text-text-muted text-sm">{alert.time}</span>
                      <span className="text-text-primary text-sm font-medium truncate hidden sm:inline">• {alert.zone}</span>
                    </div>
                    <span className="text-text-primary text-sm font-medium sm:hidden block mb-1">{alert.zone}</span>
                    <p className="text-text-primary text-sm">{alert.message}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => handleAcknowledge(alert.id)}>
                      <Check className="w-4 h-4 mr-2" />
                      Acquitter
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {historyAlerts.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-4 mt-8">Historique</h2>
              <div className="space-y-4 opacity-75">
                {historyAlerts.map(alert => (
                  <Card key={alert.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 bg-bg-surface/50">
                    <div className="flex-shrink-0 mt-1 sm:mt-0 opacity-50">
                      {getIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{getSeverityLabel(alert.severity)}</Badge>
                        <span className="text-text-muted text-sm">{alert.time}</span>
                        <span className="text-text-muted text-sm font-medium truncate">• {alert.zone}</span>
                      </div>
                      <p className="text-text-muted text-sm">{alert.message}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
