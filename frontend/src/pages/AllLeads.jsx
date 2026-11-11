import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import { 
  Search, 
  Filter, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  MoreHorizontal, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Edit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

export default function AllLeads({ 
  onSelectLead, 
  onEditLead, 
  onAddLead, 
  showToast 
}) {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [phoneStatus, setPhoneStatus] = useState('');
  const [duplicateStatus, setDuplicateStatus] = useState('');
  const [enrichmentStatus, setEnrichmentStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  // Selected leads for batch actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.getLeads({
        page,
        page_size: pageSize,
        search,
        email_status: emailStatus,
        phone_status: phoneStatus,
        duplicate_status: duplicateStatus,
        enrichment_status: enrichmentStatus,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setLeads(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      showToast(err.message || 'Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, pageSize, emailStatus, phoneStatus, duplicateStatus, enrichmentStatus, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const clearFilters = () => {
    setSearch('');
    setEmailStatus('');
    setPhoneStatus('');
    setDuplicateStatus('');
    setEnrichmentStatus('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || emailStatus || phoneStatus || duplicateStatus || enrichmentStatus);

  // Checkbox selection
  const handleToggleAll = () => {
    if (selectedIds.size === leads.length && leads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const handleToggleLead = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Batch actions
  const handleBatchEnrich = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchProcessing(true);
    try {
      const res = await api.batchEnrichLeads(Array.from(selectedIds));
      showToast(`Batch enriched ${res.successful} lead(s) successfully`, 'success');
      setSelectedIds(new Set());
      fetchLeads();
    } catch (err) {
      showToast(err.message || 'Batch enrichment failed', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} selected lead(s)?`)) {
      return;
    }
    setIsBatchProcessing(true);
    try {
      const res = await api.batchDeleteLeads(Array.from(selectedIds));
      showToast(`Deleted ${res.successful} lead(s)`, 'success');
      setSelectedIds(new Set());
      fetchLeads();
    } catch (err) {
      showToast(err.message || 'Batch delete failed', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleDeleteSingle = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete lead '${name || `#${id}`}'?`)) return;
    try {
      await api.deleteLead(id);
      showToast('Lead deleted', 'success');
      fetchLeads();
    } catch (err) {
      showToast(err.message || 'Failed to delete lead', 'error');
    }
  };

  const handleQuickValidate = async (id) => {
    try {
      await api.validateLead(id);
      showToast('Validation updated', 'success');
      fetchLeads();
    } catch (err) {
      showToast(err.message || 'Validation failed', 'error');
    }
  };

  const handleQuickEnrich = async (id) => {
    try {
      await api.enrichLead(id);
      showToast('Lead enriched with AI', 'success');
      fetchLeads();
    } catch (err) {
      showToast(err.message || 'Enrichment failed', 'error');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, company, job title, domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={emailStatus}
              onChange={(e) => { setEmailStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">All Email Statuses</option>
              <option value="domain_valid">Domain Valid (MX)</option>
              <option value="syntax_valid">Syntax Valid</option>
              <option value="invalid">Invalid</option>
              <option value="unverified">Unverified</option>
            </select>

            <select
              value={duplicateStatus}
              onChange={(e) => { setDuplicateStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">All Duplicate States</option>
              <option value="unique">Unique Records</option>
              <option value="possible_duplicate">Possible Duplicates</option>
              <option value="confirmed_duplicate">Confirmed Duplicates</option>
            </select>

            <select
              value={enrichmentStatus}
              onChange={(e) => { setEnrichmentStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">All Enrichment States</option>
              <option value="completed">Enriched</option>
              <option value="pending">Pending</option>
              <option value="needs_review">Needs Review</option>
              <option value="failed">Failed</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Batch Action Toolbar (Appears when checkboxes selected) */}
        {selectedIds.size > 0 && (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
            <span className="font-semibold text-sky-900">
              {selectedIds.size} lead(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchEnrich}
                disabled={isBatchProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Batch Enrich</span>
              </button>

              <a
                href={api.exportLeadsUrl({ lead_ids: Array.from(selectedIds).join(',') })}
                download="selected_leads.csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Selected</span>
              </a>

              <button
                onClick={handleBatchDelete}
                disabled={isBatchProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === leads.length && leads.length > 0}
                    onChange={handleToggleAll}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Email & Deliverability</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Company & Domain</th>
                <th className="py-3.5 px-4">AI Enrichment</th>
                <th className="py-3.5 px-4">Duplicate Check</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-500 mb-2" />
                    <span>Loading leads...</span>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 space-y-3">
                    <p className="text-sm">No leads match your current search or filter criteria.</p>
                    <button
                      onClick={onAddLead}
                      className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition-colors shadow-sm"
                    >
                      Add Prospect Manually
                    </button>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isChecked = selectedIds.has(lead.id);
                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-sky-50/40' : ''}`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleLead(lead.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div 
                          onClick={() => onSelectLead(lead)}
                          className="font-semibold text-slate-900 cursor-pointer hover:text-sky-600 transition-colors"
                        >
                          {lead.full_name || <span className="text-slate-400 italic font-normal">Unnamed</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {lead.job_title || '—'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-slate-800 truncate max-w-[170px]">
                          {lead.email || '—'}
                        </div>
                        <div className="mt-1">
                          <StatusBadge type="email" status={lead.email_status} size="sm" />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-slate-800">
                          {lead.phone || '—'}
                        </div>
                        <div className="mt-1">
                          <StatusBadge type="phone" status={lead.phone_status} size="sm" />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[140px]">
                          {lead.company_name || '—'}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                          {lead.company_domain || '—'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge type="enrichment" status={lead.enrichment_status} size="sm" />
                        {lead.industry && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                            {lead.industry}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge type="duplicate" status={lead.duplicate_status} size="sm" />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectLead(lead)}
                            title="Inspect Details"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleQuickEnrich(lead.id)}
                            title="Enrich Lead with AI"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEditLead(lead)}
                            title="Edit Lead"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteSingle(lead.id, lead.full_name)}
                            title="Delete Lead"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900">{leads.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{total}</span> total leads
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-medium text-slate-700 bg-slate-50 rounded-lg border border-slate-200">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
