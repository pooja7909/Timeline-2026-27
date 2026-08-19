import React from 'react';
import { ViewMode, UserRole, LockState } from '../types';
import { YEARS } from '../data/defaultPlan';
import { 
  Table, 
  Clock, 
  Calendar as CalendarIcon, 
  Compass, 
  Search, 
  Lock, 
  Unlock, 
  Share2, 
  Download, 
  GraduationCap, 
  Users, 
  Sparkles,
  BarChart3,
  RotateCcw,
  Star,
  CheckCheck,
  FileCheck2
} from 'lucide-react';

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedYears: string[];
  onToggleYear: (yearId: string) => void;
  onSelectStage: (stage: 'all' | 'ks3' | 'ks4' | 'ks5') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  assessOnly: boolean;
  onToggleAssessOnly: () => void;
  reportOnly: boolean;
  onToggleReportOnly: () => void;
  userRole: UserRole;
  onToggleRole: () => void;
  lockState: LockState;
  onOpenLockModal: () => void;
  onOpenShareModal: () => void;
  onOpenStatsModal: () => void;
  onExport: (format: 'md' | 'csv' | 'print') => void;
  onReset: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  onViewModeChange,
  selectedYears,
  onToggleYear,
  onSelectStage,
  searchQuery,
  onSearchChange,
  assessOnly,
  onToggleAssessOnly,
  reportOnly,
  onToggleReportOnly,
  userRole,
  onToggleRole,
  lockState,
  onOpenLockModal,
  onOpenShareModal,
  onOpenStatsModal,
  onExport,
  onReset
}) => {
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xs py-3 px-4 sm:px-5 rounded-2xl mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Modes & Stage Presets */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Modes */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-sm font-semibold">
            <button
              onClick={() => onViewModeChange('matrix')}
              title="Matrix Grid View (All Years Table)"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-4 h-4 text-indigo-600" />
              <span>Grid Matrix</span>
            </button>

            <button
              onClick={() => onViewModeChange('timeline')}
              title="Detailed Timeline Cards"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => onViewModeChange('reports')}
              title="Secondary Report Cycles & Assessment Windows"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                viewMode === 'reports'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>Report Cycles</span>
            </button>

            <button
              onClick={() => onViewModeChange('calendar')}
              title="School Calendar & Terms 2026-27"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => onViewModeChange('roadmap')}
              title="Curriculum Syllabus Roadmaps"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                viewMode === 'roadmap'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Roadmap</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Key Stage Filter Tabs */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-mono-code text-xs uppercase text-slate-500 font-bold mr-1 hidden md:inline">
              Stage:
            </span>
            <button
              onClick={() => onSelectStage('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                selectedYears.length === YEARS.length
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All (7–13)
            </button>
            <button
              onClick={() => onSelectStage('ks3')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            >
              KS3 (Y7–9)
            </button>
            <button
              onClick={() => onSelectStage('ks4')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            >
              KS4 (IGCSE)
            </button>
            <button
              onClick={() => onSelectStage('ks5')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            >
              KS5 (IB DP)
            </button>
          </div>
        </div>

        {/* Right Controls: Search, Lock, Role Switcher, Share, Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics or skills..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-400 w-40 sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Assessment Filter Toggle */}
          <button
            onClick={onToggleAssessOnly}
            title={assessOnly ? 'Show all weeks' : 'Filter only weeks with assessments'}
            className={`px-3 py-2 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-all ${
              assessOnly
                ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-4 h-4 ${assessOnly ? 'fill-current text-rose-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Assessments</span>
          </button>

          {/* Report Weeks Filter Toggle */}
          <button
            onClick={onToggleReportOnly}
            title={reportOnly ? 'Show all weeks' : 'Filter only weeks with report deadlines or publication'}
            className={`px-3 py-2 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-all ${
              reportOnly
                ? 'bg-indigo-50 text-indigo-800 border-indigo-300 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <FileCheck2 className={`w-4 h-4 ${reportOnly ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Report Weeks</span>
          </button>

          {/* Lock / Unlock Toggle Button */}
          <button
            onClick={onOpenLockModal}
            className={`px-3 py-2 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-all ${
              lockState.isLocked
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {lockState.isLocked ? (
              <>
                <Lock className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Locked</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Editable</span>
              </>
            )}
          </button>

          {/* Role Switcher (Teacher vs Student View) */}
          <button
            onClick={onToggleRole}
            title={`Current: ${userRole === 'teacher' ? 'Teacher Mode (Editing & Notes)' : 'Student Mode (Clean Read-Only View)'}`}
            className={`px-3 py-2 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-all ${
              userRole === 'teacher'
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            {userRole === 'teacher' ? (
              <>
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="hidden md:inline">Teacher</span>
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span className="hidden md:inline">Student</span>
              </>
            )}
          </button>

          {/* Progress Stats */}
          <button
            onClick={onOpenStatsModal}
            title="Curriculum statistics and progress %"
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span className="hidden lg:inline">Stats</span>
          </button>

          {/* Share Button */}
          <button
            onClick={onOpenShareModal}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold flex items-center gap-1.5">
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-xl shadow-xl p-2 w-48 z-40 text-sm font-medium animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => onExport('md')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-800 flex items-center gap-2"
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => onExport('csv')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-800 flex items-center gap-2"
              >
                Excel / CSV (.csv)
              </button>
              <button
                onClick={() => onExport('print')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-800 flex items-center gap-2"
              >
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Year Group Toggle Pills */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200">
        <span className="text-xs font-mono-code uppercase text-slate-500 font-bold mr-1">
          Years:
        </span>
        {YEARS.map((year) => {
          const isSelected = selectedYears.includes(year.id);
          return (
            <button
              key={year.id}
              onClick={() => onToggleYear(year.id)}
              className={`px-3 py-1 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                isSelected
                  ? `${year.badgeBg} ${year.badgeBorder} border shadow-xs`
                  : 'bg-slate-100 text-slate-400 border border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: year.color }}
              />
              <span>{year.label}</span>
              <span className="text-xs opacity-75 font-medium">
                {year.stage.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

