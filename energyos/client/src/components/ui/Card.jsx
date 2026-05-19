export default function Card({ className = '', children, title, subtitle, action, ...props }) {
  return (
    <div className={`bg-bg-surface border border-white/5 rounded-2xl p-6 ${className}`} {...props}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-text-primary font-display">{title}</h3>}
            {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
