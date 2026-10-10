import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { stringify } from 'csv-stringify';

/**
 * Parses CSV buffer into array of student objects
 */
export const parseStudentCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString('utf-8'));

    stream
      .pipe(
        csvParser({
          mapHeaders: ({ header }) =>
            header.trim().toLowerCase().replace(/[\s_-]+/g, ''),
        })
      )
      .on('data', (data) => {
        // Look for flexible column names:
        // fullName, name, studentname
        // rollNumber, rollno, roll, id, studentid
        // status, isactive, active
        const fullName =
          data.fullname || data.name || data.studentname || data['student name'] || '';
        const rollNumber =
          data.rollnumber || data.rollno || data.roll || data.id || data.studentid || '';
        const rawStatus = (data.status || data.isactive || data.active || 'active')
          .toString()
          .toLowerCase();

        const isActive = !(
          rawStatus === 'inactive' ||
          rawStatus === 'false' ||
          rawStatus === '0'
        );

        if (fullName.trim() && rollNumber.trim()) {
          results.push({
            fullName: fullName.trim(),
            rollNumber: rollNumber.trim().toUpperCase(),
            isActive,
          });
        }
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

/**
 * Converts array of student documents into CSV string
 */
export const generateStudentCSV = (students) => {
  return new Promise((resolve, reject) => {
    const rows = students.map((s, idx) => ({
      'S.No': idx + 1,
      'Full Name': s.fullName,
      'Roll Number': s.rollNumber,
      Status: s.isActive ? 'Active' : 'Inactive',
      'Created At': new Date(s.createdAt).toISOString().split('T')[0],
    }));

    stringify(rows, { header: true }, (err, output) => {
      if (err) return reject(err);
      resolve(output);
    });
  });
};
