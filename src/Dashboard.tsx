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
import { UserManagementModal } from './UserManagementModal';
import { LeadDetailPage } from './LeadDetailPage';

export const Dashboard: React.FC = () => {
  const { userEmail, displayName, logout } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Search input state
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Page Navigation state
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

  // Keep selectedLead in sync with real-time updates if opened
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

  // FULL PAGE VIEW: When user opens any lead, switch to dedicated full page
  if (selectedLead) {
    return (
      <LeadDetailPage
        lead={selectedLead}
        onBack={() => setSelectedLead(null)}
        onLeadDeleted={() => setSelectedLead(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans">
      
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] px-6 py-2.5 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          
          {/* LEFT CORNER: Brand name 'immediate' */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-blue-600 tracking-tight select-none">
              immediate
            </span>
          </div>

          {/* RIGHT CORNER: Search Bar + Add Lead + Tiny '+' Add User + Account + Logout */}
          <div className="flex items-center gap-2.5">
            {/* Search Bar on Right Top Corner */}
            <div className="relative w-64 sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-[#94a3b8]">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search leads..."
                className="w-full pl-8 pr-7 py-1.5 bg-[#f8fafc] hover:bg-white focus:bg-white border border-[#cbd5e1] focus:border-blue-500 rounded text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[11px] text-[#94a3b8] hover:text-[#475569] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Blue Add Lead button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>

            {/* Tiny '+' option on top for Add User with Owner Passcode */}
            <button
              type="button"
              onClick={() => setIsUserModalOpen(true)}
              title="Add User (Owner Passcode)"
              className="w-7 h-7 flex items-center justify-center rounded border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 font-bold text-sm cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              +
            </button>

            <div className="h-4 w-px bg-[#e2e8f0]" />

            <div className="text-xs font-semibold text-blue-700 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded">
              {displayName || userEmail}
            </div>

            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded border border-[#e2e8f0] cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-[1600px] w-full mx-auto p-6 flex-1 flex flex-col space-y-4">
        
        {/* Error notification if any */}
        {dbError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dbError}</span>
          </div>
        )}

        {/* Lead Table Container (Clean Minimal Spreadsheet Style like attached image) */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-xs flex-1 flex flex-col overflow-hidden">
          
          {/* Table Header Bar */}
          <div className="px-4 py-2 bg-[#fafafa] border-b border-[#e2e8f0] flex items-center justify-between text-xs text-slate-500">
            <div className="font-semibold text-slate-700 text-xs">
              All Leads ({filteredLeads.length})
            </div>
            <div className="text-[11px] text-slate-400">
              Click any row to open the full lead page
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto flex-1 min-h-[480px]">
            {loading ? (
              <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading leads...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-sm font-semibold text-slate-700">No leads found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchTerm
                    ? `No leads matched "${searchTerm}". Try another search.`
                    : 'No leads in the database yet. Click "Add Lead" to record your first lead.'}
                </p>
                {!searchTerm && (
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-4 px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lead</span>
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left sheet-table text-xs">
                <thead className="bg-[#fafafa] text-slate-600 font-medium sticky top-0 z-10 select-none">
                  <tr>
                    <th className="py-2.5 px-3.5 text-[12px] font-medium text-slate-600 w-32 border-r border-b border-[#e2e8f0]">
                      CID
                    </th>
                    <th className="py-2.5 px-3.5 text-[12px] font-medium text-slate-600 min-w-[170px] border-r border-b border-[#e2e8f0]">
                      First Name
                    </th>
                    <th className="py-2.5 px-3.5 text-[12px] font-medium text-slate-600 min-w-[170px] border-r border-b border-[#e2e8f0]">
                      Last Name
                    </th>
                    <th className="py-2.5 px-3.5 text-[12px] font-medium text-slate-600 min-w-[210px] border-r border-b border-[#e2e8f0]">
                      Email
                    </th>
                    <th className="py-2.5 px-3.5 text-[12px] font-medium text-slate-600 min-w-[140px] border-r border-b border-[#e2e8f0]">
                      Phone
                    </th>
                    <th className="py-2.5 px-3.5 text-[12px] font-medium text-slate-600 min-w-[130px] border-r border-b border-[#e2e8f0]">
                      Country
                    </th>
                    <th className="py-2.5 px-3.5 text-[12px] font-medium text-slate-600 w-28 text-center border-r border-b border-[#e2e8f0]">
                      Status
                    </th>
                    <th className="py-2.5 px-3.5 text-[12px] font-medium text-slate-600 w-32 border-b border-[#e2e8f0]">
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#e2e8f0]">
                  {paginatedLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-b border-[#e2e8f0]">
                        <span className="font-semibold text-xs text-blue-600 hover:text-blue-800 hover:underline">
                          {lead.cid}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-800 text-[13px] border-r border-b border-[#e2e8f0]">
                        {lead.firstName || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700 text-[13px] border-r border-b border-[#e2e8f0]">
                        {lead.lastName || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-blue-600 hover:underline text-[13px] truncate max-w-[220px] border-r border-b border-[#e2e8f0]">
                        {lead.email || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 text-[12px] whitespace-nowrap border-r border-b border-[#e2e8f0]">
                        {lead.phone || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 text-[12px] whitespace-nowrap border-r border-b border-[#e2e8f0]">
                        {lead.country || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap border-r border-b border-[#e2e8f0]">
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {lead.currentStatus || 'Potential'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-400 whitespace-nowrap border-b border-[#e2e8f0]">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Pagination & Footer */}
          <div className="px-4 py-2.5 bg-[#fafafa] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {filteredLeads.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * rowsPerPage, filteredLeads.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{filteredLeads.length}</span> leads
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-2.5 py-1 text-xs rounded border border-[#cbd5e1] bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer font-medium flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="text-xs px-2 text-slate-600">
                Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
                <strong className="text-slate-800">{totalPages}</strong>
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-2.5 py-1 text-xs rounded border border-[#cbd5e1] bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer font-medium flex items-center gap-1 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadCreated={handleLeadCreated}
      />

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />
    </div>
  );
};
