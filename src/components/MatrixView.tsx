import React, { useState } from 'react';
import { TermData, YearConfig, CellData, UserRole, LockState } from '../types';
import { getReportCyclesForWeek, isReportWeek } from '../data/reportCycles';
import { 
  Star, 
  Check, 
  Sparkles, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Calendar,
  AlertCircle,
  Copy,
  ExternalLink,
  FileCheck2,
  Clock
} from 'lucide-react';

interface MatrixViewProps {
  plan: TermData[];
  years: YearConfig[];
  selectedYears: string[];
  searchQuery: string;
  assessOnly: boolean;
  reportOnly?: boolean;
  userRole: UserRole;
  lockState: LockState;
  currentWeekKey: string | null;
  onUpdateCell: (termId: string, weekN: number, yearId: string, updates: Partial<CellData>) => void;
  onUpdateNote: (termId: string, weekN: number, note: string) => void;
  onOpenAIHelper: (yearGroup: string, topicText: string, termName: string, weekN: number) => void;
  onClearFilters?: () => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  plan,
  years,
  selectedYears,
  searchQuery,
  assessOnly,
  reportOnly = false,
  userRole,
  lockState,
  currentWeekKey,
  onUpdateCell,
  onUpdateNote,
  onOpenAIHelper,
  onClearFilters
}) => {
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [copiedCellKey, setCopiedCellKey] = useState<string | null>(null);

  const activeYears = years.filter(y => selectedYears.includes(y.id));

  const toggleNote = (key: string) => {
    setExpandedNotes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isEditable = userRole === 'teacher' && !lockState.isLocked;

  const matchesSearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const handleCopyTask = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCellKey(key);
    setTimeout(() => setCopiedCellKey(null), 1500);
  };

  const isFilterActive = assessOnly || reportOnly || Boolean(searchQuery);

  const scrollToTerm = (termId: string) => {
    const el = document.getElementById(`term-section-${termId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-12">
      {/* Quick Term Navigator & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code uppercase text-slate-500 font-bold hidden sm:inline">
            Jump to Term:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {plan.map((t) => (
              <button
                key={t.id}
                onClick={() => scrollToTerm(t.id)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.themeColor }} />
                <span>{t.name.split('·')[0].trim()}</span>
                <span className="text-slate-500 font-mono-code font-normal">({t.weeks} wks)</span>
              </button>
            ))}
          </div>
        </div>

        {isFilterActive && onClearFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {reportOnly
                  ? 'Showing Report Weeks only (starts at Week 7 · Oct 5–9)'
                  : assessOnly
                  ? 'Showing Assessment Weeks only'
                  : 'Search Filter Active'}
              </span>
            </span>
            <button
              onClick={onClearFilters}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
            >
              Show All 38 Weeks (from Week 1 · 25 Aug)
            </button>
          </div>
        )}
      </div>

      {/* Student View Notification Banner */}
      {userRole === 'student' && (
        <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl flex items-center justify-between gap-4 text-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Student & Parent View · Locked Mode
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Curriculum is greyed out and read-only. Teachers can click &quot;Teacher&quot; above and enter their department password to make changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {plan.map((term) => {
        // Calculate term completion stats
        const weekRows = term.rows.filter(r => r.kind === 'week');
        const totalWeeks = weekRows.length;
        const taughtWeeks = weekRows.filter(r => {
          if (activeYears.length === 0) return false;
          return activeYears.every(y => r.cells[y.id]?.taught);
        }).length;

        // Filter rows if assessOnly, reportOnly, or searchQuery is active
        const visibleRows = term.rows.filter(row => {
          if (row.kind === 'break') {
            return !assessOnly && !reportOnly;
          }

          if (reportOnly && !isReportWeek(term.id, row.n)) {
            return false;
          }

          const hasAssessment = activeYears.some(y => row.cells[y.id]?.assess);
          if (assessOnly && !hasAssessment) return false;

          if (searchQuery) {
            const rowMatches = activeYears.some(y => matchesSearch(row.cells[y.id]?.text || '')) ||
                               matchesSearch(row.note || '') ||
                               matchesSearch(row.dates || '');
            if (!rowMatches) return false;
          }

          return true;
        });

        if (visibleRows.length === 0) return null;

        return (
          <section
            key={term.id}
            id={`term-section-${term.id}`}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
          >
            {/* Term Header */}
            <div
              className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white"
              style={{
                borderLeftColor: term.themeColor,
                borderLeftWidth: '5px'
              }}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: term.themeColor }}
                />
                <div>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    {term.name}
                  </h2>
                  <p className="text-sm text-slate-600 font-mono-code mt-0.5 font-medium">
                    {term.dates} · {term.weeks} Teaching Weeks
                  </p>
                </div>
              </div>

              {/* Progress counter */}
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-sm font-mono-code">
                <span className="text-slate-500 font-medium">Taught:</span>
                <span className="font-bold text-slate-900">
                  {taughtWeeks} / {totalWeeks} wks
                </span>
                <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${totalWeeks ? (taughtWeeks / totalWeeks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[980px]">
                {/* Column Headers */}
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono-code uppercase tracking-wider text-slate-600 font-bold">
                    <th className="py-4 px-4 w-36 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                      Week
                    </th>
                    {activeYears.map((year) => (
                      <th
                        key={year.id}
                        className="py-4 px-4 border-r border-slate-200 last:border-r-0 min-w-[190px]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: year.color }}
                          />
                          <span className="font-bold text-slate-900 text-sm">
                            {year.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium lowercase tracking-normal truncate mt-0.5">
                          {year.qualification}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body Rows */}
                <tbody className="divide-y divide-slate-200 text-sm">
                  {visibleRows.map((row, rowIdx) => {
                    if (row.kind === 'break') {
                      return (
                        <tr
                          key={`break-${term.id}-${rowIdx}`}
                          className="bg-slate-50/90 border-y border-slate-200"
                        >
                          <td
                            colSpan={activeYears.length + 1}
                            className="py-3 px-5 font-mono-code text-sm text-slate-700"
                          >
                            <div className="flex items-center gap-2.5 font-semibold">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span>{row.label}</span>
                              {row.detail && (
                                <span className="font-normal text-slate-500 text-xs">
                                  — {row.detail}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const rowKey = `${term.id}-${row.n}`;
                    const isNow = currentWeekKey === rowKey;
                    const hasNote = Boolean(row.note && row.note.trim());
                    const isNoteOpen = expandedNotes[rowKey] || false;
                    const reportCycles = getReportCyclesForWeek(term.id, row.n);

                    return (
                      <React.Fragment key={`week-row-${term.id}-${row.n}`}>
                        <tr
                          id={`wk-${term.id}-${row.n}`}
                          className={`group transition-colors ${
                            isNow
                              ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-300'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Week Number & Date Column */}
                          <td
                            className="py-3.5 px-4 align-top sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-10"
                            style={{
                              borderLeft: `4px solid ${term.themeColor}`
                            }}
                          >
                            <div className="flex items-baseline justify-between">
                              <span className="font-display font-bold text-base sm:text-lg text-slate-900">
                                W{row.n}
                              </span>
                              {isNow && (
                                <span className="text-xs font-mono-code bg-indigo-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                  Now
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono-code text-slate-500 mt-1 font-medium">
                              {row.dates}
                            </div>
                            {row.flag && (
                              <span className="inline-block mt-1.5 text-xs font-mono-code px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                {row.flag}
                              </span>
                            )}

                            {/* Report Cycle Badge */}
                            {reportCycles.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {reportCycles.map(rc => (
                                  <div
                                    key={rc.id}
                                    title={`${rc.name}\nGrade Entry Closes: ${rc.gradeEntryDeadline}\nPublication: ${rc.publicationDate}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-mono-code px-2 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold"
                                  >
                                    <FileCheck2 className="w-3 h-3 flex-shrink-0 text-indigo-600" />
                                    <span className="truncate max-w-[100px]">{rc.shortCode}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Note expand toggle */}
                            <button
                              onClick={() => toggleNote(rowKey)}
                              className={`mt-2.5 flex items-center gap-1.5 text-xs font-mono-code py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                                hasNote
                                  ? 'text-slate-800 font-bold bg-slate-100 border border-slate-200'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{hasNote ? 'Note' : '+ Note'}</span>
                              {isNoteOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>

                          {/* Year Task Cells */}
                          {activeYears.map((year) => {
                            const cell = row.cells[year.id] || { text: '', assess: false, taught: false };
                            const cellKey = `${term.id}-${row.n}-${year.id}`;
                            const isAssess = cell.assess;
                            const isTaught = cell.taught;
                            const isMatch = searchQuery && matchesSearch(cell.text);

                            return (
                              <td
                                key={year.id}
                                className={`py-3 px-3.5 align-top border-r border-slate-200 last:border-r-0 relative transition-colors ${
                                  isAssess
                                    ? 'bg-rose-50/40'
                                    : ''
                                } ${
                                  isMatch
                                    ? 'ring-2 ring-amber-400 bg-amber-50/40'
                                    : ''
                                }`}
                              >
                                {isAssess && (
                                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500" />
                                )}

                                <div className="flex flex-col justify-between min-h-[75px] group/cell">
                                  {/* Cell Content / Editable textarea */}
                                  {isEditable ? (
                                    <textarea
                                      rows={2}
                                      value={cell.text}
                                      placeholder="Add syllabus topic or task..."
                                      onChange={(e) =>
                                        onUpdateCell(term.id, row.n, year.id, { text: e.target.value })
                                      }
                                      className={`w-full text-sm sm:text-base bg-transparent resize-y rounded-lg p-1.5 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-hidden leading-relaxed ${
                                        isTaught
                                          ? 'text-slate-400 line-through'
                                          : 'text-slate-900 font-medium'
                                      }`}
                                    />
                                  ) : (
                                    <div
                                      className={`text-sm sm:text-base leading-relaxed select-text p-1.5 ${
                                        !cell.text ? 'text-slate-400 italic' : ''
                                      } ${
                                        isTaught
                                          ? 'text-slate-400 line-through'
                                          : 'text-slate-800 font-medium'
                                      }`}
                                    >
                                      {cell.text || 'No tasks scheduled'}
                                    </div>
                                  )}

                                  {/* Action toolbar inside cell */}
                                  <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                      {/* Assessment button */}
                                      {isEditable ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onUpdateCell(term.id, row.n, year.id, { assess: !isAssess })
                                          }
                                          title={isAssess ? 'Marked as Assessment (click to remove)' : 'Mark as Assessment Week'}
                                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                                            isAssess
                                              ? 'text-rose-600 bg-rose-100 font-bold'
                                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                          }`}
                                        >
                                          <Star className={`w-3.5 h-3.5 ${isAssess ? 'fill-current' : ''}`} />
                                        </button>
                                      ) : isAssess ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono-code rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                          <Star className="w-3 h-3 fill-current" />
                                          Assess
                                        </span>
                                      ) : null}

                                      {/* Taught / Complete button */}
                                      {userRole === 'teacher' && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onUpdateCell(term.id, row.n, year.id, { taught: !isTaught })
                                          }
                                          title={isTaught ? 'Mark as Not Taught' : 'Mark as Taught / Complete'}
                                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                                            isTaught
                                              ? 'text-emerald-800 bg-emerald-100 font-bold'
                                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                          }`}
                                        >
                                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </button>
                                      )}

                                      {/* AI Lesson Starter & Differentiation Trigger */}
                                      {cell.text && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onOpenAIHelper(year.label, cell.text, term.name, row.n)
                                          }
                                          title="Generate Lesson Plan & Differentiation with Gemini AI"
                                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover/cell:opacity-100 cursor-pointer"
                                        >
                                          <Sparkles className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Quick Copy task */}
                                    {cell.text && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyTask(cell.text, cellKey)}
                                        title="Copy topic to clipboard"
                                        className="text-xs text-slate-400 hover:text-slate-700 opacity-0 group-hover/cell:opacity-100 p-1 rounded hover:bg-slate-100 cursor-pointer"
                                      >
                                        {copiedCellKey === cellKey ? '✓' : <Copy className="w-3 h-3" />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Expandable Weekly Departmental Note Row */}
                        {isNoteOpen && (
                          <tr className="bg-slate-50/80 border-b border-slate-200">
                            <td
                              colSpan={activeYears.length + 1}
                              className="py-3 px-5 text-sm"
                            >
                              <div className="flex items-start gap-3">
                                <MessageSquare className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                  <span className="font-mono-code text-xs uppercase font-bold text-slate-600 block mb-1.5">
                                    Weekly Department Notes (Week {row.n}):
                                  </span>
                                  {isEditable ? (
                                    <textarea
                                      rows={2}
                                      value={row.note || ''}
                                      placeholder="Add notices for teachers, homework deadlines, diagnostic quizzes or web links..."
                                      onChange={(e) => onUpdateNote(term.id, row.n, e.target.value)}
                                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-hidden font-medium"
                                    />
                                  ) : (
                                    <p className="text-slate-800 whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200 text-sm font-medium">
                                      {row.note || 'No notes added for this week.'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
};

