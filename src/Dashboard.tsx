import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Lead } from './types';
import { useAuth } from './AuthContext';
import { AddLeadModal } from './AddLeadModal';
import { LeadProfileModal } from './LeadProfileModal';
import { UserManagementModal } from './UserManagementModal';

export const Dashboard: React.FC = () => {
  const { userEmail, displayName, logout } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Search input state
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  // Real-time Firestore subscription to 'leads' collection
  useEffect(() => {
    setLoading(true);
    setDbError(null);

    const leadsCol = collection(db, 'leads');
    const unsubscribe = onSnapshot(
      leadsCol,
      (snapshot) => {
        const loaded: Lead[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (!d.isDeleted) {
            loaded.push({
              id: docSnap.id,
              ...d,
            } as Lead);
          }
        });

        // Sort newest first by createdAt
        loaded.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });

        setLeads(loaded);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore leads query error:', err);
        setDbError('Could not sync with Firestore. Please check your internet connection.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Keep selectedLead in sync with real-time updates
  useEffect(() => {
    if (selectedLead) {
      const refreshed = leads.find((l) => l.id === selectedLead.id);
      if (refreshed) {
        setSelectedLead(refreshed);
      }
    }
  }, [leads]);

  // Search across CID, Name, Phone, Email, Country
  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return leads;

    return leads.filter((lead) => {
      const cidMatch = lead.cid?.toLowerCase().includes(term);
      const nameMatch = `${lead.firstName || ''} ${lead.lastName || ''}`
        .toLowerCase()
        .includes(term);
      const emailMatch = lead.email?.toLowerCase().includes(term);
      const phoneMatch = lead.phone?.toLowerCase().includes(term);
      const countryMatch = lead.country?.toLowerCase().includes(term);
      const statusMatch = lead.currentStatus?.toLowerCase().includes(term);

      return (
        cidMatch ||
        nameMatch ||
        emailMatch ||
        phoneMatch ||
        countryMatch ||
        statusMatch
      );
    });
  }, [leads, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage) || 1;
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredLeads.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredLeads, currentPage]);

  const handleLeadCreated = (newCid: string) => {
    const matched = leads.find((l) => l.cid === newCid);
    if (matched) setSelectedLead(matched);
  };

  const formatDate = (val: Timestamp | string | null | undefined): string => {
    if (!val) return '—';
    if (typeof val === 'string') return val;
    if (val.toDate) {
      const d = val.toDate();
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return '—';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans">
      
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#cbd5e1] px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-6">
          
          {/* LEFT: CRM name / logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0f172a] text-white font-bold flex items-center justify-center text-sm">
              I
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-[#0f172a]">
                immediatecrm.com
              </span>
            </div>
          </div>

          {/* CENTER: Large search bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#94a3b8]">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by CID (e.g. CID-000001), Name, Phone, Email..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-[#94a3b8] hover:text-[#475569] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Add Lead button, Tiny '+' Add User button, User account, Logout */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold text-sm rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>

            <div className="h-5 w-px bg-[#cbd5e1]" />

            {/* Tiny '+' option on top for Add User with Owner Passcode */}
            <button
              type="button"
              onClick={() => setIsUserModalOpen(true)}
              title="Add User (Owner Passcode)"
              className="w-8 h-8 flex items-center justify-center rounded border border-[#cbd5e1] bg-white hover:bg-slate-100 text-[#0f172a] font-bold text-base cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              +
            </button>

            <div className="text-sm font-medium text-[#334155] px-2.5 py-1 bg-[#f1f5f9] rounded border border-[#cbd5e1]">
              <span className="font-bold text-[#0f172a]">{displayName || userEmail}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="px-3 py-2 text-sm text-[#475569] hover:text-red-700 hover:bg-red-50 rounded border border-[#cbd5e1] cursor-pointer flex items-center gap-1.5 font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-[1600px] w-full mx-auto p-6 flex-1 flex flex-col space-y-4">
        
        {/* Error notification if any */}
        {dbError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dbError}</span>
          </div>
        )}

        {/* Lead Table Container (Clean Google Sheet Style) */}
        <div className="bg-white border border-[#cbd5e1] rounded shadow-xs flex-1 flex flex-col overflow-hidden">
          
          {/* Table Header Bar */}
          <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between text-xs text-[#475569]">
            <div className="font-bold uppercase tracking-wider text-[#334155]">
              Leads ({filteredLeads.length})
            </div>
            <div className="text-xs text-[#64748b]">
              Click on any CID or row to open full lead profile and comments
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto flex-1 min-h-[480px]">
            {loading ? (
              <div className="p-16 text-center text-sm text-[#64748b] flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
                <span>Loading leads from Firebase Firestore...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-base font-semibold text-[#334155]">No lead found</p>
                <p className="text-xs text-[#64748b] mt-1">
                  {searchTerm
                    ? `No leads matched "${searchTerm}". Try another search term.`
                    : 'No leads in the database yet. Click "Add Lead" to create your first lead.'}
                </p>
                {!searchTerm && (
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-4 px-4 py-2 bg-[#0f172a] text-white text-xs font-semibold rounded hover:bg-[#1e293b] cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Lead</span>
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left sheet-table text-sm">
                <thead className="bg-[#f1f5f9] text-[#334155] text-xs font-bold uppercase tracking-wider sticky top-0 z-10 select-none">
                  <tr>
                    <th className="py-3 px-4 w-36">Created Date</th>
                    <th className="py-3 px-4 min-w-[200px]">Name</th>
                    <th className="py-3 px-4 min-w-[150px]">Country</th>
                    <th className="py-3 px-4 min-w-[220px]">Email</th>
                    <th className="py-3 px-4 min-w-[130px]">Date of Birth</th>
                    <th className="py-3 px-4 w-36">CID</th>
                    <th className="py-3 px-4 w-32 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] bg-white">
                  {paginatedLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-[#f1f5f9] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-xs text-[#64748b] whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0f172a]">
                        {lead.firstName} {lead.lastName}
                      </td>
                      <td className="py-3 px-4 text-[#334155] whitespace-nowrap">
                        {lead.country || '—'}
                      </td>
                      <td className="py-3 px-4 text-[#334155] text-xs truncate max-w-[240px]">
                        {lead.email}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#475569] whitespace-nowrap">
                        {lead.dateOfBirth || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                        >
                          {lead.cid}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                          {lead.currentStatus || 'New'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Pagination & Footer */}
          <div className="px-4 py-3 bg-[#f8fafc] border-t border-[#cbd5e1] flex items-center justify-between text-xs text-[#475569]">
            <div>
              Showing{' '}
              <span className="font-bold">
                {filteredLeads.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-bold">
                {Math.min(currentPage * rowsPerPage, filteredLeads.length)}
              </span>{' '}
              of <span className="font-bold">{filteredLeads.length}</span> leads
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-[#cbd5e1] bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-medium flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              
              <span className="px-3 font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-[#cbd5e1] bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-medium flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadCreated={handleLeadCreated}
      />

      <LeadProfileModal
        lead={selectedLead}
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={() => {}}
        onLeadDeleted={() => setSelectedLead(null)}
      />

      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />
    </div>
  );
};
