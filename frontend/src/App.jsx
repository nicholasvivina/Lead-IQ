import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Toast from './components/Toast';
import LeadFormModal from './components/LeadFormModal';
import LeadDetailModal from './components/LeadDetailModal';

// Pages
import Dashboard from './pages/Dashboard';
import AllLeads from './pages/AllLeads';
import ImportLeads from './pages/ImportLeads';
import EnrichmentResults from './pages/EnrichmentResults';
import DuplicateReview from './pages/DuplicateReview';
import SettingsPage from './pages/SettingsPage';

import { api } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [settingsData, setSettingsData] = useState(null);
  const [toast, setToast] = useState(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showToast = (message, type = 'info', title = null) => {
    setToast({ message, type, title });
  };

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettingsData(res);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleOpenAddLead = () => {
    setLeadToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditLead = (lead) => {
    setLeadToEdit(lead);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleLeadSaved = (msg) => {
    showToast(msg, 'success');
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLeadUpdatedFromModal = (updatedLead) => {
    setSelectedLead(updatedLead);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteLeadFromModal = async (lead) => {
    if (!window.confirm(`Delete lead #${lead.id} (${lead.full_name || lead.email})?`)) return;
    try {
      await api.deleteLead(lead.id);
      showToast('Lead deleted successfully', 'success');
      setIsDetailModalOpen(false);
      setSelectedLead(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      showToast(err.message || 'Failed to delete lead', 'error');
    }
  };

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    loadSettings();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Data refreshed from SQLite database', 'info');
    }, 400);
  };

  const pageTitles = {
    dashboard: {
      title: 'Executive Dashboard',
      subtitle: 'Real-time overview of contact health, delivery status, and company enrichment.',
    },
    leads: {
      title: 'Prospect Database',
      subtitle: 'Complete searchable directory with multi-field filtering, column sorting, and bulk actions.',
    },
    import: {
      title: 'CSV Import Pipeline',
      subtitle: 'Upload, preview, auto-alias columns, and ingest records with duplicate protection.',
    },
    enrichment: {
      title: 'AI Enrichment Results',
      subtitle: 'Deep company intelligence, industry categorization, and monetization model detection.',
    },
    duplicates: {
      title: 'Duplicate Resolution Workbench',
      subtitle: 'Audit confirmed and possible duplicate signals and resolve conflicting leads.',
    },
    settings: {
      title: 'Settings & AI Engine',
      subtitle: 'Manage Groq API keys, model parameters, and zero-cost local architecture.',
    },
  };

  const currentMeta = pageTitles[currentPage] || pageTitles.dashboard;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        settingsData={settingsData}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onAddLead={handleOpenAddLead}
          onImportClick={() => setCurrentPage('import')}
          onRefresh={handleGlobalRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <Dashboard
              key={refreshTrigger}
              onNavigate={setCurrentPage}
              onAddLead={handleOpenAddLead}
              onSelectLead={handleOpenDetailModal}
              showToast={showToast}
            />
          )}

          {currentPage === 'leads' && (
            <AllLeads
              key={refreshTrigger}
              onSelectLead={handleOpenDetailModal}
              onEditLead={handleOpenEditLead}
              onAddLead={handleOpenAddLead}
              showToast={showToast}
            />
          )}

          {currentPage === 'import' && (
            <ImportLeads
              key={refreshTrigger}
              onNavigate={setCurrentPage}
              showToast={showToast}
            />
          )}

          {currentPage === 'enrichment' && (
            <EnrichmentResults
              key={refreshTrigger}
              onSelectLead={handleOpenDetailModal}
              onEditLead={handleOpenEditLead}
              showToast={showToast}
            />
          )}

          {currentPage === 'duplicates' && (
            <DuplicateReview
              key={refreshTrigger}
              onSelectLead={handleOpenDetailModal}
              showToast={showToast}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              settingsData={settingsData}
              onSettingsUpdated={(newSettings) => setSettingsData(newSettings)}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Lead Modal */}
      <LeadFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setLeadToEdit(null);
        }}
        leadToEdit={leadToEdit}
        onSuccess={handleLeadSaved}
      />

      {/* Detailed Lead Inspector Modal */}
      <LeadDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onUpdateLead={handleLeadUpdatedFromModal}
        onEditClick={handleOpenEditLead}
        onDeleteClick={handleDeleteLeadFromModal}
        showToast={showToast}
      />

      {/* Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
