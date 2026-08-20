import React, { useState } from 'react';
import { TermData, YearConfig } from '../types';
import { 
  GraduationCap, 
  Star, 
  Calendar, 
  Search, 
  Clock, 
  Sparkles, 
  Layers, 
  ChevronRight, 
  BookOpen,
  Filter,
  Flame,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

interface StudentViewProps {
  plan: TermData[];
  years: YearConfig[];
  selectedYearId: string;
  onSelectYear: (yearId: string) => void;
  currentWeekKey: string | null;
  currentTermName: string;
  currentWeekText: string;
  onSwitchToTeacher: () => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  plan,
  years,
  selectedYearId,
  onSelectYear,
  currentWeekKey,
  currentTermName,
  currentWeekText,
  onSwitchToTeacher
}) => {
  const [search, setSearch] = useState('');
  const [filterAssessmentsOnly, setFilterAssessmentsOnly] = useState(false);
  const [activeTermTab, setActiveTermTab] = useState<string>('all');

  const selectedYear = years.find(y => y.id === selectedYearId) || years[0];

  // Collect all assessments for quick summary card
  const allAssessments: {
    termName: string;
    weekN: number;
    dates: string;
    topic: string;
    flag?: string;
    isCurrentWeek: boolean;
  }[] = [];

  plan.forEach(term => {
    term.rows.forEach(row => {
      if (row.kind === 'week') {
        const cell = row.cells[selectedYear.id];
        if (cell && (cell.assess || cell.text.toLowerCase().includes('assessment') || cell.text.toLowerCase().includes('exam') || cell.text.toLowerCase().includes('test') || cell.text.toLowerCase().includes('mock') || cell.text.toLowerCase().includes('criterion'))) {
          allAssessments.push({
            termName: term.name.split('·')[0].trim(),
            weekN: row.n,
            dates: row.dates,
            topic: cell.text,
            flag: row.flag,
            isCurrentWeek: `${term.id}-${row.n}` === currentWeekKey
          });
        }
      }
    });
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono-code font-bold uppercase tracking-wider mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              Student & Parent Timeline
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-white">
              Computing Syllabus & Assessment Calendar
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl font-sans leading-relaxed">
              Overview of all 38 teaching weeks, unit timelines, and assessment milestones for the 2026–2027 academic year.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-left md:text-right">
              <span className="text-[11px] font-mono-code text-indigo-200 block uppercase font-bold">
                Current School Week
              </span>
              <div className="text-base font-bold text-white font-display">
                {currentTermName} · {currentWeekText}
              </div>
            </div>
            <button
              onClick={onSwitchToTeacher}
              className="text-xs font-semibold text-indigo-300 hover:text-white underline transition-colors cursor-pointer"
            >
              Teacher Login (Edit Mode) →
            </button>
          </div>
        </div>

        {/* Year Group Selection Pills */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <label className="block text-xs font-mono-code font-bold uppercase tracking-wider text-indigo-200 mb-3">
            Choose Your Year Level:
          </label>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => {
              const isSelected = y.id === selectedYear.id;
              return (
                <button
                  key={y.id}
                  onClick={() => onSelectYear(y.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-lg scale-105 ring-2 ring-indigo-400'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  <span>{y.label}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono-code ${
                    isSelected ? 'bg-slate-200 text-slate-800' : 'bg-white/20 text-slate-200'
                  }`}>
                    {y.short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Course Stage Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold font-mono-code text-sm">
            {selectedYear.short}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 font-display">
                {selectedYear.label} Computing Course
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${selectedYear.badgeBg} ${selectedYear.badgeBorder}`}>
                {selectedYear.stage.toUpperCase()}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              {selectedYear.qualification}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-semibold border border-slate-200">
            ★ {allAssessments.length} Assessments Mapped
          </span>
          <span className="text-xs font-mono-code text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-semibold border border-slate-200">
            📅 38 Teaching Weeks
          </span>
        </div>
      </div>

      {/* Key Assessment Highlights Ribbon */}
      {allAssessments.length > 0 && (
        <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
              <span>Assessment & Exam Deadlines ({selectedYear.label})</span>
            </div>
            <button
              onClick={() => setFilterAssessmentsOnly(prev => !prev)}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                filterAssessmentsOnly
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              {filterAssessmentsOnly ? 'Show Full Timeline' : 'Filter Timeline to Assessments'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allAssessments.map((a, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-xl border bg-white shadow-xs transition-all ${
                  a.isCurrentWeek ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/40' : 'border-amber-200/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1 font-mono-code text-amber-800 font-bold">
                  <span>{a.termName} · Wk {a.weekN}</span>
                  <span className="text-slate-500 font-medium">{a.dates}</span>
                </div>
                <div className="text-xs font-bold text-slate-900 line-clamp-3 whitespace-pre-wrap">
                  {a.topic}
                </div>
                {a.flag && (
                  <span className="inline-block text-[10px] font-mono-code text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md mt-1 border border-rose-200">
                    {a.flag}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTermTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTermTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Terms (38 Wks)
          </button>
          {plan.map(term => (
            <button
              key={term.id}
              onClick={() => setActiveTermTab(term.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTermTab === term.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {term.name.split('·')[0].trim()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 w-44 sm:w-56"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterAssessmentsOnly(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterAssessmentsOnly
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterAssessmentsOnly ? 'fill-rose-500 text-rose-600' : 'text-slate-400'}`} />
            <span>Assessments Only</span>
          </button>
        </div>
      </div>

      {/* Main Student Curriculum Timeline List */}
      <div className="space-y-8">
        {plan
          .filter(term => activeTermTab === 'all' || term.id === activeTermTab)
          .map(term => {
            const rows = term.rows.filter(row => {
              if (row.kind === 'break') return !filterAssessmentsOnly && !search;
              const cell = row.cells[selectedYear.id] || { text: '', assess: false };
              if (filterAssessmentsOnly && !cell.assess && !cell.text.toLowerCase().includes('assessment') && !cell.text.toLowerCase().includes('exam') && !cell.text.toLowerCase().includes('test') && !cell.text.toLowerCase().includes('mock') && !cell.text.toLowerCase().includes('criterion')) {
                return false;
              }
              if (search) {
                const q = search.toLowerCase();
                return (
                  cell.text.toLowerCase().includes(q) ||
                  (row.flag && row.flag.toLowerCase().includes(q)) ||
                  row.dates.toLowerCase().includes(q)
                );
              }
              return true;
            });

            if (rows.length === 0) return null;

            return (
              <div key={term.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Term Header */}
                <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">
                      {term.name}
                    </h3>
                    <p className="text-xs text-slate-300 font-mono-code mt-0.5">
                      {term.dates} · {term.weeks} Academic Weeks
                    </p>
                  </div>
                  <span className="text-xs font-mono-code font-bold bg-white/15 px-3 py-1 rounded-full border border-white/20">
                    {selectedYear.label} Focus
                  </span>
                </div>

                {/* Rows List */}
                <div className="divide-y divide-slate-100">
                  {rows.map((row, rIdx) => {
                    if (row.kind === 'break') {
                      return (
                        <div 
                          key={rIdx}
                          className="px-6 py-4 bg-amber-50/50 border-y border-amber-200/60 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-mono-code font-bold border border-amber-200">
                              School Holiday
                            </span>
                            <span className="text-sm font-bold text-amber-950">
                              {row.label}
                            </span>
                          </div>
                          {row.detail && (
                            <span className="text-xs text-amber-800 font-mono-code">
                              {row.detail}
                            </span>
                          )}
                        </div>
                      );
                    }

                    const isCurrentWeek = `${term.id}-${row.n}` === currentWeekKey;
                    const cell = row.cells[selectedYear.id] || { text: '', assess: false, taught: false };
                    const hasAssess = cell.assess || cell.text.toLowerCase().includes('assessment') || cell.text.toLowerCase().includes('exam') || cell.text.toLowerCase().includes('test') || cell.text.toLowerCase().includes('mock') || cell.text.toLowerCase().includes('criterion');

                    return (
                      <div 
                        key={rIdx}
                        className={`p-5 sm:p-6 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                          isCurrentWeek 
                            ? 'bg-indigo-50/50 border-l-4 border-indigo-600' 
                            : hasAssess 
                            ? 'bg-rose-50/30' 
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Week Badge & Dates */}
                        <div className="sm:w-48 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-mono-code font-bold ${
                              isCurrentWeek 
                                ? 'bg-indigo-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}>
                              Week {row.n}
                            </span>
                            {isCurrentWeek && (
                              <span className="text-[11px] font-bold font-mono-code text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono-code mt-1 font-medium">
                            {row.dates}
                          </div>
                          {row.flag && (
                            <div className="mt-1.5">
                              <span className="inline-block text-[11px] font-bold font-mono-code text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                                {row.flag}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Learning Topic & Assessment Content */}
                        <div className="flex-1">
                          <div className="flex items-start gap-2.5">
                            {hasAssess && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold font-mono-code flex-shrink-0 mt-0.5">
                                <Star className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                                Assessment
                              </span>
                            )}
                            <div className={`text-base font-semibold whitespace-pre-wrap leading-relaxed ${
                              hasAssess ? 'text-rose-950 font-bold' : 'text-slate-900'
                            }`}>
                              {cell.text || <span className="text-slate-400 italic font-normal">Curriculum topic to be announced</span>}
                            </div>
                          </div>
                        </div>

                        {/* Status Checkmark */}
                        <div className="sm:w-28 flex-shrink-0 flex items-center justify-end">
                          {cell.taught ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 font-mono-code">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Completed
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono-code">
                              Upcoming
                            </span>
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
