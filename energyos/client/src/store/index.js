import { create } from 'zustand';

export const useStore = create((set) => ({
  mode: null, // null | 'demo' | 'authenticated'
  accessCode: null,
  gtbEndpoint: null,
  zones: [],
  alerts: [],
  liveData: {},
  groqConfig: null,
  bannerDismissed: false,
  theme: localStorage.getItem('energyos_theme') || 'dark',
  schedules: [
    { id: 'sch1', target: 'CTA Bloc Principal', type: 'device', action: 'off', time: '20:00', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], active: true },
    { id: 'sch2', target: 'CTA Bloc Principal', type: 'device', action: 'on', time: '06:00', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], active: true },
    { id: 'sch3', target: 'Administration', type: 'zone', action: 'off', time: '18:00', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], active: true },
    { id: 'sch4', target: 'Parking / Extérieur', type: 'zone', action: 'on', time: '19:30', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], active: false },
  ],

  setMode: (mode) => set({ mode }),
  setAccessCode: (code) => set({ accessCode: code }),
  setGtbEndpoint: (endpoint) => set({ gtbEndpoint: endpoint }),
  setZones: (zones) => set({ zones }),
  updateZoneProperty: (id, key, value) => set((state) => ({
    zones: state.zones.map((z) => (z.id === id ? { ...z, [key]: value } : z))
  })),
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  updateLiveData: (data) => set((state) => ({ liveData: { ...state.liveData, ...data } })),
  setGroqConfig: (config) => set({ groqConfig: config }),
  setBannerDismissed: (dismissed) => set({ bannerDismissed: dismissed }),
  addSchedule: (sch) => set((state) => ({ schedules: [...state.schedules, sch] })),
  toggleSchedule: (id) => set((state) => ({
    schedules: state.schedules.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
  })),
  deleteSchedule: (id) => set((state) => ({
    schedules: state.schedules.filter((s) => s.id !== id),
  })),
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
