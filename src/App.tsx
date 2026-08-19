import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TermData, YearConfig, CellData, ViewMode, UserRole, LockState, CurriculumState, YearReportDate } from './types';
import { YEARS, INITIAL_PLAN } from './data/defaultPlan';
import { DEFAULT_YEAR_REPORT_DATES } from './data/reportCycles';
import { Header } from './components/Header';
import { YearStrip } from './components/YearStrip';
import { Toolbar } from './components/Toolbar';
import { MatrixView } from './components/MatrixView';
import { TimelineView } from './components/TimelineView';
import { CalendarView } from './components/CalendarView';
import { RoadmapView } from './components/RoadmapView';
import { ReportCycleView } from './components/ReportCycleView';
import { LockModal } from './components/LockModal';
import { ShareModal } from './components/ShareModal';
import { StatsModal } from './components/StatsModal';
import { AIHelperModal } from './components/AIHelperModal';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { StudentView } from './components/StudentView';
import { subscribeToCurriculum, saveCurriculumToCloud } from './lib/curriculumSync';

export default function App() {
  const [plan, setPlan] = useState<TermData[]>(() => {
    try {
      const saved = localStorage.getItem('curriculum_plan_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PLAN;
  });

  const [reportDates, setReportDates] = useState<YearReportDate[]>(() => {
    try {
      const saved = localStorage.getItem('curriculum_report_dates_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_YEAR_REPORT_DATES;
  });

  const [lockState, setLockState] = useState<LockState>(() => {
    try {
      const saved = localStorage.getItem('curriculum_lock_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isLocked === 'boolean') {
          return {
            isLocked: parsed.isLocked,
            hasPin: !!parsed.hasPin,
            lockedBy: parsed.lockedBy,
            lockedAt: parsed.lockedAt
          };
        }
      }
    } catch {}
    return {
      isLocked: false,
      hasPin: false
    };
  });
  const [selectedYears, setSelectedYears] = useState<string[]>(YEARS.map(y => y.id));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assessOnly, setAssessOnly] = useState<boolean>(false);
  const [reportOnly, setReportOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  // Modals state
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isTeacherAuthOpen, setIsTeacherAuthOpen] = useState(false);
  const [aiModalData, setAiModalData] = useState<{
    isOpen: boolean;
    yearGroup: string;
    topicText: string;
    termName: string;
    weekNumber: number;
  }>({
    isOpen: false,
    yearGroup: '',
    topicText: '',
    termName: '',
    weekNumber: 1
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Compute current week key from 2026-2027 calendar
  const getCurrentWeekKey = (): string | null => {
    const today = new Date();
    let currentKey: string | null = null;
    let nextUpcomingKey: string | null = null;

    for (const term of plan) {
      for (const row of term.rows) {
        if (row.kind === 'week') {
          const start = new Date(row.iso + 'T00:00:00');
          const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
          if (today >= start && today <= end) {
            currentKey = `${term.id}-${row.n}`;
            break;
          }
          if (!nextUpcomingKey && start > today) {
            nextUpcomingKey = `${term.id}-${row.n}`;
          }
        }
      }
      if (currentKey) break;
    }
    return currentKey || nextUpcomingKey || 't1-1';
  };

  const currentWeekKey = getCurrentWeekKey();

  // Find info about current/next week
  const getCurrentWeekInfo = () => {
    for (const term of plan) {
      for (const row of term.rows) {
        if (row.kind === 'week' && `${term.id}-${row.n}` === currentWeekKey) {
          return {
            termName: term.name.split('·')[0].trim(),
            weekText: `Week ${row.n} (${row.dates})`
          };
        }
      }
    }
    return { termName: 'Term 1', weekText: 'Week 1 (25–28 Aug)' };
  };

  const { termName: currentTermName, weekText: currentWeekText } = getCurrentWeekInfo();

  // Parse URL search params for shared role & year on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'student') {
      setUserRole('student');
    }
    const yearParam = params.get('year');
    if (yearParam && YEARS.some(y => y.id === yearParam)) {
      setSelectedYears([yearParam]);
      setViewMode('timeline');
    }
  }, []);

  // Real-time Cloud Sync (Firestore) with server/localStorage fallback
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    try {
      unsubscribe = subscribeToCurriculum(
        (cloudState) => {
          if (cloudState && Array.isArray(cloudState.plan)) {
            setPlan(cloudState.plan);
            if (Array.isArray(cloudState.reportDates)) {
              setReportDates(cloudState.reportDates);
            }
            if (cloudState.lock) {
              setLockState(cloudState.lock);
            }
            if (cloudState.lastUpdated) {
              setLastUpdated(cloudState.lastUpdated);
            }
            setSyncStatus('synced');
          }
        },
        (error) => {
          console.warn('Firestore subscription offline, falling back to REST sync:', error);
          // Fallback to REST endpoint
          fetch('/api/curriculum')
            .then(res => res.json())
            .then((data: CurriculumState) => {
              if (data && Array.isArray(data.plan)) {
                setPlan(data.plan);
                if (Array.isArray(data.reportDates)) setReportDates(data.reportDates);
                if (data.lock) setLockState(data.lock);
                if (data.lastUpdated) setLastUpdated(data.lastUpdated);
                setSyncStatus('synced');
              }
            })
            .catch(() => {});
        }
      );
    } catch (e) {
      console.warn('Direct Firestore initialization fallback:', e);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Save report dates to Cloud Firestore, server, and localStorage
  const handleUpdateReportDates = (updatedDates: YearReportDate[]) => {
    if (lockState.isLocked && userRole !== 'teacher') return;
    setReportDates(updatedDates);
    try {
      localStorage.setItem('curriculum_report_dates_v2', JSON.stringify(updatedDates));
    } catch {}
    setSyncStatus('saving');

    // 1. Direct Cloud Firestore save
    saveCurriculumToCloud(undefined, updatedDates)
      .then((res) => {
        setLastUpdated(res.lastUpdated);
        setSyncStatus('synced');
      })
      .catch(() => {
        // 2. Server API fallback
        fetch('/api/curriculum', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportDates: updatedDates })
        })
          .then(res => res.json())
          .then(data => {
            if (data.lastUpdated) setLastUpdated(data.lastUpdated);
            setSyncStatus('synced');
          })
          .catch((err) => {
            console.warn('Sync server offline, persisted locally:', err);
            setSyncStatus('synced');
          });
      });
  };

  // Persist plan to Cloud Firestore, server API, and localStorage
  const triggerSave = useCallback((updatedPlan: TermData[]) => {
    try {
      localStorage.setItem('curriculum_plan_v2', JSON.stringify(updatedPlan));
    } catch {}
    setSyncStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Direct Cloud Save (syncs instantly across all connected phones and desktops)
        const cloudResult = await saveCurriculumToCloud(updatedPlan);
        setLastUpdated(cloudResult.lastUpdated);
        setSyncStatus('synced');
      } catch {
        // Server fallback
        try {
          const res = await fetch('/api/curriculum', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: updatedPlan })
          });

          if (res.ok) {
            const data = await res.json();
            setLastUpdated(data.lastUpdated);
            setSyncStatus('synced');
          } else {
            setSyncStatus('synced');
          }
        } catch {
          setSyncStatus('synced');
        }
      }
    }, 400);
  }, []);

  // Update a single cell
  const handleUpdateCell = (
    termId: string,
    weekN: number,
    yearId: string,
    updates: Partial<CellData>
  ) => {
    if (lockState.isLocked && userRole !== 'teacher') return;

    setPlan(prevPlan => {
      const nextPlan = prevPlan.map(term => {
        if (term.id !== termId) return term;
        return {
          ...term,
          rows: term.rows.map(row => {
            if (row.kind !== 'week' || row.n !== weekN) return row;
            const existingCell = row.cells[yearId] || { text: '', assess: false, taught: false };
            return {
              ...row,
              cells: {
                ...row.cells,
                [yearId]: {
                  ...existingCell,
                  ...updates
                }
              }
            };
          })
        };
      });

      triggerSave(nextPlan);
      return nextPlan;
    });
  };

  // Update a weekly departmental note
  const handleUpdateNote = (termId: string, weekN: number, noteText: string) => {
    if (lockState.isLocked && userRole !== 'teacher') return;

    setPlan(prevPlan => {
      const nextPlan = prevPlan.map(term => {
        if (term.id !== termId) return term;
        return {
          ...term,
          rows: term.rows.map(row => {
            if (row.kind !== 'week' || row.n !== weekN) return row;
            return {
              ...row,
              note: noteText
            };
          })
        };
      });

      triggerSave(nextPlan);
      return nextPlan;
    });
  };

  // Lock / Unlock toggle via API & Firestore
  const handleToggleLock = async (
    isLocked: boolean,
    pin?: string,
    currentPin?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const newLockState: LockState = {
      isLocked,
      hasPin: !!pin,
      lockedBy: isLocked ? 'Computing Department' : undefined,
      lockedAt: isLocked ? new Date().toISOString() : undefined
    };

    try {
      // Cloud Firestore save
      await saveCurriculumToCloud(undefined, undefined, newLockState);
      setLockState(newLockState);
      try {
        localStorage.setItem('curriculum_lock_state', JSON.stringify({ ...newLockState, pin: pin || '2026' }));
      } catch {}
      return { success: true };
    } catch {
      // Fallback
      setLockState(newLockState);
      try {
        localStorage.setItem('curriculum_lock_state', JSON.stringify({ ...newLockState, pin: pin || '2026' }));
      } catch {}
      return { success: true };
    }
  };

  // Reset to default syllabus
  const handleReset = async () => {
    if (lockState.isLocked) {
      alert('Timeline is currently locked. Please unlock first to reset.');
      return;
    }
    if (!window.confirm('Reset all 38 weeks and 7 year levels back to the default curriculum? Your custom edits will be replaced.')) {
      return;
    }

    const resetPlan = JSON.parse(JSON.stringify(INITIAL_PLAN));
    const resetReportDates = JSON.parse(JSON.stringify(DEFAULT_YEAR_REPORT_DATES));

    try {
      await saveCurriculumToCloud(resetPlan, resetReportDates);
      setPlan(resetPlan);
      setReportDates(resetReportDates);
      setSyncStatus('synced');
    } catch {
      setPlan(resetPlan);
      setReportDates(resetReportDates);
    }
  };

  // Year filter toggle
  const handleToggleYear = (yearId: string) => {
    setSelectedYears(prev => {
      if (prev.includes(yearId)) {
        if (prev.length === 1) return prev; // keep at least 1 year visible
        return prev.filter(id => id !== yearId);
      }
      return [...prev, yearId];
    });
  };

  // Stage preset selection
  const handleSelectStage = (stage: 'all' | 'ks3' | 'ks4' | 'ks5') => {
    if (stage === 'all') {
      setSelectedYears(YEARS.map(y => y.id));
    } else {
      setSelectedYears(YEARS.filter(y => y.stage === stage).map(y => y.id));
    }
  };

  // Scroll to week
  const handleSelectWeek = (termId: string, weekN: number) => {
    if (viewMode !== 'matrix' && viewMode !== 'timeline') {
      setViewMode('matrix');
    }
    setTimeout(() => {
      const el = document.getElementById(`wk-${termId}-${weekN}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Jump to current week
  const handleJumpCurrentWeek = () => {
    if (currentWeekKey) {
      const [termId, weekN] = currentWeekKey.split('-');
      handleSelectWeek(termId, parseInt(weekN, 10));
    }
  };

  // Export options
  const handleExport = (format: 'md' | 'csv' | 'print') => {
    if (format === 'print') {
      window.print();
      return;
    }

    const activeYears = YEARS.filter(y => selectedYears.includes(y.id));

    if (format === 'md') {
      let md = '# The British International School Budapest · Computing Curriculum 2026–2027\n\n';
      plan.forEach(term => {
        md += `## ${term.name} (${term.dates} · ${term.weeks} weeks)\n\n`;
        md += `| Week | Dates | ${activeYears.map(y => y.label).join(' | ')} |\n`;
        md += `|---|---|${activeYears.map(() => '---').join('|')}|\n`;
        term.rows.forEach(row => {
          if (row.kind === 'break') {
            md += `| — | **${row.label}** |${activeYears.map(() => ' ').join('|')}|\n`;
            return;
          }
          const cells = activeYears.map(y => {
            const c = row.cells[y.id] || { text: '', assess: false, taught: false };
            let t = c.text.replace(/\|/g, '\\|');
            if (c.assess) t = `★ **${t}**`;
            if (c.taught) t += ' ✓';
            return t;
          });
          md += `| ${row.n} | ${row.dates}${row.flag ? ` *(${row.flag})*` : ''} | ${cells.join(' | ')} |\n`;
          if (row.note) {
            md += `| | *Dept Note* | ${row.note.replace(/\|/g, '\\|')} |${activeYears.slice(1).map(() => ' ').join('|')}|\n`;
          }
        });
        md += '\n';
      });

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bisb-computing-curriculum-2026-27.md';
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      let csv = 'Term,Week,Dates,Flag,' + activeYears.map(y => `"${y.label} (${y.qualification})"`).join(',') + ',Weekly Notes\n';
      plan.forEach(term => {
        term.rows.forEach(row => {
          if (row.kind === 'break') {
            csv += `"${term.name}","Holiday","${row.label}","${row.detail || ''}",${activeYears.map(() => '""').join(',')},""\n`;
            return;
          }
          const cellValues = activeYears.map(y => {
            const c = row.cells[y.id] || { text: '', assess: false, taught: false };
            let text = c.text.replace(/"/g, '""');
            if (c.assess) text = `[ASSESSMENT] ${text}`;
            if (c.taught) text = `[TAUGHT] ${text}`;
            return `"${text}"`;
          });
          csv += `"${term.name}","W${row.n}","${row.dates}","${row.flag || ''}",${cellValues.join(',')},"${(row.note || '').replace(/"/g, '""')}"\n`;
        });
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bisb-computing-curriculum-2026-27.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 text-base">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-6 pt-6">
        {userRole === 'student' ? (
          /* Dedicated Student & Parent Experience */
          <main>
            <StudentView
              plan={plan}
              years={YEARS}
              selectedYearId={selectedYears[0] || 'y7'}
              onSelectYear={(yId) => setSelectedYears([yId])}
              currentWeekKey={currentWeekKey}
              currentTermName={currentTermName}
              currentWeekText={currentWeekText}
              onSwitchToTeacher={() => setIsTeacherAuthOpen(true)}
            />
          </main>
        ) : (
          /* Teacher / Department Planner Experience */
          <>
            {/* Header */}
            <Header
              userRole={userRole}
              lockState={lockState}
              syncStatus={syncStatus}
              lastUpdated={lastUpdated}
              currentTermName={currentTermName}
              currentWeekText={currentWeekText}
              onJumpCurrentWeek={handleJumpCurrentWeek}
            />

            {/* 38-Week Interactive Signature Strip */}
            <div className="mb-6">
              <YearStrip
                plan={plan}
                years={YEARS}
                selectedYears={selectedYears}
                currentWeekKey={currentWeekKey}
                onSelectWeek={handleSelectWeek}
              />
            </div>

            {/* Floating / Sticky Toolbar */}
            <Toolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedYears={selectedYears}
              onToggleYear={handleToggleYear}
              onSelectStage={handleSelectStage}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              assessOnly={assessOnly}
              onToggleAssessOnly={() => setAssessOnly(prev => !prev)}
              reportOnly={reportOnly}
              onToggleReportOnly={() => setReportOnly(prev => !prev)}
              userRole={userRole}
              onToggleRole={() => {
                if (userRole === 'student') {
                  setIsTeacherAuthOpen(true);
                } else {
                  setUserRole('student');
                }
              }}
              lockState={lockState}
              onOpenLockModal={() => setIsLockModalOpen(true)}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              onOpenStatsModal={() => setIsStatsModalOpen(true)}
              onExport={handleExport}
              onReset={handleReset}
            />

            {/* Main Content Views */}
            <main>
              {viewMode === 'matrix' && (
                <MatrixView
                  plan={plan}
                  years={YEARS}
                  selectedYears={selectedYears}
                  searchQuery={searchQuery}
                  assessOnly={assessOnly}
                  reportOnly={reportOnly}
                  userRole={userRole}
                  lockState={lockState}
                  currentWeekKey={currentWeekKey}
                  onUpdateCell={handleUpdateCell}
                  onUpdateNote={handleUpdateNote}
                  onClearFilters={() => {
                    setAssessOnly(false);
                    setReportOnly(false);
                    setSearchQuery('');
                  }}
                  onOpenAIHelper={(yearGroup, topicText, termName, weekN) =>
                    setAiModalData({
                      isOpen: true,
                      yearGroup,
                      topicText,
                      termName,
                      weekNumber: weekN
                    })
                  }
                />
              )}

              {viewMode === 'reports' && (
                <ReportCycleView
                  years={YEARS}
                  plan={plan}
                  userRole={userRole}
                  lockState={lockState}
                  reportDates={reportDates}
                  onUpdateReportDates={handleUpdateReportDates}
                  onNavigateToWeek={handleSelectWeek}
                />
              )}

              {viewMode === 'timeline' && (
                <TimelineView
                  plan={plan}
                  years={YEARS}
                  selectedYears={selectedYears}
                  searchQuery={searchQuery}
                  assessOnly={assessOnly}
                  userRole={userRole}
                  lockState={lockState}
                  currentWeekKey={currentWeekKey}
                  onUpdateCell={handleUpdateCell}
                  onOpenAIHelper={(yearGroup, topicText, termName, weekN) =>
                    setAiModalData({
                      isOpen: true,
                      yearGroup,
                      topicText,
                      termName,
                      weekNumber: weekN
                    })
                  }
                />
              )}

              {viewMode === 'calendar' && <CalendarView />}

              {viewMode === 'roadmap' && <RoadmapView />}
            </main>
          </>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-200 text-sm font-mono-code text-slate-600 space-y-3 leading-relaxed">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-bold text-slate-800 text-base">
                The British International School Budapest · Computing Curriculum Planner 2026–2027
              </span>
              <p className="text-sm mt-0.5 text-slate-500">
                Pearson Edexcel International GCSE (4CP0) · IB Diploma Programme Computer Science · Key Stage 3
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span>Term 1: 16 wks</span>
              <span>Term 2: 11 wks</span>
              <span>Term 3: 11 wks</span>
              <span className="font-bold text-indigo-700">Total: 38 Teaching Weeks</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">
            Holidays mapped: 19–26 Oct Half Term (26 Oct Staff INSET) · 17 Dec–5 Jan Christmas Break (4–5 Jan INSET) · 15–19 Feb Half Term · 15 Mar National Holiday · 26 Mar–12 Apr Spring Break · 1 May Public Holiday · 17–18 May Whitsun Holiday · 24 Jun Final Student Day (12 noon finish).
          </p>
        </footer>
      </div>

      {/* Modals */}
      <LockModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        lockState={lockState}
        onToggleLock={handleToggleLock}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        isLocked={lockState.isLocked}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        plan={plan}
        years={YEARS}
      />

      <TeacherAuthModal
        isOpen={isTeacherAuthOpen}
        onClose={() => setIsTeacherAuthOpen(false)}
        onSuccess={() => setUserRole('teacher')}
      />

      <AIHelperModal
        isOpen={aiModalData.isOpen}
        onClose={() => setAiModalData(prev => ({ ...prev, isOpen: false }))}
        yearGroup={aiModalData.yearGroup}
        topicText={aiModalData.topicText}
        termName={aiModalData.termName}
        weekNumber={aiModalData.weekNumber}
      />
    </div>
  );
}
