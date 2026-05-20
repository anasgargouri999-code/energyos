import { LayoutDashboard, Zap, AlertTriangle, Settings, Calendar, Activity, Leaf, ShieldCheck, BookOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../../store';

const NAV_LINKS = [
  { name: 'Tableau de Bord', path: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Énergie', path: '/dashboard/energy', icon: Zap },
  { name: 'Planification', path: '/dashboard/schedule', icon: Calendar },
  { name: 'Alertes', path: '/dashboard/alerts', icon: AlertTriangle },
  { name: 'Activité', path: '/dashboard/settings', icon: Activity },
  { name: 'Paramètres', path: '/dashboard/settings', icon: Settings },
];

// Deduplicate settings (Activity and Settings share path for now)
const LINKS = [
  { name: 'Tableau de Bord', path: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Énergie', path: '/dashboard/energy', icon: Zap },
  { name: 'Planification', path: '/dashboard/schedule', icon: Calendar },
  { name: 'Alertes', path: '/dashboard/alerts', icon: AlertTriangle },
  { name: 'Paramètres', path: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const { alerts, mode } = useStore();
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const unreadCount = safeAlerts.filter(a => !a.acknowledged).length;

  return (
    <aside className="w-60 border-r border-white/6 bg-bg-surface flex-col hidden md:flex h-[calc(100vh-4rem)] sticky top-16 transition-colors">
      <div className="flex-1 py-5 flex flex-col gap-1 px-3">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const isAlerts = link.path === '/dashboard/alerts';

          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all relative text-sm font-medium ${isActive
                  ? 'bg-accent-mint/12 text-accent-mint'
                  : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent-mint rounded-r-full" />
                  )}
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{link.name}</span>
                  {isAlerts && unreadCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-accent-red/15 text-accent-red px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/6">
        <div className="flex items-center gap-3 px-1">
          <NavLink to="/documentation" className="p-2 rounded-xl text-text-muted hover:text-accent-cyan hover:bg-bg-elevated transition-all" title="Documentation">
            <BookOpen className="w-4.5 h-4.5" />
          </NavLink>
          <NavLink to="/admin" className="p-2 rounded-xl text-text-muted hover:text-accent-mint hover:bg-bg-elevated transition-all" title="Panneau Admin">
            <ShieldCheck className="w-4.5 h-4.5" />
          </NavLink>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">
              {mode === 'demo' ? 'Mode Démo' : 'Administrateur'}
            </p>
            <p className="text-[10px] text-text-muted">EnergyOS v2.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
