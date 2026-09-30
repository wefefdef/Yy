import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { createLeadInFirestore } from './leadService';
import { useAuth } from './AuthContext';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (cid: string) => void;
}

const REQUIRED_PASSCODE = '123123123123';

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
}) => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('United States');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [passcode, setPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('First Name and Last Name are required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid email address is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone Number is required.');
      return;
    }

    // Secret Passcode Verification
    if (passcode.trim() !== REQUIRED_PASSCODE) {
      setErrorMsg('Invalid authorization passcode.');
      return;
    }

    setSubmitting(true);
    try {
      const createdLead = await createLeadInFirestore({
        firstName,
        lastName,
        phone,
        email,
        country: country || 'United States',
        dateOfBirth: dateOfBirth || '1990-01-01',
        userEmail: user?.email || 'james@gmail.com',
      });

      // Firebase confirmed the write
      setSuccessMsg(`Lead created successfully with ID: ${createdLead.cid}`);
      
      setTimeout(() => {
        onLeadCreated(createdLead.cid);
        // Reset form
        setFirstName('');
        setLastName('');
        setPhone('');
        setEmail('');
        setCountry('United States');
        setDateOfBirth('');
        setPasscode('');
        setSuccessMsg('');
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMsg('Unable to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="bg-white border border-[#cbd5e1] rounded w-full max-w-lg shadow-xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#cbd5e1] bg-[#f8fafc]">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#0f172a]" />
            <h2 className="text-base font-bold text-[#0f172a]">Add New Lead</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748b] hover:text-[#0f172a] p-1 rounded hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. John"
                className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Smith"
                className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.smith@gmail.com"
                className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United States"
                className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          </div>

          {/* Authorization Passcode field */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#64748b]" />
              <span>Passcode Authorization *</span>
            </label>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-[#cbd5e1] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#475569] hover:bg-slate-100 rounded border border-[#cbd5e1] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#0f172a] hover:bg-[#1e293b] rounded cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Create Lead</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
