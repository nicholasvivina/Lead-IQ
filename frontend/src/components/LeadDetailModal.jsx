import React, { useState } from 'react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { api } from '../services/api';
import { 
  Mail, 
  Phone, 
  Globe, 
  Building2, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Edit3, 
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export default function LeadDetailModal({ 
  isOpen, 
  onClose, 
  lead, 
  onUpdateLead, 
  onEditClick, 
  onDeleteClick, 
  showToast 
}) {
  if (!lead) return null;

  const [isValidating, setIsValidating] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const updated = await api.validateLead(lead.id);
      onUpdateLead(updated);
      showToast('Validation updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Validation failed', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      const updated = await api.enrichLead(lead.id);
      onUpdateLead(updated);
      showToast('Lead enriched with AI intelligence', 'success');
    } catch (err) {
      showToast(err.message || 'Enrichment failed', 'error');
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead.full_name || 'Prospect Profile'}
      subtitle={`Lead ID #${lead.id} • Added on ${new Date(lead.created_at).toLocaleDateString()}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Top Badges Header */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100">
          <StatusBadge type="email" status={lead.email_status} />
          <StatusBadge type="phone" status={lead.phone_status} />
          <StatusBadge type="duplicate" status={lead.duplicate_status} />
          <StatusBadge type="enrichment" status={lead.enrichment_status} />
        </div>

        {/* Section 1: Contact & Verification */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-sky-500" />
            Contact & Deliverability Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[11px] font-medium text-slate-500">Email Address</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 break-all">
                {lead.email || <span className="text-slate-400 italic font-normal">Not provided</span>}
              </p>
              {lead.email_reason && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed bg-white/80 p-2 rounded-lg border border-slate-200/60">
                  {lead.email_reason}
                </p>
              )}
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500">Phone Number</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {lead.phone || <span className="text-slate-400 italic font-normal">Not provided</span>}
              </p>
              {lead.phone_reason && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed bg-white/80 p-2 rounded-lg border border-slate-200/60">
                  {lead.phone_reason}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Company Information */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            Company & Domain Details
          </h4>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500">Company Name</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{lead.company_name || '—'}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500">Extracted Domain</span>
                <p className="text-sm font-mono text-slate-700 mt-0.5">{lead.company_domain || '—'}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500">Website URL</span>
                {lead.website ? (
                  <a 
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 mt-0.5 truncate"
                  >
                    {lead.website}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">—</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-[11px] font-medium text-slate-500">Job Title</span>
                <p className="text-sm text-slate-800 mt-0.5">{lead.job_title || '—'}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500">Location</span>
                <p className="text-sm text-slate-800 mt-0.5">{lead.location || '—'}</p>
              </div>
            </div>

            {lead.company_description && (
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-500">Company Overview</span>
                  {lead.enrichment_source && (
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      source: {lead.enrichment_source}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-slate-200/60">
                  {lead.company_description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: AI Classification & Analysis */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              AI Intelligence & Classification
            </h4>
            {lead.enrichment_method && (
              <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Method: {lead.enrichment_method === 'groq_ai' ? 'Groq Cloud LLM' : 'Rule-Based Engine'}
              </span>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/40 p-4 rounded-xl border border-indigo-100 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Industry</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{lead.industry || 'Pending classification'}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Business Category</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{lead.business_category || '—'}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Business Model</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{lead.business_model || '—'}</p>
              </div>
            </div>

            {lead.ai_summary && (
              <div className="pt-2 border-t border-indigo-100/80">
                <span className="text-[11px] font-semibold text-slate-500">Factual AI Summary</span>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-white p-2.5 rounded-lg border border-indigo-100">
                  {lead.ai_summary}
                </p>
              </div>
            )}

            {lead.classification_reason && (
              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50/80 p-2 rounded-lg border border-slate-200/60">
                <span className="font-semibold text-slate-700 shrink-0">Evidence / Reason:</span>
                <span>{lead.classification_reason}</span>
                {lead.classification_confidence && (
                  <span className="ml-auto shrink-0 font-medium capitalize text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                    {lead.classification_confidence} confidence
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Duplicate Analysis */}
        {lead.duplicate_status !== 'unique' && (
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-semibold text-amber-800 mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Duplicate Record Notice</span>
            </div>
            <p className="text-amber-800/90 leading-relaxed">
              {lead.duplicate_reason || 'This record shares contact or company signals with another lead.'}
            </p>
          </div>
        )}

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
              <span>{isValidating ? 'Validating...' : 'Re-Validate'}</span>
            </button>

            <button
              onClick={handleEnrich}
              disabled={isEnriching}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50 shadow-sm shadow-indigo-600/20"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enriching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enrich with AI</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEditClick(lead);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDeleteClick(lead);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
