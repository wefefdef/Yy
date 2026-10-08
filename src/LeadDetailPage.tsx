import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
  MessageSquare,
  User,
  LogOut,
  Calendar,
  Mail,
  Phone,
  Globe,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Lead, LeadComment, LeadStatus } from './types';
import {
  addCommentToFirestore,
  softDeleteLeadInFirestore,
} from './leadService';
import { useAuth } from './AuthContext';

interface LeadDetailPageProps {
  lead: Lead;
  onBack: () => void;
  onLeadDeleted: () => void;
}

const REQUIRED_PASSCODE = '123123123123';

const STATUS_OPTIONS: LeadStatus[] = [
  'Potential',
  'No Potential',
  'No Interest',
  'No Answer',
  'Call Again',
  'FTD',
];

export const LeadDetailPage: React.FC<LeadDetailPageProps> = ({
  lead,
  onBack,
  onLeadDeleted,
}) => {
  const { userEmail, displayName, logout } = useAuth();
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // Add Comment state
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus>(
    (lead.currentStatus as LeadStatus) || 'Potential'
  );
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Delete state with passcode protection
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePasscode, setDeletePasscode] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Subscribe to real-time comments subcollection
  useEffect(() => {
    if (!lead?.id) return;

    setLoadingComments(true);
    const commentsCol = collection(db, 'leads', lead.id, 'comments');
    const q = query(commentsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: LeadComment[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<LeadComment, 'id'>),
        }));
        setComments(loaded);
        setLoadingComments(false);
      },
      (err) => {
        console.error('Error fetching comments:', err);
        setLoadingComments(false);
      }
    );

    return () => unsubscribe();
  }, [lead?.id]);

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

  const formatCommentDate = (val: Timestamp | null | undefined): string => {
    if (!val || !val.toDate) return 'Just now';
    const d = val.toDate();
    return `${d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} — ${d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentFeedback(null);

    if (!commentText.trim()) {
      setCommentFeedback({ type: 'error', msg: 'Please enter a comment message.' });
      return;
    }

    setSavingComment(true);
    try {
      const author = displayName || (userEmail ? userEmail.split('@')[0] : 'James');
      const cleanAuthor = author.charAt(0).toUpperCase() + author.slice(1);
      await addCommentToFirestore(lead.id, {
        status: newStatus,
        comment: commentText,
        userEmail: cleanAuthor,
      });

      setCommentFeedback({ type: 'success', msg: 'Comment recorded successfully.' });
      setCommentText('');
      setIsAddingComment(false);
      setTimeout(() => setCommentFeedback(null), 3000);
    } catch (err: any) {
      console.error('Add comment failed:', err);
      setCommentFeedback({ type: 'error', msg: 'Unable to save comment. Please try again.' });
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteLead = async () => {
    setDeleteError('');

    if (deletePasscode.trim() !== REQUIRED_PASSCODE) {
      setDeleteError('Invalid authorization passcode.');
      return;
    }

    setDeleting(true);
    try {
      await softDeleteLeadInFirestore(lead.id);
      onLeadDeleted();
      onBack();
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteError('Unable to delete lead. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans">
      
      {/* Top Navigation Bar with Back Button and Brand */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] px-6 py-3 shadow-xs">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          
          {/* LEFT: Back Button + Brand name */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Leads</span>
            </button>

            <div className="h-4 w-px bg-[#e2e8f0]" />

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-blue-600 tracking-tight">
                immediate
              </span>
              <span className="text-xs text-[#94a3b8]">/</span>
              <span className="text-xs font-semibold text-slate-600">
                {lead.cid}
              </span>
            </div>
          </div>

          {/* RIGHT: User info + Logout */}
          <div className="flex items-center gap-2.5">
            <div className="text-xs font-medium text-slate-600 px-2.5 py-1 bg-slate-50 rounded border border-[#e2e8f0]">
              <span className="font-bold text-blue-700">{displayName || userEmail}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-red-700 hover:bg-red-50 rounded border border-[#e2e8f0] cursor-pointer flex items-center gap-1 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Full Page Body */}
      <main className="max-w-[1400px] w-full mx-auto p-6 flex-1 flex flex-col space-y-5 animate-in fade-in duration-150">
        
        {/* Top Summary Card (Blue & White Theme) */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-bold px-3 py-1 bg-blue-600 text-white rounded shadow-2xs">
              {lead.cid}
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {lead.firstName} {lead.lastName}
              </h1>
              <div className="text-xs text-blue-600 font-medium mt-0.5">
                {lead.email || 'No email provided'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Current Status
              </div>
              <span className="inline-block mt-0.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded">
                {lead.currentStatus || 'Potential'}
              </span>
            </div>
          </div>
        </div>

        {/* Lead Profile Full Details Grid (Clean Modern CRM Look) */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-[#fafafa] border-b border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Lead Information
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Permanent CID: <strong className="text-slate-700">{lead.cid}</strong>
            </span>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-5 text-xs bg-white">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">First Name</div>
              <div className="text-[13px] font-semibold text-slate-800">{lead.firstName || '—'}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Last Name</div>
              <div className="text-[13px] font-semibold text-slate-800">{lead.lastName || '—'}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Phone Number</span>
              </div>
              <div className="text-[13px] font-semibold text-slate-800">{lead.phone || '—'}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>Email Address</span>
              </div>
              <div className="text-[13px] font-semibold text-blue-600 truncate">{lead.email || '—'}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400" />
                <span>Country</span>
              </div>
              <div className="text-[13px] font-semibold text-slate-800">{lead.country || '—'}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Permanent CID</div>
              <div className="text-[13px] font-semibold text-blue-700">{lead.cid}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Created Date</div>
              <div className="text-[13px] font-semibold text-slate-800">{formatDate(lead.createdAt)}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Status</div>
              <div className="text-[13px] font-semibold text-blue-700">{lead.currentStatus || 'Potential'}</div>
            </div>
          </div>
        </div>

        {/* Comments & Activity Section */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
          
          {/* Section Header */}
          <div className="px-5 py-3.5 bg-[#fafafa] border-b border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Comments & Activity ({comments.length})
              </h2>
            </div>

            {!isAddingComment && (
              <button
                type="button"
                onClick={() => setIsAddingComment(true)}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Comment</span>
              </button>
            )}
          </div>

          {/* Feedback alert */}
          {commentFeedback && (
            <div
              className={`m-5 p-3 text-xs rounded border flex items-center gap-2 ${
                commentFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {commentFeedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              )}
              <span>{commentFeedback.msg}</span>
            </div>
          )}

          {/* Inline Add Comment Form */}
          {isAddingComment && (
            <div className="p-5 border-b border-[#e2e8f0] bg-blue-50/30">
              <form onSubmit={handleAddComment} className="space-y-3.5">
                <div className="w-full sm:w-60">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Update Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Comment Note
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment or follow-up note..."
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingComment(false);
                      setCommentText('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded border border-[#cbd5e1] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingComment}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    {savingComment ? 'Saving...' : 'Add Comment'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Comments List (Smaller font size & smooth presentation as requested) */}
          <div className="p-5 bg-[#f8fafc] space-y-2.5">
            {loadingComments ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 bg-white border border-[#e2e8f0] rounded-md p-6">
                No comments yet. Click "Add Comment" above to record notes or updates for this lead.
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-[#e2e8f0] hover:border-blue-200 rounded-md p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {c.status}
                    </span>
                    <div className="text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-800">{c.createdBy}</span>
                      <span className="mx-1.5">•</span>
                      <span>{formatCommentDate(c.createdAt)}</span>
                    </div>
                  </div>
                  {/* Smaller, smooth comment text */}
                  <p className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {c.comment}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Delete Lead Section with Passcode Protection */}
        <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(true);
                setDeletePasscode('');
                setDeleteError('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 cursor-pointer py-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Lead</span>
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 w-full justify-between">
              <div className="space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-rose-700" />
                  <span>Passcode required to delete this lead:</span>
                </div>
                {deleteError && (
                  <div className="text-[11px] text-red-600 font-semibold">{deleteError}</div>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="password"
                  value={deletePasscode}
                  onChange={(e) => setDeletePasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="px-2 py-1 text-xs border border-rose-300 rounded bg-white text-slate-900 focus:outline-none focus:border-rose-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePasscode('');
                    setDeleteError('');
                  }}
                  className="px-2 py-1 border border-rose-300 rounded bg-white text-rose-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteLead}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded cursor-pointer disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onBack}
            className="px-4 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded border border-blue-200 cursor-pointer ml-auto transition-colors"
          >
            Back to Leads
          </button>
        </div>

      </main>
    </div>
  );
};
