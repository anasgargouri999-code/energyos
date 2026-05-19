import { useState, useEffect } from 'react';
import { Zap, Bell } from 'lucide-react';
import Badge from '../ui/Badge';

export default function Navbar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // In a real app, this would come from a store/context
  const isDemo = true;
  const isConnected = true;
  const unreadAlerts = 2;

  return (
    <nav className="h-16 border-b border-white/5 bg-bg-surface/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">
          <Zap className="w-5 h-5" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-text-primary">
          EnergyOS
        </span>
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

      {/* Right: Status & Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent-green' : 'bg-text-muted animate-pulse'}`} />
          <span className="text-sm font-medium text-text-muted">
            {isConnected ? 'GTB Connecté' : 'Hors ligne'}
          </span>
        </div>

        <button className="relative p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          {unreadAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-red" />
          )}
        </button>

        <Badge severity={isDemo ? 'warning' : 'success'} className="uppercase font-bold tracking-wider">
          {isDemo ? 'DEMO' : 'LIVE'}
        </Badge>
      </div>
    </nav>
  );
}
