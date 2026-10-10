import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Classrooms } from './pages/Classrooms';
import { StudentManagement } from './pages/StudentManagement';
import { RandomPicker } from './pages/RandomPicker';
import { SelectionHistory } from './pages/SelectionHistory';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

export function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  // Dashboard layout states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [createClassroomModalOpen, setCreateClassroomModalOpen] = useState(false);

  // Cross-page navigation helper
  const handleNavigate = (tab, classroomId = null) => {
    if (classroomId) {
      setSelectedClassroomId(classroomId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 animate-spin flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4">
          <div className="w-4 h-4 bg-white rounded-md" />
        </div>
        <p className="text-sm font-bold tracking-tight animate-pulse">
          Initializing ClassPick Platform...
        </p>
      </div>
    );
  }

  // Unauthenticated: Show Login or Register
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Titles mapping
  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of classrooms and lecture activity' },
    classrooms: { title: 'My Classrooms', subtitle: 'Manage academic courses, sections, and rosters' },
    students: { title: 'Student Management', subtitle: 'Roster records, CSV import, and student status' },
    picker: { title: 'Random Student Picker', subtitle: 'Cryptographically fair selection for classroom lectures' },
    history: { title: 'Selection History', subtitle: 'Audit log of all student draws' },
    profile: { title: 'Faculty Profile', subtitle: 'Manage your faculty credentials and details' },
    settings: { title: 'Settings', subtitle: 'Configure themes, audio, and display preferences' },
  };

  const currentTitle = titles[activeTab] || titles.dashboard;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Sticky Top Navbar */}
        <Navbar
          title={currentTitle.title}
          subtitle={currentTitle.subtitle}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              onOpenCreateClassroom={() => {
                setActiveTab('classrooms');
                setCreateClassroomModalOpen(true);
              }}
            />
          )}

          {activeTab === 'classrooms' && (
            <Classrooms
              onNavigate={handleNavigate}
              createModalOpen={createClassroomModalOpen}
              setCreateModalOpen={setCreateClassroomModalOpen}
            />
          )}

          {activeTab === 'students' && (
            <StudentManagement preselectedClassroomId={selectedClassroomId} />
          )}

          {activeTab === 'picker' && (
            <RandomPicker initialClassroomId={selectedClassroomId} />
          )}

          {activeTab === 'history' && <SelectionHistory />}

          {activeTab === 'profile' && <Profile />}

          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
