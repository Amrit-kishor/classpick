import mongoose from 'mongoose';

const selectionHistorySchema = new mongoose.Schema(
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
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentRollNumber: {
      type: String,
      required: true,
    },
    classroomName: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ['random', 'fair_round'],
      required: true,
    },
    roundNumber: {
      type: Number,
      default: 1,
    },
    selectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SelectionHistory = mongoose.model('SelectionHistory', selectionHistorySchema);
