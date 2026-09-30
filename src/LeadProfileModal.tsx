import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  User,
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

interface LeadProfileModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
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

export const LeadProfileModal: React.FC<LeadProfileModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onLeadDeleted,
}) => {
  const { userEmail, displayName } = useAuth();
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // Full Profile accordion toggle state (hidden by default)
  const [showFullProfile, setShowFullProfile] = useState(false);

  // Add Comment toggle & form state
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus>('Potential');
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Delete state with passcode protection
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePasscode, setDeletePasscode] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Reset states when lead changes
  useEffect(() => {
    if (lead) {
      setShowFullProfile(false);
      setIsAddingComment(false);
      setCommentText('');
      setCommentFeedback(null);
      setShowDeleteConfirm(false);
      setDeletePasscode('');
      setDeleteError('');
    }
  }, [lead]);

  // Subscribe to real-time comments subcollection
  useEffect(() => {
    if (!lead?.id || !isOpen) return;

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
  }, [lead?.id, isOpen]);

  if (!isOpen || !lead) return null;

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

      setCommentFeedback({ type: 'success', msg: 'Comment saved to Firestore.' });
      setCommentText('');
      setIsAddingComment(false);
      onLeadUpdated();
      setTimeout(() => setCommentFeedback(null), 3000);
    } catch (err: any) {
      console.error('Add comment failed:', err);
      setCommentFeedback({ type: 'error', msg: 'Unable to save. Please try again.' });
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
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteError('Unable to delete lead. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="bg-white border border-[#cbd5e1] rounded w-full max-w-4xl shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-[#cbd5e1] bg-[#f8fafc] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold px-2.5 py-1 bg-[#0f172a] text-white rounded">
              {lead.cid}
            </span>
            <span className="text-sm font-bold text-[#0f172a]">
              {lead.firstName} {lead.lastName}
            </span>
            <span className="text-xs text-[#64748b]">|</span>
            <span className="text-xs text-[#475569]">
              {lead.email}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[#64748b] hover:text-[#0f172a] p-1.5 rounded hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          
          {/* Top Summary Banner with Full Profile Button */}
          <div className="border border-[#cbd5e1] rounded p-4 bg-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#64748b] uppercase font-bold tracking-wider">CID Number</div>
              <div className="text-xl font-bold text-[#0f172a]">{lead.cid}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748b] uppercase font-bold tracking-wider">Full Name</div>
              <div className="text-lg font-bold text-[#0f172a]">{lead.firstName} {lead.lastName}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748b] uppercase font-bold tracking-wider">Email</div>
              <div className="text-sm font-medium text-[#0f172a]">{lead.email || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748b] uppercase font-bold tracking-wider">Current Status</div>
              <div className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded mt-0.5 inline-block">
                {lead.currentStatus || 'New'}
              </div>
            </div>

            {/* The Full Profile Button */}
            <div>
              <button
                type="button"
                onClick={() => setShowFullProfile((prev) => !prev)}
                className={`px-3.5 py-2 text-xs font-semibold rounded border transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                  showFullProfile
                    ? 'bg-[#0f172a] text-white border-[#0f172a]'
                    : 'bg-white hover:bg-slate-50 text-[#0f172a] border-[#cbd5e1]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{showFullProfile ? 'Hide Full Profile' : 'Full Profile'}</span>
                {showFullProfile ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Conditionally Visible Full Profile Details */}
          {showFullProfile && (
            <div className="border border-[#cbd5e1] rounded overflow-hidden animate-in fade-in duration-150">
              <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Full Profile Details
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFullProfile(false)}
                  className="text-xs text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                >
                  Hide
                </button>
              </div>

              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-white">
                <div>
                  <div className="text-xs text-[#64748b]">First Name</div>
                  <div className="font-semibold text-[#0f172a] mt-0.5">{lead.firstName || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">Last Name</div>
                  <div className="font-semibold text-[#0f172a] mt-0.5">{lead.lastName || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">Phone Number</div>
                  <div className="font-semibold text-[#0f172a] mt-0.5">{lead.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">Email</div>
                  <div className="font-semibold text-[#0f172a] mt-0.5 truncate">{lead.email || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">Country</div>
                  <div className="font-semibold text-[#0f172a] mt-0.5">{lead.country || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">Date of Birth</div>
                  <div className="font-semibold text-[#0f172a] mt-0.5">{lead.dateOfBirth || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">Permanent CID</div>
                  <div className="font-bold text-[#0f172a] mt-0.5">{lead.cid}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">Created Date</div>
                  <div className="font-semibold text-[#0f172a] mt-0.5">{formatDate(lead.createdAt)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Comments & Activity Section */}
          <div className="border border-[#cbd5e1] rounded overflow-hidden">
            <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Comments & Activity ({comments.length})
              </h3>
              
              {!isAddingComment && (
                <button
                  type="button"
                  onClick={() => setIsAddingComment(true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#0f172a] hover:bg-[#1e293b] text-white rounded cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Comment</span>
                </button>
              )}
            </div>

            {commentFeedback && (
              <div
                className={`m-4 p-3 text-xs rounded border flex items-center gap-2 ${
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

            {/* Add Comment Form Space */}
            {isAddingComment && (
              <div className="p-5 border-b border-[#cbd5e1] bg-white">
                <form onSubmit={handleAddComment} className="space-y-4">
                  <div className="w-full sm:w-64">
                    <label className="block text-xs font-bold text-[#475569] uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                      className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb] cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] uppercase mb-1">
                      Comment
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write comment or follow up notes..."
                      className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingComment(false);
                        setCommentText('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-[#475569] hover:bg-slate-100 rounded border border-[#cbd5e1] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingComment}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0f172a] hover:bg-[#1e293b] rounded cursor-pointer disabled:opacity-50"
                    >
                      {savingComment ? 'Saving...' : 'Add Comment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Permanent Comments History List */}
            <div className="p-4 bg-[#f8fafc] space-y-3">
              {loadingComments ? (
                <div className="py-6 text-center text-xs text-[#64748b]">
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#64748b] bg-white border border-[#cbd5e1] rounded p-6">
                  No comments yet. Click "Add Comment" above to record the first update.
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-[#cbd5e1] rounded p-4 text-sm shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800">
                        {c.status}
                      </span>
                      <div className="text-xs text-[#64748b]">
                        <span className="font-semibold text-[#0f172a]">{c.createdBy}</span>
                        <span className="mx-1.5">•</span>
                        <span>{formatCommentDate(c.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#1e293b] whitespace-pre-wrap">
                      {c.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Delete Section with Passcode Protection */}
          <div className="pt-2 border-t border-[#cbd5e1] flex items-center justify-between">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setDeletePasscode('');
                  setDeleteError('');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 cursor-pointer"
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
                    className="px-2 py-1 text-xs border border-rose-300 rounded bg-white text-[#0f172a] focus:outline-none focus:border-rose-600"
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
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#475569] hover:bg-slate-100 rounded border border-[#cbd5e1] cursor-pointer ml-auto"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
