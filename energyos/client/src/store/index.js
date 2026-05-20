import { create } from 'zustand';

const MAX_ACTIVITY_LOG = 200;

function makeActivity(type, description, meta = {}) {
  return {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,        // 'zone_mode' | 'schedule' | 'alert' | 'ai' | 'auth' | 'sim' | 'system'
    description,
    meta,
    timestamp: new Date().toISOString(),
  };
}

export const useStore = create((set, get) => ({
  mode: null,
  accessCode: null,
  accessPermissions: 'full_access', // 'full_access' | 'schedule_only' | 'devices_only' | 'read_only'
  gtbEndpoint: null,
  zones: [],
  alerts: [],
  liveData: {},
  groqConfig: null,
  bannerDismissed: false,
  blackoutMode: false,
  theme: localStorage.getItem('energyos_theme') || 'dark',
  activityLog: [],

  schedules: [
    { id: 'sch1', target: 'CTA Bloc Principal', type: 'device', action: 'off', time: '20:00', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], active: true },
    { id: 'sch2', target: 'CTA Bloc Principal', type: 'device', action: 'on',  time: '06:00', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], active: true },
    { id: 'sch3', target: 'Administration',    type: 'zone',   action: 'off', time: '18:00', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], active: true },
    { id: 'sch4', target: 'Parking / Extérieur', type: 'zone', action: 'on', time: '19:30', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], active: false },
  ],

  /* ── Core setters ── */
  setMode: (mode) => set({ mode }),
  setAccessCode: (code) => set({ accessCode: code }),
  setAccessPermissions: (perms) => set({ accessPermissions: perms }),
  setGtbEndpoint: (endpoint) => set({ gtbEndpoint: endpoint }),
  setZones: (zones) => set({ zones: Array.isArray(zones) ? zones : [] }),
  updateZoneProperty: (id, key, value) => set((state) => ({
    zones: state.zones.map((z) => (z.id === id ? { ...z, [key]: value } : z))
  })),
  setAlerts: (alerts) => set({ alerts: Array.isArray(alerts) ? alerts : [] }),
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...(Array.isArray(state.alerts) ? state.alerts : [])],
  })),
  updateLiveData: (data) => set((state) => ({ liveData: { ...state.liveData, ...data } })),
  setGroqConfig: (config) => set({ groqConfig: config }),
  setBannerDismissed: (dismissed) => set({ bannerDismissed: dismissed }),
  setBlackoutMode: (val) => set({ blackoutMode: val }),

  /* ── Schedule actions ── */
  addSchedule: (sch) => set((state) => ({
    schedules: [...state.schedules, sch],
  })),
  toggleSchedule: (id) => set((state) => ({
    schedules: state.schedules.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
  })),
  deleteSchedule: (id) => set((state) => ({
    schedules: state.schedules.filter((s) => s.id !== id),
  })),

  /* ── Activity log ── */
  addActivity: (type, description, meta = {}) => set((state) => {
    const entry = makeActivity(type, description, meta);
    const log = [entry, ...state.activityLog].slice(0, MAX_ACTIVITY_LOG);
    return { activityLog: log };
  }),
  clearActivityLog: () => set({ activityLog: [] }),

  /* ── Theme ── */
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('energyos_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    return { theme: nextTheme };
  }),
  initTheme: () => {
    const savedTheme = localStorage.getItem('energyos_theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }
}));
