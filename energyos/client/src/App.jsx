import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store';

/* ─── Lazy-loaded pages ─── */
const Landing = lazy(() => import('./pages/Landing'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Connect = lazy(() => import('./pages/Connect'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Energy = lazy(() => import('./pages/Energy'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Solar = lazy(() => import('./pages/Solar'));
const Documentation = lazy(() => import('./pages/Documentation'));

/* ─── Full-screen loading spinner ─── */
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0D14' }}>
      <div className="animate-spin border-4 border-white/10 border-t-accent-cyan rounded-full w-12 h-12" />
    </div>
  );
}

/* ─── Auth guard: redirects to /onboarding if mode is null ─── */
function AuthGuard({ children }) {
  const mode = useStore((s) => s.mode);

  if (mode === null) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

/* ─── Page transition wrapper: opacity fade-in on mount ─── */
function PageTransition({ children }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const frame = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <div
      className={`transition-opacity duration-300 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {!visible && <div className="loading-bar" />}
      {children}
    </div>
  );
}

/* ─── App root ─── */
function AppRoutes() {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/solar" element={<Solar />} />
          <Route path="/documentation" element={<Documentation />} />

          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/dashboard/energy" element={<AuthGuard><Energy /></AuthGuard>} />
          <Route path="/dashboard/schedule" element={<AuthGuard><Schedule /></AuthGuard>} />
          <Route path="/dashboard/alerts" element={<AuthGuard><Alerts /></AuthGuard>} />
          <Route path="/dashboard/settings" element={<AuthGuard><Settings /></AuthGuard>} />

          {/* Admin — has its own internal auth, no mode check */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Catch-all: redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </PageTransition>
  );
}

/* ─── LocalStorage rehydration keys ─── */
const LS_MODE_KEY = 'energyos_mode';
const LS_CODE_KEY = 'energyos_accessCode';
const LS_GTB_KEY = 'energyos_gtbEndpoint';

function App() {
  const setMode = useStore((s) => s.setMode);
  const setAccessCode = useStore((s) => s.setAccessCode);
  const setGtbEndpoint = useStore((s) => s.setGtbEndpoint);
  const [hydrated, setHydrated] = useState(false);

  /* Rehydrate Zustand from localStorage on mount */
  useEffect(() => {
    // Initialize light/dark theme
    useStore.getState().initTheme();

    // Clear stale ngrok URLs that no longer work
    const savedGtbCheck = localStorage.getItem(LS_GTB_KEY);
    if (savedGtbCheck && savedGtbCheck.includes('ngrok')) {
      localStorage.removeItem(LS_GTB_KEY);
    }

    const savedMode = localStorage.getItem(LS_MODE_KEY);
    const savedCode = localStorage.getItem(LS_CODE_KEY);
    const savedGtb = localStorage.getItem(LS_GTB_KEY);

    if (savedMode === 'demo' || savedMode === 'authenticated') {
      setMode(savedMode);
    } else {
      setMode(null);
    }

    if (savedCode) {
      setAccessCode(savedCode);
    }

    if (savedGtb) {
      setGtbEndpoint(savedGtb);
    }

    setHydrated(true);
  }, [setMode, setAccessCode, setGtbEndpoint]);

  /* Wait for rehydration before rendering routes */
  if (!hydrated) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      {/* react-hot-toast configured per spec */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111827',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#111827',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#111827',
            },
          },
        }}
      />
      <AppRoutes />
    </Router>
  );
}

export default App;
