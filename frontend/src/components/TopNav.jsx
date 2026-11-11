import React from 'react';
import { Plus, UploadCloud, Download, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function TopNav({ 
  title, 
  subtitle, 
  onAddLead, 
  onImportClick, 
  onRefresh, 
  isRefreshing 
}) {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm/50">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-normal">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        )}

        <a
          href={api.exportLeadsUrl()}
          download="leads_export.csv"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </a>

        {onImportClick && (
          <button
            onClick={onImportClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>
        )}

        {onAddLead && (
          <button
            onClick={onAddLead}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition-colors shadow-sm shadow-sky-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        )}
      </div>
    </header>
  );
}
