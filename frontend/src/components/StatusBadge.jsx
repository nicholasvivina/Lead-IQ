import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Sparkles, Clock, HelpCircle } from 'lucide-react';

export default function StatusBadge({ type, status, size = 'md' }) {
  if (!status) return null;

  const s = status.toLowerCase();
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = HelpCircle;
  let label = status.replace(/_/g, ' ');

  // Email status badges
  if (type === 'email') {
    if (s === 'valid' || s === 'domain_valid') {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
      label = s === 'domain_valid' ? 'Domain Valid' : 'Valid';
    } else if (s === 'syntax_valid') {
      colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
      Icon = CheckCircle2;
      label = 'Syntax Valid';
    } else if (s === 'invalid') {
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = AlertCircle;
      label = 'Invalid';
    } else if (s === 'unverified' || s === 'pending') {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = Clock;
      label = 'Unverified';
    }
  }

  // Phone status badges
  else if (type === 'phone') {
    if (s === 'valid') {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
      label = 'Valid E.164';
    } else if (s === 'invalid') {
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = AlertCircle;
      label = 'Invalid';
    } else {
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = Clock;
      label = 'Unverified';
    }
  }

  // Duplicate status badges
  else if (type === 'duplicate') {
    if (s === 'confirmed_duplicate') {
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = AlertCircle;
      label = 'Confirmed Duplicate';
    } else if (s === 'possible_duplicate') {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = AlertTriangle;
      label = 'Possible Duplicate';
    } else {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
      label = 'Unique Lead';
    }
  }

  // Enrichment status badges
  else if (type === 'enrichment') {
    if (s === 'completed') {
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = Sparkles;
      label = 'Enriched';
    } else if (s === 'processing') {
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      Icon = Clock;
      label = 'Processing...';
    } else if (s === 'needs_review') {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = AlertTriangle;
      label = 'Needs Review';
    } else if (s === 'failed') {
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = AlertCircle;
      label = 'Failed';
    } else {
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = Clock;
      label = 'Pending';
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses} capitalize tracking-tight`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label}
    </span>
  );
}
