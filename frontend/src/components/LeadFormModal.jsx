import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../services/api';
import { AlertTriangle, Check, Loader2, Sparkles } from 'lucide-react';

export default function LeadFormModal({ isOpen, onClose, leadToEdit, onSuccess }) {
  const isEdit = Boolean(leadToEdit);

  const initialFormState = {
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    website: '',
    job_title: '',
    industry: '',
    location: '',
    lead_source: 'manual',
    company_description: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [autoValidate, setAutoValidate] = useState(true);
  const [autoEnrich, setAutoEnrich] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    if (leadToEdit) {
      setFormData({
        full_name: leadToEdit.full_name || '',
        email: leadToEdit.email || '',
        phone: leadToEdit.phone || '',
        company_name: leadToEdit.company_name || '',
        website: leadToEdit.website || '',
        job_title: leadToEdit.job_title || '',
        industry: leadToEdit.industry || '',
        location: leadToEdit.location || '',
        lead_source: leadToEdit.lead_source || 'manual',
        company_description: leadToEdit.company_description || '',
      });
      setAutoValidate(false);
      setAutoEnrich(false);
    } else {
      setFormData(initialFormState);
      setAutoValidate(true);
      setAutoEnrich(false);
    }
    setError(null);
    setDuplicateWarning(null);
  }, [leadToEdit, isOpen]);

  // Live duplicate check when email is entered
  const handleEmailBlur = async () => {
    if (!formData.email || isEdit) return;
    try {
      const res = await api.checkDuplicates({
        email: formData.email,
        phone: formData.phone,
        company_name: formData.company_name,
        full_name: formData.full_name,
      });
      if (res.status === 'confirmed_duplicate' || res.status === 'possible_duplicate') {
        setDuplicateWarning(res.reason);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // Ignore background check failure
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        await api.updateLead(leadToEdit.id, formData);
      } else {
        await api.createLead(formData, autoValidate, autoEnrich);
      }
      onSuccess(isEdit ? 'Lead updated successfully' : 'Lead added successfully');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save lead record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Lead #${leadToEdit.id}` : 'Add New Prospect'}
      subtitle={isEdit ? 'Update prospect contact details and company metadata.' : 'Enter prospect information to validate, deduplicate, and enrich.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {duplicateWarning && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span><strong>Duplicate Warning:</strong> {duplicateWarning}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              placeholder="e.g. Jane Doe"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="jane.doe@company.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone (International E.164)
            </label>
            <input
              type="text"
              name="phone"
              placeholder="e.g. +14155552671"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title / Role</label>
            <input
              type="text"
              name="job_title"
              placeholder="e.g. Head of Engineering"
              value={formData.job_title}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              name="company_name"
              placeholder="e.g. Stripe Inc."
              value={formData.company_name}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
            <input
              type="text"
              name="website"
              placeholder="https://company.com"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
            <input
              type="text"
              name="industry"
              placeholder="e.g. Technology & Software"
              value={formData.industry}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location / HQ</label>
            <input
              type="text"
              name="location"
              placeholder="e.g. San Francisco, CA"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Company Description</label>
          <textarea
            name="company_description"
            rows="3"
            placeholder="Brief factual overview of the company's products or services..."
            value={formData.company_description}
            onChange={handleChange}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
          />
        </div>

        {!isEdit && (
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-4 text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoValidate}
                onChange={(e) => setAutoValidate(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span>Auto-validate Email, Phone & Check Duplicates</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoEnrich}
                onChange={(e) => setAutoEnrich(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                Auto-enrich with AI
              </span>
            </label>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Create Lead'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
