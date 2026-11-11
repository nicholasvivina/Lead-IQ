import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import { 
  CopyCheck, 
  AlertTriangle, 
  AlertCircle, 
  Check, 
  Trash2, 
  Eye, 
  ExternalLink,
  ShieldCheck,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function DuplicateReview({ onSelectLead, showToast }) {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(''); // confirmed_duplicate or possible_duplicate

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const res = await api.getLeads({
        duplicate_status: filterType,
        page_size: 100,
      });
      // Filter out unique records
      const dupsOnly = res.items.filter((l) => l.duplicate_status !== 'unique');
      setDuplicates(dupsOnly);
    } catch (err) {
      showToast(err.message || 'Failed to load duplicate leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [filterType]);

  const handleMarkAsUnique = async (lead) => {
    try {
      await api.updateLead(lead.id, {
        duplicate_status: 'unique',
        duplicate_reason: 'Manually marked as unique record by user.',
      });
      showToast(`Lead #${lead.id} marked as unique`, 'success');
      setDuplicates((prev) => prev.filter((l) => l.id !== lead.id));
    } catch (err) {
      showToast(err.message || 'Failed to update lead', 'error');
    }
  };

  const handleDeleteDuplicate = async (lead) => {
    if (!window.confirm(`Delete duplicate lead #${lead.id} (${lead.full_name || lead.email})?`)) return;
    try {
      await api.deleteLead(lead.id);
      showToast(`Duplicate lead #${lead.id} removed`, 'success');
      setDuplicates((prev) => prev.filter((l) => l.id !== lead.id));
    } catch (err) {
      showToast(err.message || 'Failed to delete duplicate', 'error');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Duplicate Lead Review Workbench</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Data Integrity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify exact and potential matching prospects. Inspect conflicting records and resolve duplicates safely.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">All Duplicate Alerts</option>
            <option value="confirmed_duplicate">Confirmed Duplicates Only</option>
            <option value="possible_duplicate">Possible Duplicates Only</option>
          </select>

          <button
            onClick={fetchDuplicates}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Duplicate Cards */}
      {loading ? (
        <div className="py-24 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
          <span className="text-sm font-medium">Checking records for duplicates...</span>
        </div>
      ) : duplicates.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800">Clean Database — Zero Duplicate Alerts</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All prospect records currently in the system have unique email addresses, phone numbers, and company identities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {duplicates.map((lead) => {
            const isConfirmed = lead.duplicate_status === 'confirmed_duplicate';

            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <StatusBadge type="duplicate" status={lead.duplicate_status} />
                    <span className="text-xs font-mono text-slate-400">Lead ID #{lead.id}</span>
                  </div>

                  <div>
                    <h3 
                      onClick={() => onSelectLead(lead)}
                      className="text-base font-bold text-slate-900 cursor-pointer hover:text-sky-600 transition-colors"
                    >
                      {lead.full_name || 'Unnamed Contact'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lead.job_title || 'No Title'} at <strong>{lead.company_name || 'Unknown Company'}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-700">
                    <span>Email: <strong>{lead.email || '—'}</strong></span>
                    <span>Phone: <strong>{lead.phone || '—'}</strong></span>
                    <span>Domain: <strong>{lead.company_domain || '—'}</strong></span>
                  </div>

                  {lead.duplicate_reason && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
                      <strong>Match Criterion:</strong> {lead.duplicate_reason}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectLead(lead)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Record</span>
                  </button>

                  <button
                    onClick={() => handleMarkAsUnique(lead)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Keep as Unique</span>
                  </button>

                  <button
                    onClick={() => handleDeleteDuplicate(lead)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Duplicate</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
