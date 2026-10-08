import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { createLeadInFirestore } from './leadService';
import { useAuth } from './AuthContext';
import { COUNTRIES, validatePhoneNumber } from './countryCodes';

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
  const [country, setCountry] = useState('United States');
  const [dialCode, setDialCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Handle country change: automatically sync dial code
  const handleCountryChange = (selectedCountryName: string) => {
    setCountry(selectedCountryName);
    const matched = COUNTRIES.find((c) => c.name === selectedCountryName);
    if (matched) {
      setDialCode(matched.dialCode);
    }
  };

  // Handle dial code change
  const handleDialCodeChange = (newDialCode: string) => {
    setDialCode(newDialCode);
    const matched = COUNTRIES.find((c) => c.dialCode === newDialCode);
    if (matched) {
      setCountry(matched.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // 1. Name validation
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('First Name and Last Name are required.');
      return;
    }

    // 2. Email validation
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // 3. Phone validation with country code
    const phoneValidation = validatePhoneNumber(dialCode, phoneNumber);
    if (!phoneValidation.valid) {
      setErrorMsg(phoneValidation.error || 'Please enter a valid phone number.');
      return;
    }

    // 4. Owner authorization passcode verification
    if (passcode.trim() !== REQUIRED_PASSCODE) {
      setErrorMsg('Invalid authorization passcode.');
      return;
    }

    setSubmitting(true);
    try {
      const createdLead = await createLeadInFirestore({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phoneValidation.cleanFullNumber,
        email: cleanEmail,
        country: country.trim(),
        userEmail: user?.email || 'james@gmail.com',
      });

      setSuccessMsg(`Lead created successfully with ID: ${createdLead.cid}`);
      
      setTimeout(() => {
        onLeadCreated(createdLead.cid);
        // Reset form
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setEmail('');
        setCountry('United States');
        setDialCode('+1');
        setPasscode('');
        setSuccessMsg('');
        onClose();
      }, 600);
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMsg('Unable to save lead. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 font-sans">
      <div className="bg-white border border-[#e2e8f0] rounded-lg w-full max-w-lg shadow-xl overflow-hidden">
        
        {/* Header (Blue & White Theme) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Add New Lead</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form: First Name, Last Name, Country, Phone with Country Code, Email, and Owner Authorization Passcode */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. John"
                className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Smith"
                className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Country Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Country *
            </label>
            <select
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {COUNTRIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.dialCode})
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number with all country code dropdown and validation */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Phone Number with Country Code *
            </label>
            <div className="flex gap-2">
              {/* Dial Code Selector */}
              <select
                value={dialCode}
                onChange={(e) => handleDialCodeChange(e.target.value)}
                className="w-36 px-2.5 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shrink-0"
              >
                {COUNTRIES.map((c) => (
                  <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                    {c.dialCode} ({c.name})
                  </option>
                ))}
              </select>

              {/* Number digits input */}
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone digits (e.g. 5550199)"
                className="flex-1 px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Selected: <strong className="text-blue-600 font-semibold">{dialCode}</strong> ({country}). Only verified numeric digits accepted.
            </p>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john.smith@company.com"
              className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Authorization Passcode */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Authorization Passcode *</span>
            </label>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded border border-[#cbd5e1] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded cursor-pointer disabled:opacity-50 flex items-center gap-2 transition-colors shadow-2xs"
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
