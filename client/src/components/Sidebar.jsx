import React from 'react';
import {
  LayoutDashboard,
  School,
  Users,
  Dices,
  History,
  User,
  Settings,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) => {
  const { faculty, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classrooms', label: 'My Classrooms', icon: School },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'picker', label: 'Random Student Picker', icon: Dices, highlight: true },
    { id: 'history', label: 'Selection History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-navy-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Class<span className="text-brand-400">Pick</span>
              </span>
              <span className="text-xs text-slate-400 block font-medium">Faculty Portal</span>
            </div>
          </div>
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                } ${item.highlight && !isActive ? 'border border-brand-500/30 text-brand-300 bg-brand-950/20' : ''}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.highlight ? 'text-brand-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Core
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center border border-indigo-500/30 text-sm">
              {faculty?.name ? faculty.name.charAt(0).toUpperCase() : 'F'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{faculty?.name || 'Faculty Member'}</p>
              <p className="text-[11px] text-slate-400 truncate">{faculty?.department || 'Department'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            id="sidebar-logout-btn"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
