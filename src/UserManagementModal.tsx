import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Trash2,
  Lock,
  AlertCircle,
  CheckCircle2,
  Users,
  ShieldAlert,
} from 'lucide-react';
import {
  getAllSystemUsers,
  addSystemUser,
  removeSystemUser,
  SystemUser,
} from './userService';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OWNER_PASSCODE = '123123123123';

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Passcode verification gate
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Users data state
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Add User Form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Remove User Confirmation state
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [deletePasscode, setDeletePasscode] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingUser, setDeletingUser] = useState(false);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setIsUnlocked(false);
      setPasscodeInput('');
      setPasscodeError('');
      setNewEmail('');
      setNewPassword('');
      setActionError('');
      setActionSuccess('');
      setUserToDelete(null);
      setDeletePasscode('');
      setDeleteError('');
    }
  }, [isOpen]);

  // Load users when unlocked
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllSystemUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isUnlocked && isOpen) {
      fetchUsers();
    }
  }, [isUnlocked, isOpen]);

  if (!isOpen) return null;

  // Passcode Gate submit
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');

    if (passcodeInput.trim() !== OWNER_PASSCODE) {
      setPasscodeError('Invalid owner passcode.');
      return;
    }

    setIsUnlocked(true);
    setPasscodeInput('');
  };

  // Add user submit
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    const cleanEmail = newEmail.trim();
    const cleanPass = newPassword.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setActionError('Please enter a valid email address.');
      return;
    }
    if (!cleanPass) {
      setActionError('Password is required.');
      return;
    }

    setAddingUser(true);
    try {
      await addSystemUser(cleanEmail, cleanPass);
      setActionSuccess(`User ${cleanEmail} added successfully! They can now log in.`);
      setNewEmail('');
      setNewPassword('');
      await fetchUsers();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error adding user:', err);
      setActionError('Failed to add user. Please try again.');
    } finally {
      setAddingUser(false);
    }
  };

  // Delete user confirmation
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleteError('');

    if (deletePasscode.trim() !== OWNER_PASSCODE) {
      setDeleteError('Invalid owner passcode.');
      return;
    }

    setDeletingUser(true);
    try {
      await removeSystemUser(userToDelete);
      setUserToDelete(null);
      setDeletePasscode('');
      await fetchUsers();
      setActionSuccess(`User ${userToDelete.email} removed.`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error removing user:', err);
      setDeleteError('Failed to remove user.');
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="bg-white border border-[#cbd5e1] rounded w-full max-w-lg shadow-xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#cbd5e1] bg-[#f8fafc]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0f172a]" />
            <h2 className="text-base font-bold text-[#0f172a]">
              {isUnlocked ? 'CRM User Management' : 'Owner Authorization Required'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748b] hover:text-[#0f172a] p-1 rounded hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Passcode Gate */}
        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="p-6 space-y-4">
            <div className="p-3 bg-slate-50 border border-[#cbd5e1] rounded text-xs text-[#475569] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0f172a] shrink-0" />
              <span>Please enter owner passcode to manage CRM login accounts.</span>
            </div>

            {passcodeError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                Owner Passcode
              </label>
              <input
                type="password"
                required
                autoFocus
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter passcode"
                className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#475569] hover:bg-slate-100 rounded border border-[#cbd5e1] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#0f172a] hover:bg-[#1e293b] rounded cursor-pointer"
              >
                Authorize
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: Unlocked User Management Panel */
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Feedback Banners */}
            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Add User Section */}
            <div className="border border-[#cbd5e1] rounded p-4 bg-[#f8fafc]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] mb-3 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#0f172a]" />
                <span>Add Login Credentials</span>
              </h3>

              <form onSubmit={handleAddUser} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#475569] uppercase mb-1">
                      Email (Gmail) *
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. user@gmail.com"
                      className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#475569] uppercase mb-1">
                      Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="e.g. 123"
                      className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={addingUser}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#0f172a] hover:bg-[#1e293b] rounded cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {addingUser ? 'Adding...' : '+ Add User'}
                  </button>
                </div>
              </form>
            </div>

            {/* Active Users Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                  Authorized Users ({users.length})
                </h3>
                <span className="text-[11px] text-[#64748b]">Only these accounts can sign in</span>
              </div>

              {loadingUsers ? (
                <div className="py-6 text-center text-xs text-[#64748b]">Loading users...</div>
              ) : (
                <div className="border border-[#cbd5e1] rounded overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f8fafc] border-b border-[#cbd5e1] text-[#475569] font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Password</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-[#0f172a]">{u.name}</td>
                          <td className="py-2.5 px-3 text-[#334155]">{u.email}</td>
                          <td className="py-2.5 px-3 text-[#64748b]">{u.password}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setUserToDelete(u);
                                setDeletePasscode('');
                                setDeleteError('');
                              }}
                              className="text-rose-600 hover:text-rose-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                              title="Remove User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Passcode Confirmation Prompt for User Deletion */}
            {userToDelete && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded space-y-3">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Remove User: {userToDelete.email}</span>
                </div>
                <p className="text-xs text-rose-700">
                  Enter owner passcode to confirm removal:
                </p>

                {deleteError && (
                  <div className="text-xs text-red-600 font-bold">{deleteError}</div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={deletePasscode}
                    onChange={(e) => setDeletePasscode(e.target.value)}
                    placeholder="Enter passcode"
                    className="px-2.5 py-1.5 bg-white border border-rose-300 rounded text-xs text-[#0f172a] focus:outline-none focus:border-rose-600 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUserToDelete(null);
                      setDeletePasscode('');
                      setDeleteError('');
                    }}
                    className="px-3 py-1.5 text-xs border border-rose-300 rounded bg-white text-rose-700 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deletingUser}
                    onClick={handleConfirmDelete}
                    className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded cursor-pointer disabled:opacity-50"
                  >
                    {deletingUser ? 'Deleting...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}

            {/* Footer close button */}
            <div className="pt-2 border-t border-[#cbd5e1] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#475569] hover:bg-slate-100 rounded border border-[#cbd5e1] cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
