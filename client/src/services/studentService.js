import api from './api';

export const studentService = {
  async getStudents(classroomId, params = {}) {
    const res = await api.get(`/classrooms/${classroomId}/students`, { params });
    return res.data;
  },

  async createStudent(classroomId, data) {
    const res = await api.post(`/classrooms/${classroomId}/students`, data);
    return res.data;
  },

  async updateStudent(studentId, data) {
    const res = await api.put(`/students/${studentId}`, data);
    return res.data;
  },

  async deleteStudent(studentId) {
    const res = await api.delete(`/students/${studentId}`);
    return res.data;
  },

  async importCSV(classroomId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/classrooms/${classroomId}/students/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async exportCSV(classroomId, classroomName = 'classroom') {
    const res = await api.get(`/classrooms/${classroomId}/students/export`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${classroomName}_students.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
