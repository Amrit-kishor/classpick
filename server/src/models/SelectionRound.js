import mongoose from 'mongoose';

const selectionRoundSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      unique: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    roundNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalEligible: {
      type: Number,
      default: 0,
    },
    remainingStudentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    selectedStudentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    lastSelectedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const SelectionRound = mongoose.model('SelectionRound', selectionRoundSchema);
