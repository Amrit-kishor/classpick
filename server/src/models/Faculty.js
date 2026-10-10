import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide faculty full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
      trim: true,
    },
    designation: {
      type: String,
      default: 'Assistant Professor',
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
facultySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
facultySchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const Faculty = mongoose.model('Faculty', facultySchema);
