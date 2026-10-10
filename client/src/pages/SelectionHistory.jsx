import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Search,
  Calendar,
  Filter,
  School,
  ChevronDown,
  Clock,
  Dices,
} from 'lucide-react';
import { selectionService } from '../services/selectionService';
import { classroomService } from '../services/classroomService';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const SelectionHistory = () => {
  const [history, setHistory] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Clear dialog state
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load classrooms on mount
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await classroomService.getAll();
        setClassrooms(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClassrooms();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await selectionService.getHistory({
        classroomId: selectedClassroomId || undefined,
        mode: selectedMode || undefined,
        date: selectedDate || undefined,
      });
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedClassroomId, selectedMode, selectedDate]);

  const handleClearConfirm = async () => {
    setActionLoading(true);
    try {
      await selectionService.clearHistory(selectedClassroomId || undefined);
      setClearDialogOpen(false);
      fetchHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm border border-brand-100 dark:border-brand-900/60">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Selection History Log
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited records of every student drawn during lectures
              </p>
            </div>
          </div>

          {/* Clear history button */}
          <button
            onClick={() => setClearDialogOpen(true)}
            id="btn-clear-history"
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Classroom filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Classroom
            </label>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 font-medium"
            >
              <option value="">All Classrooms</option>
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Selection Mode
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 font-medium"
            >
              <option value="">All Modes</option>
              <option value="random">Random Mode</option>
              <option value="fair_round">Fair Round Mode</option>
            </select>
          </div>

          {/* Date filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 font-medium"
            />
          </div>
        </div>
      </div>

      {/* History Log Table */}
      {loading ? (
        <LoadingSkeleton type="table" count={6} />
      ) : history.length === 0 ? (
        <EmptyState
          icon={History}
          title="No selection history found"
          description="Selections will automatically be recorded here whenever you pick a student from the picker."
        />
      ) : (
        <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-navy-950/60 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-6">Selected Student</th>
                  <th className="py-3.5 px-6">Roll Number</th>
                  <th className="py-3.5 px-6">Classroom</th>
                  <th className="py-3.5 px-6">Mode</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {history.map((record) => (
                  <tr
                    key={record._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-navy-850/60 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {record.studentName?.charAt(0) || 'S'}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {record.studentName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-brand-600 dark:text-brand-400 text-xs">
                      {record.studentRollNumber}
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-600 dark:text-slate-300">
                      {record.classroomName || record.classroom?.name}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          record.mode === 'fair_round'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        {record.mode === 'fair_round'
                          ? `Round ${record.roundNumber}`
                          : 'Random'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(record.selectedAt).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLEAR HISTORY CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearConfirm}
        title="Clear Selection History"
        message={
          selectedClassroomId
            ? 'Are you sure you want to clear the selection history for this classroom? This action cannot be undone.'
            : 'Are you sure you want to clear all selection history logs across all classrooms? This action cannot be undone.'
        }
        confirmLabel="Clear Logs"
        isLoading={actionLoading}
      />
    </div>
  );
};
