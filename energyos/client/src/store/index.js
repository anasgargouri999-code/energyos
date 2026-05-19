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

  setMode: (mode) => set({ mode }),
  setAccessCode: (code) => set({ accessCode: code }),
  setGtbEndpoint: (endpoint) => set({ gtbEndpoint: endpoint }),
  setZones: (zones) => set({ zones }),
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  updateLiveData: (data) => set((state) => ({ liveData: { ...state.liveData, ...data } })),
  setGroqConfig: (config) => set({ groqConfig: config }),
  setBannerDismissed: (dismissed) => set({ bannerDismissed: dismissed }),
}));
