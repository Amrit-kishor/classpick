import React, { useState, useEffect } from 'react';
import {
  School,
  Users,
  Dices,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { selectionService } from '../services/selectionService';

export const Dashboard = ({ onNavigate, onOpenCreateClassroom }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { totalClassrooms: 0, totalStudents: 0, totalSelections: 0 },
    recentClassrooms: [],
    recentSelections: [],
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await selectionService.getDashboardStats();
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="stats" />
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Quick Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white shadow-xl shadow-brand-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Faculty Command Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Seamless & Unbiased Student Selection
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/90 mt-2 max-w-xl font-normal leading-relaxed">
            Manage classroom rosters, eliminate selection bias during lectures, and track engagement across active lecture rounds.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigate('picker')}
              id="dashboard-open-picker-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-700 hover:bg-slate-50 font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Dices className="w-4 h-4 text-brand-600" />
              <span>Launch Random Picker</span>
            </button>
            <button
              onClick={onOpenCreateClassroom}
              id="dashboard-create-classroom-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-sm transition-all border border-white/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Classroom</span>
            </button>
          </div>
        </div>

        {/* Ambient Decorative Shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-radial from-white via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatsCard
          label="Total Classrooms"
          value={data.stats.totalClassrooms}
          icon={School}
          color="brand"
          subtext="Active academic cohorts"
        />
        <StatsCard
          label="Total Students"
          value={data.stats.totalStudents}
          icon={Users}
          color="emerald"
          subtext="Enrolled across rosters"
        />
        <StatsCard
          label="Total Selections"
          value={data.stats.totalSelections}
          icon={Dices}
          color="violet"
          subtext="Cryptographically recorded"
        />
      </div>

      {/* Two Column Grid: Recent Classrooms & Recent Selections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Accessed Classrooms */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <School className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Recently Accessed Classrooms
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quick jump to frequent rosters
              </p>
            </div>
            <button
              onClick={() => onNavigate('classrooms')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {data.recentClassrooms.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No classrooms created yet. Create one to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentClassrooms.map((cls) => (
                <div
                  key={cls._id}
                  onClick={() => onNavigate('picker', cls._id)}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-navy-850/50 hover:bg-white dark:hover:bg-navy-800 hover:border-brand-300 dark:hover:border-brand-500/40 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {cls.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {cls.subject} • Sec {cls.section}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-800">
                      {cls.studentCount} students
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Selection Activity */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Recent Selection Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit trail of latest lecture draws
              </p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Full history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {data.recentSelections.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No student selection draws made yet. Open the picker to select a student!
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentSelections.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-navy-850/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {item.studentName?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.studentName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {item.studentRollNumber} • {item.classroom?.name || 'Classroom'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.mode === 'fair_round'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                    }`}>
                      {item.mode === 'fair_round' ? `Round ${item.roundNumber}` : 'Random'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(item.selectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
