import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Bell, Sun, Moon, Activity } from 'lucide-react';
import { useStore } from '../../store';

export default function Navbar({ title }) {
  const [time, setTime] = useState(new Date());
  const navigate   = useNavigate();
  const { theme, toggleTheme, alerts, mode } = useStore();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const safeAlerts   = Array.isArray(alerts) ? alerts : [];
  const unreadCount  = safeAlerts.filter(a => !a.acknowledged).length;
  const isDemo       = mode === 'demo';

  return (
    <nav className="h-16 border-b border-white/6 bg-bg-surface/80 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Logo + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-eco-gradient flex items-center justify-center shadow-eco">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-text-primary hidden sm:block">
            Energy<span className="eco-text-gradient">OS</span>
          </span>
        </button>
        {title && (
          <>
            <span className="text-text-subtle font-light">/</span>
            <span className="text-sm font-semibold text-text-primary">{title}</span>
          </>
        )}
      </div>

      {/* Center: Clock */}
      <div className="hidden md:flex flex-col items-center pointer-events-none">
        <span className="font-mono text-base font-semibold text-text-primary tracking-wider">
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className="text-[10px] text-text-muted capitalize">
          {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Right: Status + Controls */}
      <div className="flex items-center gap-2">
        {/* Live / Demo badge */}
        <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-wide ${
          isDemo
            ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20'
            : 'bg-accent-mint/10 text-accent-mint border-accent-mint/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isDemo ? 'bg-accent-amber animate-pulse' : 'bg-accent-mint animate-pulse'}`} />
          {isDemo ? 'Démo' : 'Live'}
        </span>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark'
            ? <Sun className="w-4.5 h-4.5" />
            : <Moon className="w-4.5 h-4.5" />
          }
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/dashboard/alerts')}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          title={`${unreadCount} alerte(s) active(s)`}
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-red animate-pulse" />
          )}
        </button>

        {/* Activity log shortcut */}
        <button
          onClick={() => navigate('/dashboard/settings')}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          title="Activité & Paramètres"
        >
          <Activity className="w-4.5 h-4.5" />
        </button>
      </div>
    </nav>
  );
}
