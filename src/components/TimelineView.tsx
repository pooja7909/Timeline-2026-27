import React, { useState } from 'react';
import { TermData, YearConfig, CellData, UserRole, LockState } from '../types';
import { 
  Calendar, 
  Star, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  BookOpen, 
  MessageSquare,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

interface TimelineViewProps {
  plan: TermData[];
  years: YearConfig[];
  selectedYears: string[];
  searchQuery: string;
  assessOnly: boolean;
  userRole: UserRole;
  lockState: LockState;
  currentWeekKey: string | null;
  onUpdateCell: (termId: string, weekN: number, yearId: string, updates: Partial<CellData>) => void;
  onOpenAIHelper: (yearGroup: string, topicText: string, termName: string, weekN: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  plan,
  years,
  selectedYears,
  searchQuery,
  assessOnly,
  userRole,
  lockState,
  currentWeekKey,
  onUpdateCell,
  onOpenAIHelper
}) => {
  const [activeYearId, setActiveYearId] = useState<string>(selectedYears[0] || 'y7');

  const currentYear = years.find(y => y.id === activeYearId) || years[0];
  const isEditable = userRole === 'teacher' && !lockState.isLocked;

  return (
    <div className="space-y-8">
      {/* Year group selector tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-6 h-6 text-indigo-600" />
          <span className="text-sm font-bold text-slate-900">
            Select Cohort:
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {years.map((y) => (
            <button
              key={y.id}
              onClick={() => setActiveYearId(y.id)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeYearId === y.id
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: y.color }}
              />
              <span>{y.label}</span>
              <span className="text-xs opacity-75 font-normal">({y.short})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Banner for Selected Cohort */}
      <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: currentYear.color }}
            />
            <h3 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
              {currentYear.label} Computing Syllabus Timeline
            </h3>
          </div>
          <p className="text-sm text-slate-600 font-mono-code font-medium">
            {currentYear.qualification} · 38 Teaching Weeks · 2026–2027 Academic Year
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 text-sm">
          <span className="text-slate-500 font-mono-code font-medium">Key Stage:</span>
          <span className="font-bold uppercase tracking-wider text-slate-900">
            {currentYear.stage.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Chronological Terms List */}
      <div className="space-y-10">
        {plan.map((term) => {
          const visibleRows = term.rows.filter((row) => {
            if (row.kind === 'break') return !assessOnly;
            const cell = row.cells[currentYear.id];
            if (assessOnly && !cell?.assess) return false;
            if (searchQuery) {
              const matches = (cell?.text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (row.note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (row.dates || '').toLowerCase().includes(searchQuery.toLowerCase());
              if (!matches) return false;
            }
            return true;
          });

          if (visibleRows.length === 0) return null;

          return (
            <div key={term.id} className="space-y-4">
              {/* Term Marker */}
              <div className="flex items-center gap-3">
                <div
                  className="px-4 py-1.5 rounded-xl text-sm font-bold text-white uppercase tracking-wider font-mono-code shadow-xs"
                  style={{ backgroundColor: term.themeColor }}
                >
                  {term.name}
                </div>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-sm font-mono-code text-slate-600 font-semibold">
                  {term.dates}
                </span>
              </div>

              {/* Weeks Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleRows.map((row, rIdx) => {
                  if (row.kind === 'break') {
                    return (
                      <div
                        key={`t-break-${term.id}-${rIdx}`}
                        className="md:col-span-2 p-4 rounded-xl bg-amber-50 border border-dashed border-amber-300 text-amber-950 text-sm flex items-center gap-3"
                      >
                        <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div>
                          <span className="font-bold">{row.label}</span>
                          {row.detail && (
                            <span className="text-amber-800 ml-2 font-medium">
                              — {row.detail}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const cell = row.cells[currentYear.id] || { text: '', assess: false, taught: false };
                  const rowKey = `${term.id}-${row.n}`;
                  const isNow = currentWeekKey === rowKey;
                  const isAssess = cell.assess;
                  const isTaught = cell.taught;

                  return (
                    <div
                      key={`card-${term.id}-${row.n}`}
                      className={`p-5 rounded-2xl border transition-all ${
                        isNow
                          ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-400 shadow-md'
                          : isAssess
                          ? 'bg-rose-50/50 border-rose-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-display font-bold text-xl text-slate-900">
                            Week {row.n}
                          </span>
                          <span className="text-sm font-mono-code text-slate-600 font-medium">
                            {row.dates}
                          </span>
                          {isNow && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono-code text-xs font-bold uppercase tracking-wider">
                              Current Week
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isAssess && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                              <Star className="w-3.5 h-3.5 fill-current text-rose-600" />
                              Assessment
                            </span>
                          )}
                          {isTaught && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Complete
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Topic Content */}
                      <div className="my-3">
                        {isEditable ? (
                          <textarea
                            rows={2}
                            value={cell.text}
                            placeholder="Add learning objective or task..."
                            onChange={(e) =>
                              onUpdateCell(term.id, row.n, currentYear.id, { text: e.target.value })
                            }
                            className="w-full text-sm sm:text-base p-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-400 focus:outline-hidden leading-relaxed font-medium"
                          />
                        ) : (
                          <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                            {cell.text || 'No tasks listed'}
                          </p>
                        )}
                      </div>

                      {/* Weekly Note if present */}
                      {row.note && (
                        <div className="mt-2.5 text-xs text-slate-700 bg-slate-100 p-2.5 rounded-xl flex items-start gap-2 border border-slate-200">
                          <MessageSquare className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">{row.note}</span>
                        </div>
                      )}

                      {/* Bottom action controls */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {isEditable && (
                            <button
                              onClick={() =>
                                onUpdateCell(term.id, row.n, currentYear.id, { assess: !isAssess })
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                isAssess
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                              {isAssess ? 'Assessment Set' : 'Set Assessment'}
                            </button>
                          )}

                          {userRole === 'teacher' && (
                            <button
                              onClick={() =>
                                onUpdateCell(term.id, row.n, currentYear.id, { taught: !isTaught })
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                isTaught
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isTaught ? 'Taught ✓' : 'Mark Taught'}
                            </button>
                          )}
                        </div>

                        {cell.text && (
                          <button
                            onClick={() =>
                              onOpenAIHelper(currentYear.label, cell.text, term.name, row.n)
                            }
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Lesson Ideas</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
