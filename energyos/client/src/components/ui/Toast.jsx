import { Toaster } from 'react-hot-toast';

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: '!bg-bg-surface !text-text-primary !border !border-white/10 !rounded-xl !shadow-lg',
        duration: 4000,
        style: {
          background: '#111827',
          color: '#F1F5F9',
          border: '1px solid rgba(255, 255, 255, 0.05)',
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
  );
}
