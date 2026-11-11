import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import { 
  Sparkles, 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  RefreshCw, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Cpu,
  Layers,
  Edit3
} from 'lucide-react';

export default function EnrichmentResults({ onSelectLead, onEditLead, showToast }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isBatchEnriching, setIsBatchEnriching] = useState(false);
  const [enrichingId, setEnrichingId] = useState(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.getLeads({
        enrichment_status: statusFilter,
        page_size: 50,
      });
      setLeads(res.items);
    } catch (err) {
      showToast(err.message || 'Failed to load enrichment records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleSingleEnrich = async (leadId) => {
    setEnrichingId(leadId);
    try {
      const updated = await api.enrichLead(leadId);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      showToast(`Lead #${leadId} enriched successfully`, 'success');
    } catch (err) {
      showToast(err.message || 'Enrichment failed', 'error');
    } finally {
      setEnrichingId(null);
    }
  };

  const handleBatchEnrichPending = async () => {
    const pendingIds = leads.filter((l) => l.enrichment_status !== 'completed').map((l) => l.id);
    if (pendingIds.length === 0) {
      showToast('All leads on this page are already enriched', 'info');
      return;
    }
    setIsBatchEnriching(true);
    try {
      const res = await api.batchEnrichLeads(pendingIds);
      showToast(`Successfully enriched ${res.successful} lead(s)`, 'success');
      fetchLeads();
    } catch (err) {
      showToast(err.message || 'Batch enrichment failed', 'error');
    } finally {
      setIsBatchEnriching(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">AI Lead Enrichment Results</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Company Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            View factual summaries, industry classification, business categories, and monetization models.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">All Enrichment States</option>
            <option value="completed">Completed Only</option>
            <option value="pending">Pending Only</option>
            <option value="needs_review">Needs Review</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={handleBatchEnrichPending}
            disabled={isBatchEnriching}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {isBatchEnriching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Enriching Batch...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enrich All Pending</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
          <span className="text-sm font-medium">Loading enrichment records...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
          <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
          <h3 className="font-semibold text-slate-800">No leads match this enrichment filter</h3>
          <p className="text-xs text-slate-400">Import or add leads to inspect AI classification.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leads.map((lead) => {
            const isEnriched = lead.enrichment_status === 'completed';
            const isWorking = enrichingId === lead.id;

            return (
              <div 
                key={lead.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 
                      onClick={() => onSelectLead(lead)}
                      className="font-bold text-slate-900 text-base cursor-pointer hover:text-sky-600 transition-colors"
                    >
                      {lead.full_name || 'Unnamed Prospect'}
                    </h3>
                    <p className="text-xs text-slate-500">{lead.job_title || 'Role not specified'} • {lead.location || 'Location unverified'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge type="enrichment" status={lead.enrichment_status} size="sm" />
                  </div>
                </div>

                {/* Company & Domain Details */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      Company
                    </span>
                    <p className="font-semibold text-slate-900 truncate mt-0.5">{lead.company_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      Extracted Domain
                    </span>
                    <p className="font-mono text-slate-700 truncate mt-0.5">{lead.company_domain || '—'}</p>
                  </div>
                </div>

                {/* AI / Classification Box */}
                {isEnriched ? (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/30 border border-indigo-100 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block">
                          Industry Sector
                        </span>
                        <span className="font-semibold text-slate-900 mt-0.5 block">{lead.industry || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block">
                          Business Category
                        </span>
                        <span className="font-semibold text-slate-900 mt-0.5 block">{lead.business_category || '—'}</span>
                      </div>
                    </div>

                    {lead.business_model && (
                      <div className="text-xs pt-2 border-t border-indigo-100/60">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                          Monetization Model
                        </span>
                        <span className="font-medium text-slate-800 mt-0.5 block">{lead.business_model}</span>
                      </div>
                    )}

                    {lead.ai_summary && (
                      <div className="text-xs pt-2 border-t border-indigo-100/60">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                          Factual AI Summary
                        </span>
                        <p className="text-xs text-slate-700 mt-0.5 leading-relaxed bg-white p-2.5 rounded-lg border border-indigo-100">
                          {lead.ai_summary}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-indigo-500" />
                        {lead.enrichment_method === 'groq_ai' ? 'Groq Cloud LLM' : 'Rule-Based Engine'}
                      </span>
                      {lead.enrichment_source && (
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                          src: {lead.enrichment_source}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      Company classification and factual summary have not been run for this lead.
                    </p>
                    <button
                      onClick={() => handleSingleEnrich(lead.id)}
                      disabled={isWorking}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors shadow-sm"
                    >
                      {isWorking ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Classifying...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Run AI Classification</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge type="email" status={lead.email_status} size="sm" />
                    <StatusBadge type="phone" status={lead.phone_status} size="sm" />
                  </div>

                  <div className="flex items-center gap-2">
                    {isEnriched && (
                      <button
                        onClick={() => handleSingleEnrich(lead.id)}
                        disabled={isWorking}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Re-run Enrichment"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isWorking ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
