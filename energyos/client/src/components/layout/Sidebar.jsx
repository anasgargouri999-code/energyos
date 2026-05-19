import { LayoutDashboard, Zap, AlertTriangle, Settings, Calendar } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Énergie', path: '/dashboard/energy', icon: Zap },
    { name: 'Planification', path: '/dashboard/schedule', icon: Calendar },
    { name: 'Alertes', path: '/dashboard/alerts', icon: AlertTriangle },
    { name: 'Paramètres', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-bg-surface flex flex-col hidden md:flex h-[calc(100vh-4rem)] sticky top-16">
      <div className="flex-1 py-6 flex flex-col gap-2 px-4">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative ${
                isActive 
                  ? 'bg-accent-cyan/10 text-accent-cyan font-medium' 
                  : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-accent-cyan rounded-r-full" />
                  )}
                  <Icon className="w-5 h-5" />
                  {link.name}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="p-6 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">Admin Clinique</span>
            <span className="text-xs text-text-muted">Niveau d'accès</span>
          </div>
          <span className="text-xs text-text-muted font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
