import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      index: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
      maxlength: [100, 'Student name cannot exceed 100 characters'],
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
      uppercase: true,
      maxlength: [50, 'Roll number cannot exceed 50 characters'],
    },
    profileImage: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate roll numbers inside the same classroom
studentSchema.index({ classroom: 1, rollNumber: 1 }, { unique: true });

export const Student = mongoose.model('Student', studentSchema);
