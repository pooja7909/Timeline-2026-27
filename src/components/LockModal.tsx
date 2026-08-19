import React, { useState } from 'react';
import { LockState } from '../types';
import { Lock, Unlock, ShieldAlert, KeyRound, Check, X } from 'lucide-react';

interface LockModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockState: LockState;
  onToggleLock: (isLocked: boolean, pin?: string, currentPin?: string) => Promise<{ success: boolean; error?: string }>;
}

export const LockModal: React.FC<LockModalProps> = ({
  isOpen,
  onClose,
  lockState,
  onToggleLock
}) => {
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (lockState.isLocked) {
        // Unlocking action
        const pinToUse = currentPin.trim();
        const res = await onToggleLock(false, undefined, pinToUse);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Incorrect password. Default is 2026.');
        }
      } else {
        // Locking action
        const pinToUse = pin.trim() || '2026';
        const res = await onToggleLock(true, pinToUse);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Failed to lock timeline. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${lockState.isLocked ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
              {lockState.isLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                {lockState.isLocked ? 'Unlock Curriculum Timeline' : 'Lock Timeline (Student Protected)'}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {lockState.isLocked
                  ? 'Enable editing mode across all terms and year groups'
                  : 'Protect timeline so students only see locked, read-only content'}
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
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {lockState.isLocked ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-slate-500" />
                Enter Teacher Password to Unlock
              </label>
              <input
                type="password"
                maxLength={20}
                placeholder="Enter password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-base font-mono-code focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Access restricted to Computing Department staff.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium">
                <p className="font-bold text-slate-900 mb-1">
                  When locked:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Curriculum cells are greyed out and strictly read-only.</li>
                  <li>Students & viewers cannot overwrite weekly topics or notes.</li>
                  <li>Teachers can unlock anytime with their department password.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-slate-500" />
                    Teacher Password
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-base font-mono-code focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                />
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Enter password to secure the curriculum plan.
                </p>
              </div>
            </div>
          )}

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
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                lockState.isLocked
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? (
                'Processing...'
              ) : lockState.isLocked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  Unlock Now
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Lock Timeline
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
