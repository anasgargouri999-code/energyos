import React from 'react';
import Card from '../ui/Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function SummaryCard({ title, value, unit = '', trend, trendValue, icon: Icon }) {
  const isPositiveTrend = trend === 'up' || (typeof trend === 'string' && trend.startsWith('+'));
  const displayTrendValue = trendValue || (typeof trend === 'string' && (trend.startsWith('+') || trend.startsWith('-')) ? trend : null);
  
  return (
    <Card className="flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-text-muted">{title}</p>
        {Icon && (
          <div className="p-2 bg-white/5 rounded-xl border border-white/5 text-text-muted">
            {typeof Icon === 'function' ? (
              <Icon className="w-5 h-5" />
            ) : (
              React.isValidElement(Icon) ? React.cloneElement(Icon, { className: 'w-5 h-5' }) : Icon
            )}
          </div>
        )}
      </div>
      
      <div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-3xl font-bold text-text-primary">{value}</span>
          {unit && <span className="text-text-muted font-medium">{unit}</span>}
        </div>
        
        {displayTrendValue && (
          <div className="flex items-center gap-1 mt-2">
            {isPositiveTrend ? (
              <ArrowUpRight className="w-4 h-4 text-accent-red" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-accent-green" />
            )}
            <span className={`text-sm font-medium ${isPositiveTrend ? 'text-accent-red' : 'text-accent-green'}`}>
              {displayTrendValue}
            </span>
            <span className="text-xs text-text-muted ml-1">vs mois dernier</span>
          </div>
        )}
      </div>
    </Card>
  );
}
