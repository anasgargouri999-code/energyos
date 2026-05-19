import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Zap, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { DEMO_DEVICES, MONTHLY_DATA } from '../lib/demoData';
import { autoConfigFromDevices } from '../lib/groq';

export default function Connect() {
  const [url, setUrl] = useState(localStorage.getItem('energyos_gtb_url') || 'https://oppressor-fog-unguarded.ngrok-free.dev');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error404 | error500 | timeout
  const [devices, setDevices] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState(null);

  const zones = useStore(state => state.zones);
  const setZones = useStore(state => state.setZones);
  const setGtbEndpoint = useStore(state => state.setGtbEndpoint);
  const setGroqConfig = useStore(state => state.setGroqConfig);
  const navigate = useNavigate();

  const handleTestConnection = async () => {
    if (!url.trim()) return;
    setStatus('loading');
    
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/gtb/ping?url=${encodeURIComponent(url)}`);
      
      if (response.status === 200 || response.status === 201) {
        setStatus('success');
        setDevices(DEMO_DEVICES);
        setGtbEndpoint(url);
        localStorage.setItem('energyos_gtb_url', url);
      } else if (response.status === 404) {
        setStatus('error404');
      } else {
        setStatus('error500');
      }
    } catch (err) {
      setStatus('timeout');
    }
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const config = await autoConfigFromDevices(devices, MONTHLY_DATA.baseline);
      setAiConfig(config);
    } catch (err) {
      console.error('Groq AI error:', err);
      // In case of error in demo, we can just mock a response or handle silently
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyConfig = () => {
    if (aiConfig) {
      setGroqConfig(aiConfig);
      localStorage.setItem('energyos_ai_config', JSON.stringify(aiConfig));

      // Auto-toggle matching zones to eco mode
      if (aiConfig.eco_schedules) {
        const updated = zones.map((z) => {
          const isEcoMatch = aiConfig.eco_schedules.some((s) =>
            s.zone.toLowerCase().includes(z.name.toLowerCase()) ||
            z.name.toLowerCase().includes(s.zone.toLowerCase())
          );
          if (isEcoMatch) {
            return { ...z, mode: 'eco' };
          }
          return z;
        });
        setZones(updated);
      }
    }
    navigate('/dashboard');
  };

  const handleIgnore = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6 font-body text-text-primary flex flex-col max-w-lg mx-auto">
      <div className="mb-8 mt-4">
        <h1 className="text-2xl font-display font-bold mb-2">Connexion au serveur GTB</h1>
        <p className="text-text-muted">Entrez l'URL de votre serveur Node-RED / GTB</p>
      </div>

      <div className="bg-bg-surface p-6 rounded-2xl border border-white/5 space-y-4 mb-6">
        <input 
          type="url"
          placeholder="http://192.168.1.x:1880/api"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary outline-none focus:border-accent-cyan transition-colors font-mono text-sm"
        />
        <button 
          onClick={handleTestConnection}
          disabled={status === 'loading' || !url.trim()}
          className="w-full bg-accent-cyan text-bg-primary font-semibold py-3 rounded-xl hover:brightness-110 transition disabled:opacity-50"
        >
          Tester la connexion
        </button>

        <div className="pt-4 border-t border-white/5">
          {status === 'idle' && (
            <div className="flex items-center gap-2 text-text-muted">
              <div className="w-2 h-2 rounded-full bg-text-muted" />
              <span className="text-sm">En attente...</span>
            </div>
          )}
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-accent-cyan">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Connexion en cours...</span>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-accent-green">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-sm">✅ Connexion établie — {devices.length} appareils détectés</span>
            </div>
          )}
          {status === 'error404' && (
            <div className="flex items-center gap-2 text-accent-amber">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm">⚠️ Endpoint introuvable. Vérifiez l'URL.</span>
            </div>
          )}
          {status === 'error500' && (
            <div className="flex items-center gap-2 text-accent-red">
              <XCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">❌ Erreur serveur GTB. Contactez l'administrateur.</span>
            </div>
          )}
          {status === 'timeout' && (
            <div className="flex items-center gap-2 text-accent-red">
              <XCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">❌ Impossible de joindre le serveur.</span>
            </div>
          )}
        </div>
      </div>

      {status === 'success' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-bg-surface p-6 rounded-2xl border border-white/5 max-h-48 overflow-y-auto">
            <h3 className="font-semibold mb-3 text-xs text-text-subtle uppercase tracking-wider">Appareils détectés</h3>
            <div className="space-y-3">
              {devices.map(device => (
                <div key={device.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-accent-green' : 'bg-accent-red'}`} />
                    <span className="text-sm font-medium">{device.name}</span>
                  </div>
                  <span className="text-xs text-text-muted bg-bg-elevated px-2 py-1 rounded-md">{device.protocol}</span>
                </div>
              ))}
            </div>
          </div>

          {!aiConfig && !aiLoading && (
            <button 
              onClick={handleAIAnalysis}
              className="w-full bg-bg-surface border border-accent-cyan text-accent-cyan font-semibold py-4 rounded-xl hover:bg-accent-cyan/10 transition flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Analyser avec IA Groq
            </button>
          )}

          {aiLoading && (
            <div className="w-full bg-bg-surface border border-white/5 py-4 rounded-xl flex items-center justify-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-cyan"></span>
              </span>
              <span className="text-sm font-medium text-accent-cyan animate-pulse">EnergyOS AI analyse vos équipements...</span>
            </div>
          )}

          {aiConfig && (
            <div className="bg-bg-elevated border border-accent-cyan/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
              <h3 className="font-display font-semibold text-lg mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-cyan" />
                Configuration IA suggérée
              </h3>
              <p className="text-sm text-text-muted mb-4">{aiConfig.summary || "Configuration optimisée générée avec succès."}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-bg-surface p-3 rounded-lg border border-white/5">
                  <span className="block text-xs text-text-subtle mb-1">Schedules Éco</span>
                  <span className="font-mono text-sm text-accent-green">{aiConfig.eco_schedules?.length || 0} zones</span>
                </div>
                <div className="bg-bg-surface p-3 rounded-lg border border-white/5">
                  <span className="block text-xs text-text-subtle mb-1">Délestage</span>
                  <span className="font-mono text-sm text-accent-amber">{aiConfig.delestage_priority?.length || 0} priorités</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleApplyConfig}
                  className="flex-1 bg-accent-cyan text-bg-primary font-semibold py-2.5 rounded-xl hover:brightness-110 transition text-sm"
                >
                  Appliquer
                </button>
                <button 
                  onClick={handleIgnore}
                  className="flex-1 border border-white/10 text-text-primary py-2.5 rounded-xl hover:bg-bg-surface transition text-sm"
                >
                  Ignorer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
