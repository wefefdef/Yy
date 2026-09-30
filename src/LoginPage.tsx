import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setLocalError('');
    clearAuthError();

    if (!targetEmail.trim() || !targetPass.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(targetEmail.trim(), targetPass.trim());
    } catch (err: any) {
      console.error('Login error:', err);
      setLocalError(err.message || 'Access denied. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-white border border-[#cbd5e1] shadow-sm rounded p-8">
        
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-[#0f172a] text-white font-bold text-xl mb-3 shadow-xs">
            I
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">immediatecrm.com</h1>
          <p className="text-xs text-[#64748b] mt-1 font-medium">Full-Stack Real-Time CRM • Powered by Firebase Firestore</p>
        </div>

        {/* Error Alert */}
        {(localError || authError) && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {localError || authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#94a3b8]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#94a3b8]">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#0f172a] hover:bg-[#1e293b] active:bg-[#020617] text-white font-semibold text-sm rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to immediatecrm.com</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#94a3b8]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Connected to live Google Firebase Firestore</span>
        </div>
      </div>
    </div>
  );
};
