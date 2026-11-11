import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtext, onClick }) {
  const colorSchemes = {
    blue: {
      bg: 'bg-blue-50/60',
      text: 'text-blue-600',
      border: 'hover:border-blue-300',
      glow: 'shadow-blue-500/5',
    },
    emerald: {
      bg: 'bg-emerald-50/60',
      text: 'text-emerald-600',
      border: 'hover:border-emerald-300',
      glow: 'shadow-emerald-500/5',
    },
    rose: {
      bg: 'bg-rose-50/60',
      text: 'text-rose-600',
      border: 'hover:border-rose-300',
      glow: 'shadow-rose-500/5',
    },
    amber: {
      bg: 'bg-amber-50/60',
      text: 'text-amber-600',
      border: 'hover:border-amber-300',
      glow: 'shadow-amber-500/5',
    },
    indigo: {
      bg: 'bg-indigo-50/60',
      text: 'text-indigo-600',
      border: 'hover:border-indigo-300',
      glow: 'shadow-indigo-500/5',
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm ${scheme.glow} ${scheme.border} transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-lg ${scheme.bg} ${scheme.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">{value !== undefined ? value : 0}</span>
      </div>
      {subtext && (
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">{subtext}</p>
      )}
    </div>
  );
}
