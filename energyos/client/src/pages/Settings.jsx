import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useStore } from '../store';
import { LogOut, Globe, Key, ShieldAlert, Code } from 'lucide-react';

export default function Settings() {
  const { mode, gtbEndpoint, accessCode, setMode, setAccessCode, setGtbEndpoint, setZones, setAlerts, updateLiveData, setGroqConfig } = useStore();
  const navigate = useNavigate();
  const [showLiveWarning, setShowLiveWarning] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    setMode('demo');
    setAccessCode(null);
    setGtbEndpoint(null);
    setZones([]);
    setAlerts([]);
    updateLiveData({});
    setGroqConfig(null);
    navigate('/onboarding');
  };

  const handleSwitchToLive = () => {
    setShowLiveWarning(false);
    setMode('authenticated');
    // Note: Live mode needs actual auth setup later.
  };

  const maskedCode = accessCode ? `${accessCode.substring(0, 4)}****` : '****';

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Paramètres" />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-4xl w-full mx-auto space-y-6">
          
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-text-muted w-5 h-5" />
              <h2 className="text-lg font-semibold text-text-primary">Connexion GTB</h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-text-muted text-sm mb-1">Point de terminaison actuel</p>
                <p className="text-text-primary font-mono bg-white/5 px-3 py-1.5 rounded-lg inline-block border border-white/10 break-all">
                  {gtbEndpoint || 'Aucun (Mode Démo)'}
                </p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/connect')}>Modifier</Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="text-text-muted w-5 h-5" />
              <h2 className="text-lg font-semibold text-text-primary">Sécurité et Accès</h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-text-muted text-sm mb-1">Code d'accès actif</p>
                <p className="text-text-primary font-mono text-lg">{maskedCode}</p>
              </div>
              <Button variant="secondary" className="text-accent-red border-accent-red/20 hover:bg-accent-red/10" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-text-muted w-5 h-5" />
              <h2 className="text-lg font-semibold text-text-primary">Mode de Fonctionnement</h2>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="text-text-primary font-medium">Mode Actuel : {mode === 'demo' ? 'Démonstration' : 'Live / Authentifié'}</p>
                <p className="text-text-muted text-sm mt-1">Le mode démo utilise des données simulées.</p>
              </div>
              {mode === 'demo' ? (
                <Button variant="secondary" onClick={() => setShowLiveWarning(true)}>Passer en Live</Button>
              ) : (
                <Button variant="secondary" onClick={() => setMode('demo')}>Passer en Démo</Button>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Code className="text-text-muted w-5 h-5" />
              <h2 className="text-lg font-semibold text-text-primary">À propos</h2>
            </div>
            <div className="space-y-3 text-sm text-text-muted">
              <p>EnergyOS — Plateforme Web de Gestion Énergétique GTB</p>
              <p>Version: 1.0.0 (Demo Build)</p>
              <p>Stack Technique: React 18, Vite, Tailwind CSS, Zustand, Recharts</p>
              <div className="pt-4 border-t border-white/10 mt-4">
                <p>Développé dans le cadre d'un Projet de Fin d'Études (PFE).</p>
              </div>
            </div>
          </Card>

        </main>
      </div>

      <Modal isOpen={showLiveWarning} onClose={() => setShowLiveWarning(false)} title="Passer en mode Live ?">
        <p className="text-text-muted mb-6">
          Le mode live nécessite une connexion réseau active avec un système GTB compatible. 
          Si vous n'êtes pas sur le réseau de la clinique, l'application risque de ne pas fonctionner.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowLiveWarning(false)}>Annuler</Button>
          <Button onClick={handleSwitchToLive}>Confirmer</Button>
        </div>
      </Modal>

    </div>
  );
}
