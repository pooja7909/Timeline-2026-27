import React from 'react';
import { UserRole, LockState } from '../types';
import { 
  Laptop, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  GraduationCap, 
  Users, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface HeaderProps {
  userRole: UserRole;
  lockState: LockState;
  syncStatus: 'synced' | 'saving' | 'error';
  lastUpdated: string;
  currentTermName: string;
  currentWeekText: string;
  onJumpCurrentWeek: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  lockState,
  syncStatus,
  lastUpdated,
  currentTermName,
  currentWeekText,
  onJumpCurrentWeek
}) => {
  return (
    <header className="mb-8">
      {/* Top institution & sync status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200 text-sm">
        <div className="flex items-center gap-2.5 text-slate-600 font-mono-code text-xs uppercase tracking-wider font-semibold">
          <Laptop className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-slate-800">
            The British International School Budapest
          </span>
          <span className="text-slate-300">•</span>
          <span>Computing & ICT Department</span>
        </div>

        {/* Sync & Lock Pill */}
        <div className="flex items-center gap-3.5 font-mono-code text-xs">
          {/* Real-time Sync Status */}
          <div className="flex items-center gap-1.5 font-medium">
            {syncStatus === 'saving' ? (
              <span className="flex items-center gap-1.5 text-amber-700">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing changes...</span>
              </span>
            ) : syncStatus === 'error' ? (
              <span className="flex items-center gap-1.5 text-rose-700">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Sync offline (local only)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synced & Live</span>
              </span>
            )}
          </div>

          {/* Lock Status Pill */}
          <span
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold text-xs border ${
              lockState.isLocked
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {lockState.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {lockState.isLocked ? 'Locked' : 'Unlocked'}
          </span>

          {/* Role badge */}
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-1.5 font-medium text-xs">
            {userRole === 'teacher' ? (
              <>
                <Users className="w-3 h-3 text-indigo-600" />
                Teacher
              </>
            ) : (
              <>
                <GraduationCap className="w-3 h-3 text-emerald-600" />
                Student
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight uppercase leading-none">
            Curriculum Planner
            <span className="block text-slate-400 font-extrabold text-2xl sm:text-4xl lg:text-5xl mt-1.5">
              2026 / 2027
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
            Complete thirty-eight teaching week syllabus mapped to the 2026–27 school calendar across Years 7 to 13.
            Includes Key Stage 3, Pearson Edexcel International GCSE (4CP0), and IB Diploma Computer Science.
          </p>
        </div>

        {/* Current Academic Week Pill */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex-shrink-0">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="font-mono-code text-xs uppercase font-bold text-slate-400 block">
              Current Academic Status
            </span>
            <div className="font-display font-bold text-base sm:text-lg text-slate-900">
              {currentTermName} · {currentWeekText}
            </div>
            <button
              onClick={onJumpCurrentWeek}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold mt-0.5 block text-left underline"
            >
              Jump to this week ↓
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
