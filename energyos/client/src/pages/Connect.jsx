import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Zap, CheckCircle2, AlertTriangle, XCircle, Loader2, ArrowRight, Wifi, WifiOff, SkipForward } from 'lucide-react';
import { DEMO_DEVICES, MONTHLY_DATA } from '../lib/demoData';

export default function Connect() {
  const [url, setUrl] = useState(localStorage.getItem('energyos_gtb_url') || 'http://localhost:1880');
  const [status, setStatus] = useState('idle');
  const [devices, setDevices] = useState([]);

  const setGtbEndpoint = useStore(state => state.setGtbEndpoint);
  const navigate = useNavigate();

  const handleTestConnection = async () => {
    let cleanUrl = url.trim().replace(/\/+$/, '').replace(/\/ui$/, '');
    if (!cleanUrl) return;
    
    setUrl(cleanUrl);
    setStatus('loading');

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/gtb/ping?url=${encodeURIComponent(cleanUrl)}`);

      if (response.status === 200 || response.status === 201) {
        setStatus('success');
        setDevices(DEMO_DEVICES);
        setGtbEndpoint(cleanUrl);
        localStorage.setItem('energyos_gtb_url', cleanUrl);
      } else if (response.status === 404) {
        setStatus('error404');
      } else {
        setStatus('error500');
      }
    } catch {
      setStatus('timeout');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const statusConfig = {
    idle:     { icon: null, text: 'Entrez l\'URL de votre serveur Node-RED puis testez la connexion.', color: 'text-text-muted' },
    loading:  { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: 'Connexion en cours…', color: 'text-accent-cyan' },
    success:  { icon: <CheckCircle2 className="w-4 h-4" />, text: `Connexion établie — ${devices.length} appareils détectés`, color: 'text-accent-mint' },
    error404: { icon: <AlertTriangle className="w-4 h-4" />, text: 'Endpoint introuvable. Vérifiez l\'URL.', color: 'text-accent-amber' },
    error500: { icon: <XCircle className="w-4 h-4" />, text: 'Erreur serveur GTB. Contactez l\'administrateur.', color: 'text-accent-red' },
    timeout:  { icon: <WifiOff className="w-4 h-4" />, text: 'Impossible de joindre le serveur. Vérifiez le réseau.', color: 'text-accent-red' },
  };

  const sc = statusConfig[status];

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-eco-gradient mb-4 shadow-eco">
            <Wifi className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
            Connexion GTB
          </h1>
          <p className="text-text-muted text-sm">
            Associez votre serveur Node-RED pour activer la supervision en direct.
          </p>
        </div>

        {/* Card */}
        <div className="bg-bg-surface border border-white/6 rounded-2xl p-6 shadow-card space-y-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              URL du serveur GTB
            </label>
            <input
              type="url"
              placeholder="http://localhost:1880"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestConnection()}
              className="eco-input font-mono"
            />
          </div>

          <button
            onClick={handleTestConnection}
            disabled={status === 'loading' || !url.trim()}
            className="w-full flex items-center justify-center gap-2 bg-eco-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-eco"
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Tester la connexion
          </button>

          {/* Status indicator */}
          <div className={`flex items-center gap-2.5 text-sm ${sc.color} pt-1`}>
            {sc.icon}
            <span>{sc.text}</span>
          </div>
        </div>

        {/* Success: device list + go to dashboard */}
        {status === 'success' && (
          <div className="space-y-4 animate-fade-up">
            <div className="bg-bg-surface border border-accent-mint/20 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-mint" />
                Appareils détectés
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {devices.map(device => (
                  <div key={device.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-accent-mint' : 'bg-accent-red'}`} />
                      <span className="text-sm text-text-primary font-medium">{device.name}</span>
                    </div>
                    <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded-lg font-mono">{device.protocol}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2 bg-eco-gradient text-white font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-eco text-sm"
            >
              Accéder au tableau de bord
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-text-muted">
              L'optimisation IA est disponible depuis le tableau de bord via le bouton "Auto Config".
            </p>
          </div>
        )}

        {/* Skip button */}
        {status !== 'success' && (
          <button
            onClick={handleGoToDashboard}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-text-muted hover:text-text-primary border border-white/8 rounded-xl hover:bg-bg-elevated transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            Passer — accéder directement au tableau de bord
          </button>
        )}
      </div>
    </div>
  );
}
