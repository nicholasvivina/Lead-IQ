import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Download, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  FileCheck
} from 'lucide-react';

const STANDARD_FIELDS = [
  { key: 'full_name', label: 'Full Name / Contact' },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'website', label: 'Company Website / URL' },
  { key: 'job_title', label: 'Job Title / Designation' },
  { key: 'industry', label: 'Industry Sector' },
  { key: 'location', label: 'Location / City / Country' },
  { key: 'company_description', label: 'Company Description' },
  { key: 'lead_source', label: 'Lead Source' },
];

export default function ImportLeads({ onNavigate, showToast }) {
  // Steps: 1 = upload, 2 = mapping & preview, 3 = summary result
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [autoValidate, setAutoValidate] = useState(true);
  const [autoEnrich, setAutoEnrich] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Import history
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getImportHistory();
      setHistory(res);
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      showToast('Please select a valid CSV file (.csv)', 'error');
      return;
    }

    setFile(selected);
    setIsProcessing(true);

    try {
      const preview = await api.previewCsv(selected);
      setPreviewData(preview);
      setColumnMapping(preview.suggested_mapping || {});
      setStep(2);
      showToast(`Parsed ${preview.total_rows} rows from ${selected.name}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to inspect CSV file', 'error');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (header, targetField) => {
    setColumnMapping((prev) => ({
      ...prev,
      [header]: targetField,
    }));
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    setIsProcessing(true);

    try {
      const payload = {
        filename: previewData.filename,
        column_mapping: columnMapping,
        skip_duplicates: skipDuplicates,
        auto_validate: autoValidate,
        auto_enrich: autoEnrich,
        rows: previewData.preview_rows,
      };

      const result = await api.processCsvImport(payload);
      setImportResult(result);
      setStep(3);
      showToast(`Successfully processed import (${result.successful_records} leads saved)`, 'success');
      fetchHistory();
    } catch (err) {
      showToast(err.message || 'Failed to complete CSV import', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImport = () => {
    setStep(1);
    setFile(null);
    setPreviewData(null);
    setColumnMapping({});
    setImportResult(null);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Wizard Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">CSV Prospect Ingestion Pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bulk upload leads with intelligent column aliasing, duplicate interception, and syntax/DNS validation.
          </p>
        </div>

        {/* Progress tracker */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${step === 1 ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            <span>1. Upload</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${step === 2 ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            <span>2. Map & Preview</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${step === 3 ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            <span>3. Complete</span>
          </div>
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-12 text-center transition-colors bg-slate-50/50 hover:bg-sky-50/20 cursor-pointer relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-md shadow-sky-500/10">
                {isProcessing ? <Loader2 className="w-7 h-7 animate-spin" /> : <UploadCloud className="w-7 h-7" />}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {isProcessing ? 'Analyzing CSV structure...' : 'Click or Drag & Drop CSV File'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Supports comma, semicolon or tab delimiters. Maximum size 10MB.
                </p>
              </div>
              <span className="inline-block mt-2 px-3 py-1 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm">
                Select .CSV file
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-500" />
              <span>Looking for sample test records? Check <strong>sample_data/sample_leads.csv</strong> in your project.</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING & PREVIEW */}
      {step === 2 && previewData && (
        <div className="space-y-6">
          {/* Mapping Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 4: Map CSV Headers to Standard Lead Fields</h3>
                <p className="text-xs text-slate-500">We auto-matched probable column aliases. Verify or adjust targets below.</p>
              </div>
              <span className="text-xs font-mono bg-sky-50 text-sky-700 px-3 py-1 rounded-lg border border-sky-200">
                {previewData.filename} ({previewData.total_rows} rows)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewData.headers.map((header) => {
                const currentMapped = columnMapping[header] || '';
                return (
                  <div key={header} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 block truncate" title={header}>
                      {header}
                    </span>
                    <select
                      value={currentMapped}
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="">-- Ignore Column --</option>
                      {STANDARD_FIELDS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Import Options Checkboxes */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span className="font-medium">Skip Confirmed Duplicate Leads (Avoid Overwrites)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoValidate}
                  onChange={(e) => setAutoValidate(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span className="font-medium">Validate Email Syntax & Phone E.164</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoEnrich}
                  onChange={(e) => setAutoEnrich(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span className="font-medium flex items-center gap-1 text-indigo-700">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Auto-Enrich with AI
                </span>
              </label>
            </div>
          </div>

          {/* First Records Preview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Step 3: Preview of First Records</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    {previewData.headers.map((h) => (
                      <th key={h} className="py-2.5 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.preview_rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {previewData.headers.map((h) => (
                        <td key={h} className="py-2 px-3 whitespace-nowrap text-slate-700">
                          {row[h] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={resetImport}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Back / Choose Different File
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-md shadow-sky-600/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing & Validating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Process Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: IMPORT SUMMARY */}
      {step === 3 && importResult && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Import Processing Complete</h3>
              <p className="text-xs text-slate-500">
                Summary for file <strong>{importResult.filename}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Total Records</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{importResult.total_records}</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700">Successfully Imported</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{importResult.successful_records}</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-xs font-semibold text-amber-700">Duplicate Records</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">{importResult.duplicate_records}</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-xs font-semibold text-rose-700">Invalid Records</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">{importResult.invalid_records}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 border border-slate-300">
              <span className="text-xs font-semibold text-slate-600">Skipped / Rejected</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{importResult.rejected_records}</p>
            </div>
          </div>

          {importResult.rejected_records > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-900">Download Rejected & Skipped Records</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Download a CSV containing the skipped records and reasons for auditing.
                </p>
              </div>
              <a
                href={api.getRejectedExportUrl(importResult.import_history_id)}
                download={`rejected_${importResult.filename}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-300 rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Rejected CSV</span>
              </a>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={resetImport}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Upload Another CSV
            </button>

            <button
              onClick={() => onNavigate('leads')}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-sm"
            >
              View Imported Leads
            </button>
          </div>
        </div>
      )}

      {/* CSV Import History */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Import History & Audit Log
        </h3>

        {history.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Import Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Imported</th>
                  <th className="py-3 px-4">Duplicates</th>
                  <th className="py-3 px-4">Rejected</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{h.filename}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(h.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">{h.total_records}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">{h.successful_records}</td>
                    <td className="py-3 px-4 font-mono text-amber-600">{h.duplicate_records}</td>
                    <td className="py-3 px-4 font-mono text-rose-600">{h.rejected_records}</td>
                    <td className="py-3 px-4 text-right">
                      {h.has_rejected_data ? (
                        <a
                          href={api.getRejectedExportUrl(h.id)}
                          download={`rejected_${h.filename}`}
                          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
                        >
                          <Download className="w-3 h-3" />
                          <span>Rejected CSV</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No previous imports recorded in database.
          </div>
        )}
      </div>
    </div>
  );
}
