import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Classroom name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required (e.g. 2025-2026)'],
      trim: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required (e.g. A, B, CS-1)'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject name/code is required'],
      trim: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
      index: true,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for student count
classroomSchema.virtual('studentCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'classroom',
  count: true,
});

export const Classroom = mongoose.model('Classroom', classroomSchema);
