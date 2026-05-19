export default function Badge({ severity = 'neutral', children, className = '' }) {
  const styles = {
    success: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    warning: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
    danger: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    info: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    neutral: 'bg-white/5 text-text-muted border-white/10',
  };

  const dotColors = {
    success: 'bg-accent-green',
    warning: 'bg-accent-amber',
    danger: 'bg-accent-red',
    info: 'bg-accent-cyan',
    neutral: 'bg-text-muted',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[severity]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[severity]}`} />
      {children}
    </span>
  );
}
