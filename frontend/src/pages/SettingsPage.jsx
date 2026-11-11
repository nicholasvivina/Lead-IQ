import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Info
} from 'lucide-react';

export default function SettingsPage({ settingsData, onSettingsUpdated, showToast }) {
  const [groqKey, setGroqKey] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (settingsData) {
      setGroqModel(settingsData.groq_model || 'llama-3.3-70b-versatile');
    }
  }, [settingsData]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateSettings({
        groq_api_key: groqKey ? groqKey.trim() : undefined,
        groq_model: groqModel,
      });
      onSettingsUpdated(updated);
      setGroqKey('');
      showToast('Settings saved successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAI = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testGroq({
        sample_company: 'LeadIQ Technologies',
        sample_domain: 'leadiq.io',
      });
      setTestResult(res);
      showToast(`AI Test successful (${res.method_used === 'groq_ai' ? 'Groq Cloud' : 'Rule-Based Engine'})`, 'success');
    } catch (err) {
      showToast(err.message || 'AI test failed', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const hasGroq = settingsData?.groq_configured;

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Configuration & AI Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Groq API keys, model selections, or rely on zero-cost deterministic fallback.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
          <SettingsIcon className="w-5 h-5" />
        </div>
      </div>

      {/* Zero Cost Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 space-y-1">
          <h4 className="font-bold text-emerald-900">Strict ₹0 Spend Guarantee Active</h4>
          <p className="leading-relaxed">
            LeadIQ operates with zero paid services. Database runs on local <strong>SQLite</strong>, email MX validation uses <strong>dnspython</strong>, phone formatting runs through Google’s open-source <strong>phonenumbers</strong> library, and company classification operates seamlessly using <strong>Groq free tier</strong> or our built-in <strong>rule-based fallback engine</strong>.
          </p>
        </div>
      </div>

      {/* Groq AI Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Groq Cloud AI Configuration</h3>
              <p className="text-xs text-slate-500">Optional: Provide free Groq API key for LLM-based company classification.</p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
            hasGroq ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {hasGroq ? 'Key Active' : 'Fallback Active'}
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Groq API Key {settingsData?.groq_masked_key && `(Current: ${settingsData.groq_masked_key})`}
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder={hasGroq ? 'Enter new key to update...' : 'gsk_... (Leave empty for rule-based engine)'}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Get a free API key at <strong>console.groq.com</strong>. No credit card required.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Model Selection</label>
            <select
              value={groqModel}
              onChange={(e) => setGroqModel(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
            >
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
              <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest)</option>
              <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
              <option value="gemma2-9b-it">gemma2-9b-it</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestAI}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Test AI Connection Live</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save Configuration</span>
            </button>
          </div>
        </form>

        {/* Live Test Diagnostic Output */}
        {testResult && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Live Classification Test Result
              </span>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                Mode: {testResult.method_used === 'groq_ai' ? 'Groq Cloud LLM' : 'Rule-Based Engine'}
              </span>
            </div>
            <pre className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto">
              {JSON.stringify(testResult.classification, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Architecture & Storage Details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Database & System Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
            <span className="font-semibold text-slate-500">Storage Engine</span>
            <p className="font-medium text-slate-900">SQLite (File-based: ./leadiq.db)</p>
            <p className="text-[11px] text-slate-400">Zero installation, zero cost, persists across server restarts.</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
            <span className="font-semibold text-slate-500">FastAPI Backend</span>
            <p className="font-medium text-slate-900">Port 8000 • Interactive Swagger at /docs</p>
            <p className="text-[11px] text-slate-400">Includes CORS, Pydantic validation, dnspython, and phonenumbers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
