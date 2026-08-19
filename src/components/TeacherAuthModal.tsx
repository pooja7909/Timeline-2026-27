import React, { useState } from 'react';
import { KeyRound, ShieldCheck, X, AlertCircle } from 'lucide-react';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const inputPwd = password.trim();

    if (!inputPwd) {
      setError('Please enter a password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/teacher/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPwd })
      });

      if (res.ok) {
        onSuccess();
        setPassword('');
        onClose();
      } else {
        // Fallback for custom or default local passwords
        const savedLock = localStorage.getItem('curriculum_lock_state');
        let customPin = '2026';
        if (savedLock) {
          try {
            const parsed = JSON.parse(savedLock);
            if (parsed.pin) customPin = String(parsed.pin).trim();
          } catch {}
        }

        if (inputPwd === '2026' || inputPwd === customPin) {
          onSuccess();
          setPassword('');
          onClose();
        } else {
          setError('Incorrect password. Default is 2026.');
        }
      }
    } catch {
      // Offline / client-only mode fallback
      const savedLock = localStorage.getItem('curriculum_lock_state');
      let customPin = '2026';
      if (savedLock) {
        try {
          const parsed = JSON.parse(savedLock);
          if (parsed.pin) customPin = String(parsed.pin).trim();
        } catch {}
      }

      if (inputPwd === '2026' || inputPwd === customPin) {
        onSuccess();
        setPassword('');
        onClose();
      } else {
        setError('Incorrect password. Default is 2026.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                Teacher Access Code
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Enter the internal department password to unlock editing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Teacher Password
            </label>
            <input
              type="password"
              autoFocus
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-base font-mono-code focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
            />
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Access restricted to Computing Department staff.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Verifying...' : 'Unlock Teacher Mode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
