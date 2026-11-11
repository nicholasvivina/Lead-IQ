import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const type = toast.type || 'info';

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 bg-white shadow-emerald-100/50',
    error: 'border-rose-200 bg-white shadow-rose-100/50',
    warning: 'border-amber-200 bg-white shadow-amber-100/50',
    info: 'border-blue-200 bg-white shadow-blue-100/50'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md w-full">
      <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${borders[type]}`}>
        {icons[type]}
        <div className="flex-1 min-w-0">
          {toast.title && <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>}
          <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
