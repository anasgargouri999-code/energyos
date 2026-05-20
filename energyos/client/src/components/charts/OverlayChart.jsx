import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function OverlayChart({ data }) {
  const formatYAxis = (tickItem) => {
    if (tickItem >= 1000) {
      return (tickItem / 1000).toFixed(0) + 'k';
    }
    return tickItem;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const baseline = payload.find(p => p.dataKey === 'baseline')?.value || 0;
      const optimized = payload.find(p => p.dataKey === 'optimized')?.value || 0;
      const savings = baseline - optimized;

      return (
        <div className="bg-bg-surface border border-white/10 p-4 rounded-xl shadow-xl">
          <p className="font-medium text-text-primary mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-text-muted">
              Avant GTB: <span className="font-mono text-text-primary">{baseline.toLocaleString()} kWh</span>
            </p>
            <p className="text-sm text-accent-green">
              Avec EnergyOS: <span className="font-mono">{optimized.toLocaleString()} kWh</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm font-medium text-accent-cyan">
              Économie: <span className="font-mono">-{savings.toLocaleString()} kWh</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', color: '#F1F5F9' }}
          />
          <Line
            name="Avant GTB"
            type="monotone"
            dataKey="baseline"
            stroke="#64748B"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            name="Avec EnergyOS"
            type="monotone"
            dataKey="optimized"
            stroke="#22C55E"
            strokeWidth={3}
            dot={{ r: 3, strokeWidth: 0, fill: '#22C55E' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
