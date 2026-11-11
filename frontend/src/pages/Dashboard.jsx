import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  UploadCloud, 
  Plus, 
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard({ onNavigate, onAddLead, onSelectLead, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-medium">Loading database statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 m-8">
        <h3 className="font-semibold text-base mb-1">Failed to fetch dashboard data</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={loadDashboard}
          className="mt-3 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, charts, recent_leads, recent_enriched, recent_imports } = data;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-sky-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase tracking-wider">
              B2B Lead Intelligence
            </span>
            <span className="text-xs text-slate-300">• Zero-Cost Architecture</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Prospect Enrichment & Deliverability Hub</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Validate contact syntax & mail exchangers, eliminate duplicate records, extract corporate domains, and classify company business models.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('import')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/15 transition-all shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-sky-400" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={onAddLead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-all shadow-lg shadow-sky-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Lead</span>
          </button>
        </div>
      </div>

      {/* 6 Real Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Leads"
          value={stats.total_leads}
          icon={Users}
          color="blue"
          subtext="In SQLite database"
          onClick={() => onNavigate('leads')}
        />
        <StatCard
          title="Valid Leads"
          value={stats.valid_leads}
          icon={CheckCircle2}
          color="emerald"
          subtext="Verified MX / syntax"
          onClick={() => onNavigate('leads')}
        />
        <StatCard
          title="Invalid Leads"
          value={stats.invalid_leads}
          icon={AlertCircle}
          color="rose"
          subtext="Defective syntax or DNS"
          onClick={() => onNavigate('leads')}
        />
        <StatCard
          title="Duplicates"
          value={stats.duplicate_leads}
          icon={AlertTriangle}
          color="amber"
          subtext="Flagged for review"
          onClick={() => onNavigate('duplicates')}
        />
        <StatCard
          title="Enriched"
          value={stats.enriched_leads}
          icon={Sparkles}
          color="indigo"
          subtext="AI classification ready"
          onClick={() => onNavigate('enrichment')}
        />
        <StatCard
          title="Pending"
          value={stats.pending_enrichment}
          icon={Clock}
          color="blue"
          subtext="Awaiting enrichment"
          onClick={() => onNavigate('leads')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Validation Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-sky-500" />
                Contact Deliverability Breakdown
              </h3>
              <p className="text-xs text-slate-500">Distribution across validated email states</p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              {stats.total_leads} records
            </span>
          </div>

          <div className="h-64 w-full">
            {charts.validation_status.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.validation_status}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {charts.validation_status.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#0EA5E9'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No lead validation data yet. Upload or add leads to populate.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Industry Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Industry Breakdown
              </h3>
              <p className="text-xs text-slate-500">Top classified industry sectors</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {charts.industry_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.industry_distribution} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} 
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {charts.industry_distribution.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color || '#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No industry classifications yet. Enrich leads to view breakdown.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Added Leads */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              Recently Imported Prospects
            </h3>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recent_leads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Name / Role</th>
                    <th className="pb-3">Email & Status</th>
                    <th className="pb-3">Company</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent_leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">{lead.full_name || 'Unnamed Prospect'}</div>
                        <div className="text-[11px] text-slate-500">{lead.job_title || '—'}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-slate-800 font-mono text-[11px]">{lead.email || '—'}</div>
                        <div className="mt-1">
                          <StatusBadge type="email" status={lead.email_status} size="sm" />
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-slate-800">{lead.company_name || '—'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{lead.company_domain || '—'}</div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="px-2.5 py-1 text-xs font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No leads currently in database. Click "Upload CSV" or "Add Single Lead".
            </div>
          )}
        </div>

        {/* CSV Import History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Recent Imports
            </h3>
            <button
              onClick={() => onNavigate('import')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recent_imports.length > 0 ? (
            <div className="space-y-3">
              {recent_imports.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-900 truncate">
                    <span className="truncate max-w-[160px]">{item.filename}</span>
                    <span className="text-emerald-600 font-mono text-[11px]">+{item.successful_records} leads</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/40">
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    <span>Total: {item.total_records} | Dups: {item.duplicate_records}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No CSV files imported yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
