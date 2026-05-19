import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Bell, Sun, Moon, Link } from 'lucide-react';
import Badge from '../ui/Badge';
import { useStore } from '../../store';

export default function Navbar({ title }) {
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const { theme, toggleTheme, alerts, mode } = useStore();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDemo = mode === 'demo';
  const isConnected = true;
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const unreadAlerts = activeAlerts.length;

  return (
    <nav className="h-16 border-b border-white/5 bg-bg-surface/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand Logo & Dynamic Page Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-text-primary hidden sm:inline-block">
            EnergyOS
          </span>
        </div>
        {title && (
          <div className="flex items-center gap-2">
            <span className="text-text-muted/40 font-light">/</span>
            <span className="font-semibold text-text-primary text-sm whitespace-nowrap">
              {title}
            </span>
          </div>
        )}
      </div>

      {/* Center: Clock */}
      <div className="hidden md:flex flex-col items-center">
        <span className="font-mono text-lg font-medium text-text-primary tracking-wider">
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className="text-xs text-text-muted">
          {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Right: Theme, Status, Alerts, Mode */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent-green animate-pulse' : 'bg-text-muted'}`} />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {isConnected ? 'GTB Connecté' : 'Hors ligne'}
          </span>
        </div>

        {/* Dynamic Light/Dark Mode Switch */}
        <button
          onClick={toggleTheme}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Functional Notification Button */}
        <button
          onClick={() => navigate('/dashboard/alerts')}
          className="relative p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          title={`Alertes (${unreadAlerts} non lues)`}
        >
          <Bell className="w-5 h-5" />
          {unreadAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-red animate-pulse" />
          )}
        </button>

        <Badge severity={isDemo ? 'warning' : 'success'} className="uppercase font-bold tracking-wider text-[10px]">
          {isDemo ? 'DEMO' : 'LIVE'}
        </Badge>
      </div>
    </nav>
  );
}
