import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UploadCloud, 
  Sparkles, 
  CopyCheck, 
  Settings, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, settingsData }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'All Leads', icon: Users },
    { id: 'import', label: 'Import CSV', icon: UploadCloud },
    { id: 'enrichment', label: 'Enrichment Results', icon: Sparkles },
    { id: 'duplicates', label: 'Duplicate Review', icon: CopyCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const hasGroq = settingsData?.groq_configured;

  return (
    <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 min-h-screen">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-lg text-white tracking-tight">Lead<span className="text-sky-400">IQ</span></h1>
            <span className="text-[10px] uppercase font-bold bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20">AI</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">B2B Enrichment Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-[#1C2541]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zero Cost & AI Status Box */}
      <div className="p-4 m-3 rounded-xl bg-[#1C2541]/70 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-medium">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span>AI Engine Mode</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${hasGroq ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[11px] text-slate-300 font-medium truncate">
            {hasGroq ? 'Groq Cloud LLM' : 'Rule-Based Fallback'}
          </span>
        </div>
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Storage</span>
          <span className="text-slate-200 font-mono">SQLite (₹0)</span>
        </div>
      </div>
    </aside>
  );
}
