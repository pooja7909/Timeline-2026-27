import React, { useState, useMemo } from 'react';
import { YearConfig, TermData, UserRole, LockState, YearReportDate } from '../types';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  GraduationCap,
  Save,
  Lock,
  CalendarDays,
  FileText
} from 'lucide-react';

interface ReportCycleViewProps {
  years: YearConfig[];
  plan: TermData[];
  userRole: UserRole;
  lockState: LockState;
  reportDates: YearReportDate[];
  onUpdateReportDates: (dates: YearReportDate[]) => void;
  onNavigateToWeek?: (termId: string, weekN: number) => void;
}

export const ReportCycleView: React.FC<ReportCycleViewProps> = ({
  years,
  plan,
  userRole,
  lockState,
  reportDates,
  onUpdateReportDates,
  onNavigateToWeek
}) => {
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<YearReportDate>>({});

  // Add new state
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newForm, setNewForm] = useState<Omit<YearReportDate, 'id'>>({
    yearId: 'y7',
    reportName: '',
    termId: 't1',
    openDate: '',
    closeDate: '',
    notes: ''
  });

  const isEditable = userRole === 'teacher' && !lockState.isLocked;

  // Compute status for a date range
  const getStatus = (openDateStr: string, closeDateStr: string) => {
    if (!openDateStr || !closeDateStr) return { label: 'Scheduled', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const open = new Date(openDateStr);
    const close = new Date(closeDateStr);
    close.setHours(23, 59, 59, 999);

    if (isNaN(open.getTime()) || isNaN(close.getTime())) {
      return { label: 'Scheduled', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }

    if (today < open) {
      const daysUntil = Math.ceil((open.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        label: `Opens in ${daysUntil}d`, 
        color: 'bg-sky-50 text-sky-800 border-sky-200' 
      };
    } else if (today >= open && today <= close) {
      return { 
        label: 'Open Now', 
        color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' 
      };
    } else {
      return { 
        label: 'Closed', 
        color: 'bg-slate-100 text-slate-500 border-slate-200' 
      };
    }
  };

  // Format date nicely
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    try {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return dateStr;
      return parsed.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return reportDates.filter((item) => {
      if (selectedYearFilter !== 'all' && item.yearId !== selectedYearFilter) {
        return false;
      }
      if (selectedTermFilter !== 'all' && item.termId !== selectedTermFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const yearObj = years.find(y => y.id === item.yearId);
        const yearName = yearObj ? yearObj.label.toLowerCase() : '';
        const matchName = item.reportName.toLowerCase().includes(query);
        const matchYear = yearName.includes(query) || item.yearId.toLowerCase().includes(query);
        const matchNotes = (item.notes || '').toLowerCase().includes(query);
        if (!matchName && !matchYear && !matchNotes) return false;
      }
      return true;
    });
  }, [reportDates, selectedYearFilter, selectedTermFilter, searchQuery, years]);

  // Start editing row
  const handleStartEdit = (item: YearReportDate) => {
    if (!isEditable) return;
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editingId) return;
    const updated = reportDates.map((item) => {
      if (item.id === editingId) {
        return {
          ...item,
          ...editForm
        } as YearReportDate;
      }
      return item;
    });
    onUpdateReportDates(updated);
    setEditingId(null);
    setEditForm({});
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    if (!isEditable) return;
    const updated = reportDates.filter((item) => item.id !== id);
    onUpdateReportDates(updated);
  };

  // Add new row submit
  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.reportName || !newForm.openDate || !newForm.closeDate) {
      alert('Please fill in Report Name, Open Date, and Close Date.');
      return;
    }
    const newEntry: YearReportDate = {
      id: `yr-${Date.now()}`,
      yearId: newForm.yearId,
      reportName: newForm.reportName,
      termId: newForm.termId,
      openDate: newForm.openDate,
      closeDate: newForm.closeDate,
      notes: newForm.notes
    };
    onUpdateReportDates([...reportDates, newEntry]);
    setIsAddingNew(false);
    setNewForm({
      yearId: 'y7',
      reportName: '',
      termId: 't1',
      openDate: '',
      closeDate: '',
      notes: ''
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner - Light, clean, large text */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <CalendarDays className="w-6 h-6 text-indigo-600" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
                Report Cycle Dates
              </h1>
            </div>
            <p className="text-base sm:text-lg text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Schedule of report opening and closing dates for each year group across 2026–2027.
            </p>
          </div>

          {/* Add date button & lock status */}
          <div className="flex items-center gap-3">
            {lockState.isLocked ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Timeline Locked (Read Only)</span>
              </div>
            ) : isEditable ? (
              <button
                onClick={() => setIsAddingNew(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Add Report Date</span>
              </button>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium">
                Student View (Read-Only)
              </span>
            )}
          </div>
        </div>

        {/* Filter bar - Year Group Tabs & Term selection */}
        <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Year Group Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-500 mr-2">
              Year Group:
            </span>
            <button
              onClick={() => setSelectedYearFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-base font-semibold transition-all ${
                selectedYearFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Years
            </button>
            {years.map((y) => (
              <button
                key={y.id}
                onClick={() => setSelectedYearFilter(y.id)}
                className={`px-3.5 py-1.5 rounded-xl text-base font-semibold flex items-center gap-1.5 transition-all ${
                  selectedYearFilter === y.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: y.color }}
                />
                <span>{y.label}</span>
              </button>
            ))}
          </div>

          {/* Term filter & search */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTermFilter}
              onChange={(e) => setSelectedTermFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-base font-medium bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            >
              <option value="all">All Terms</option>
              <option value="t1">Term 1 (Autumn)</option>
              <option value="t2">Term 2 (Spring)</option>
              <option value="t3">Term 3 (Summer)</option>
            </select>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search report..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3.5 py-2 rounded-xl text-base bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-400 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add New Report Date Modal / Form */}
      {isAddingNew && (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 shadow-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-900">
                Add New Report Cycle Dates
              </h3>
            </div>
            <button
              onClick={() => setIsAddingNew(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddNew} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Year Group <span className="text-rose-500">*</span>
              </label>
              <select
                value={newForm.yearId}
                onChange={(e) => setNewForm({ ...newForm, yearId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label} ({y.short})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Report Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Report 1 (Settling-In)"
                value={newForm.reportName}
                onChange={(e) => setNewForm({ ...newForm, reportName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Academic Term <span className="text-rose-500">*</span>
              </label>
              <select
                value={newForm.termId}
                onChange={(e) => setNewForm({ ...newForm, termId: e.target.value as 't1' | 't2' | 't3' })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="t1">Term 1 (Autumn)</option>
                <option value="t2">Term 2 (Spring)</option>
                <option value="t3">Term 3 (Summer)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                When Report Opens <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newForm.openDate}
                onChange={(e) => setNewForm({ ...newForm, openDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                When Report Closes <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newForm.closeDate}
                onChange={(e) => setNewForm({ ...newForm, closeDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Notes / Detail (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Attitude to Learning & Grade"
                value={newForm.notes || ''}
                onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
              >
                Save Report Dates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Dates Table - Clean light cards and large font size */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-sm font-bold uppercase tracking-wider">
                <th className="py-4 px-5">Year Group</th>
                <th className="py-4 px-5">Report Name</th>
                <th className="py-4 px-5">Term</th>
                <th className="py-4 px-5">Report Opens</th>
                <th className="py-4 px-5">Report Closes</th>
                <th className="py-4 px-5">Status</th>
                {isEditable && <th className="py-4 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-base">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={isEditable ? 7 : 6} className="py-12 text-center text-slate-500 text-lg">
                    No report dates found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isEditing = editingId === item.id;
                  const yearObj = years.find(y => y.id === item.yearId);
                  const status = getStatus(item.openDate, item.closeDate);

                  if (isEditing) {
                    return (
                      <tr key={item.id} className="bg-indigo-50/40">
                        {/* Year */}
                        <td className="py-3.5 px-5">
                          <select
                            value={editForm.yearId || item.yearId}
                            onChange={(e) => setEditForm({ ...editForm, yearId: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                          >
                            {years.map(y => (
                              <option key={y.id} value={y.id}>{y.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-5">
                          <input
                            type="text"
                            value={editForm.reportName || ''}
                            onChange={(e) => setEditForm({ ...editForm, reportName: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
                            placeholder="Report Name"
                          />
                        </td>

                        {/* Term */}
                        <td className="py-3.5 px-5">
                          <select
                            value={editForm.termId || item.termId}
                            onChange={(e) => setEditForm({ ...editForm, termId: e.target.value as 't1' | 't2' | 't3' })}
                            className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900"
                          >
                            <option value="t1">Term 1</option>
                            <option value="t2">Term 2</option>
                            <option value="t3">Term 3</option>
                          </select>
                        </td>

                        {/* Opens */}
                        <td className="py-3.5 px-5">
                          <input
                            type="date"
                            value={editForm.openDate || ''}
                            onChange={(e) => setEditForm({ ...editForm, openDate: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900"
                          />
                        </td>

                        {/* Closes */}
                        <td className="py-3.5 px-5">
                          <input
                            type="date"
                            value={editForm.closeDate || ''}
                            onChange={(e) => setEditForm({ ...editForm, closeDate: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900"
                          />
                        </td>

                        {/* Status preview */}
                        <td className="py-3.5 px-5">
                          <span className="text-xs text-slate-500 font-mono-code">Editing...</span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              title="Save changes"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Year Group */}
                      <td className="py-4 px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: yearObj?.color || '#64748b' }}
                          />
                          <span className="text-lg">
                            {yearObj?.label || item.yearId.toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Report Name & Notes */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900 text-base">
                          {item.reportName}
                        </div>
                        {item.notes && (
                          <div className="text-sm text-slate-500 mt-0.5">
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Term */}
                      <td className="py-4 px-5">
                        <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.termId === 't1' ? 'Term 1' : item.termId === 't2' ? 'Term 2' : 'Term 3'}
                        </span>
                      </td>

                      {/* Opens */}
                      <td className="py-4 px-5 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5 text-base">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span>{formatDateDisplay(item.openDate)}</span>
                        </div>
                      </td>

                      {/* Closes */}
                      <td className="py-4 px-5 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5 text-base">
                          <Calendar className="w-4 h-4 text-rose-600" />
                          <span>{formatDateDisplay(item.closeDate)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${status.color}`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      {isEditable && (
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title="Edit dates"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(item.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stat Cards - Light, simple */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Total Report Cycles
          </span>
          <div className="text-3xl font-display font-bold text-slate-900 mt-1">
            {reportDates.length}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Scheduled across Years 7–13
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-sm font-bold uppercase tracking-wider text-emerald-700">
            Currently Open
          </span>
          <div className="text-3xl font-display font-bold text-emerald-700 mt-1">
            {reportDates.filter(r => getStatus(r.openDate, r.closeDate).label === 'Open Now').length}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Grade entry active now
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-sm font-bold uppercase tracking-wider text-sky-700">
            Upcoming Cycles
          </span>
          <div className="text-3xl font-display font-bold text-sky-700 mt-1">
            {reportDates.filter(r => getStatus(r.openDate, r.closeDate).label.startsWith('Opens in')).length}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Approaching deadlines
          </p>
        </div>
      </div>
    </div>
  );
};
