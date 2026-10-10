import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Upload,
  Download,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { studentService } from '../services/studentService';
import { classroomService } from '../services/classroomService';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const StudentManagement = ({ preselectedClassroomId }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState(preselectedClassroomId || '');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add Student State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: '', rollNumber: '', isActive: true });

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', rollNumber: '', isActive: true });

  // CSV Import State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Delete State
  const [deletingId, setDeletingId] = useState(null);

  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load classrooms on mount
  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        const res = await classroomService.getAll();
        setClassrooms(res.data);
        if (!selectedClassroomId && res.data.length > 0) {
          setSelectedClassroomId(res.data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadClassrooms();
  }, []);

  // Update selected if prop changes
  useEffect(() => {
    if (preselectedClassroomId) {
      setSelectedClassroomId(preselectedClassroomId);
    }
  }, [preselectedClassroomId]);

  // Load students for active classroom
  const fetchStudents = async () => {
    if (!selectedClassroomId) return;
    try {
      setLoading(true);
      const res = await studentService.getStudents(selectedClassroomId, {
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStudents();
    }, 200);
    return () => clearTimeout(timeout);
  }, [selectedClassroomId, searchTerm, statusFilter]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    try {
      await studentService.createStudent(selectedClassroomId, addForm);
      setAddModalOpen(false);
      setAddForm({ fullName: '', rollNumber: '', isActive: true });
      fetchStudents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    try {
      await studentService.updateStudent(editingStudent._id, editForm);
      setEditingStudent(null);
      fetchStudents();
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
      await studentService.deleteStudent(deletingId);
      setDeletingId(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setFormError('Please select a CSV file to upload.');
      return;
    }
    setFormError('');
    setActionLoading(true);
    try {
      const res = await studentService.importCSV(selectedClassroomId, importFile);
      setImportStatus(res);
      setImportFile(null);
      fetchStudents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    const currentClass = classrooms.find((c) => c._id === selectedClassroomId);
    await studentService.exportCSV(selectedClassroomId, currentClass?.name || 'Classroom');
  };

  const activeCount = students.filter((s) => s.isActive).length;
  const currentClassroom = classrooms.find((c) => c._id === selectedClassroomId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Bar: Classroom Selector & Actions */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm border border-brand-100 dark:border-brand-900/60">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select Classroom
              </label>
              <div className="relative mt-0.5">
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="appearance-none pr-8 py-1 bg-transparent font-bold text-base text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {classrooms.map((c) => (
                    <option key={c._id} value={c._id} className="dark:bg-navy-900 dark:text-white">
                      {c.name} ({c.subject})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setFormError('');
                setAddModalOpen(true);
              }}
              id="btn-add-student"
              disabled={!selectedClassroomId}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
            <button
              onClick={() => {
                setFormError('');
                setImportStatus(null);
                setImportModalOpen(true);
              }}
              id="btn-import-csv"
              disabled={!selectedClassroomId}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={handleExport}
              disabled={!selectedClassroomId || students.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="student-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or roll number..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filter:</span>
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all ${
                    statusFilter === status
                      ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <span className="ml-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              {students.length} Total ({activeCount} Active)
            </span>
          </div>
        </div>
      </div>

      {/* Student Roster Table */}
      {loading ? (
        <LoadingSkeleton type="table" count={5} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchTerm ? 'No matching students' : 'No students in this classroom'}
          description={
            searchTerm
              ? `No student found matching "${searchTerm}".`
              : 'Add students individually or import a CSV roster to begin running random student selections.'
          }
          actionLabel={searchTerm ? null : 'Add First Student'}
          onAction={searchTerm ? null : () => setAddModalOpen(true)}
        />
      ) : (
        <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-navy-950/60 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-6">Student Name</th>
                  <th className="py-3.5 px-6">Roll Number</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {students.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-navy-850/60 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {student.fullName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {student.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-brand-600 dark:text-brand-400 text-xs">
                      {student.rollNumber}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          student.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {student.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            setEditForm({
                              fullName: student.fullName,
                              rollNumber: student.rollNumber,
                              isActive: student.isActive,
                            });
                            setFormError('');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(student._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Student to Classroom"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aarav Sharma"
              value={addForm.fullName}
              onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Roll Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CS2026-001"
              value={addForm.rollNumber}
              onChange={(e) => setAddForm({ ...addForm, rollNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Roll number must be unique within this classroom.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="add-student-active"
              checked={addForm.isActive}
              onChange={(e) => setAddForm({ ...addForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="add-student-active" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Active (Eligible for random student selection)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/25 transition-all"
            >
              {actionLoading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT MODAL */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Edit Student Details"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Roll Number *
            </label>
            <input
              type="text"
              required
              value={editForm.rollNumber}
              onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="edit-student-active"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="edit-student-active" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Active (Eligible for random student selection)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
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

      {/* IMPORT CSV MODAL */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Students from CSV"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {formError}
            </div>
          )}

          {importStatus && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {importStatus.message}
              </p>
              {importStatus.skippedDuplicates?.length > 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Skipped existing rolls: {importStatus.skippedDuplicates.join(', ')}
                </p>
              )}
            </div>
          )}

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-500 transition-colors bg-slate-50/50 dark:bg-navy-950/50"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files[0] || null)}
              className="hidden"
            />
            <FileText className="w-8 h-8 text-brand-600 dark:text-brand-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {importFile ? importFile.name : 'Click or drop a student CSV file here'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Required columns: <code className="text-brand-600">fullName</code>,{' '}
              <code className="text-brand-600">rollNumber</code>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={actionLoading || !importFile}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 shadow-md shadow-brand-600/25 transition-all"
            >
              {actionLoading ? 'Uploading...' : 'Import CSV'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        message="Are you sure you want to remove this student from the classroom roster? This action cannot be undone."
        confirmLabel="Delete Student"
        isLoading={actionLoading}
      />
    </div>
  );
};
