import React, { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Users,
  Dices,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { classroomService } from '../services/classroomService';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const Classrooms = ({ onNavigate, createModalOpen, setCreateModalOpen }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit State
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    academicYear: '',
    section: '',
    subject: '',
  });

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    department: 'Computer Science & Engineering',
    academicYear: '2025-2026',
    section: 'A',
    subject: '',
  });
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState(null);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const res = await classroomService.getAll(searchTerm);
      setClassrooms(res.data);
    } catch (err) {
      console.error('Failed to load classrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchClassrooms();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    try {
      await classroomService.create(createForm);
      setCreateModalOpen(false);
      setCreateForm({
        name: '',
        department: 'Computer Science & Engineering',
        academicYear: '2025-2026',
        section: 'A',
        subject: '',
      });
      fetchClassrooms();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditOpen = (cls) => {
    setEditingClassroom(cls);
    setEditForm({
      name: cls.name,
      department: cls.department,
      academicYear: cls.academicYear,
      section: cls.section,
      subject: cls.subject,
    });
    setFormError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    try {
      await classroomService.update(editingClassroom._id, editForm);
      setEditingClassroom(null);
      fetchClassrooms();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setActionLoading(true);
    try {
      await classroomService.delete(deletingId);
      setDeletingId(null);
      fetchClassrooms();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="classroom-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, subject, department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          id="btn-add-classroom"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Classroom</span>
        </button>
      </div>

      {/* Classroom Grid */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : classrooms.length === 0 ? (
        <EmptyState
          icon={School}
          title={searchTerm ? 'No matching classrooms found' : 'No classrooms created yet'}
          description={
            searchTerm
              ? `No classrooms found matching "${searchTerm}". Try a different keyword.`
              : 'Create your first classroom to begin managing student rosters and random selection.'
          }
          actionLabel={searchTerm ? null : 'Create Classroom'}
          onAction={searchTerm ? null : () => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls) => (
            <div
              key={cls._id}
              className="group bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm border border-brand-100 dark:border-brand-900/60">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditOpen(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit classroom"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(cls._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete classroom"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {cls.name}
                </h3>
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                  {cls.subject}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5" /> Department
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {cls.department}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Academic Year
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {cls.academicYear} (Sec {cls.section})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Enrolled Students
                    </span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {cls.studentCount || 0} ({cls.activeStudentCount || 0} active)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onNavigate('students', cls._id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Roster</span>
                </button>
                <button
                  onClick={() => onNavigate('picker', cls._id)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-600/25 transition-all flex items-center justify-center gap-1.5"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Pick</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CLASSROOM MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Classroom"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Classroom Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Data Structures & Algorithms - Sec A"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Subject / Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS301"
                value={createForm.subject}
                onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Section *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. A"
                value={createForm.section}
                onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Department *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Science"
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Academic Year *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2025-2026"
                value={createForm.academicYear}
                onChange={(e) => setCreateForm({ ...createForm, academicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/25 transition-all"
            >
              {actionLoading ? 'Creating...' : 'Create Classroom'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT CLASSROOM MODAL */}
      <Modal
        isOpen={!!editingClassroom}
        onClose={() => setEditingClassroom(null)}
        title="Edit Classroom Details"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Classroom Name *
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Section *
              </label>
              <input
                type="text"
                required
                value={editForm.section}
                onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Department *
              </label>
              <input
                type="text"
                required
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Academic Year *
              </label>
              <input
                type="text"
                required
                value={editForm.academicYear}
                onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingClassroom(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/25 transition-all"
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Classroom"
        message="Are you sure you want to delete this classroom? All associated student rosters, fair round tracking, and history will be permanently deleted."
        confirmLabel="Delete Classroom"
        isLoading={actionLoading}
      />
    </div>
  );
};
