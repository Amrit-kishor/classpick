import jwt from 'jsonwebtoken';
import { Faculty } from '../models/Faculty.js';
import { ENV } from '../config/env.js';

// Generate token and configure HTTP-only cookie
const sendTokenResponse = (faculty, statusCode, res) => {
  const token = jwt.sign({ id: faculty._id }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        designation: faculty.designation,
        avatar: faculty.avatar,
      },
    });
};

// @desc    Register faculty
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, department, designation } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    const existingFaculty = await Faculty.findOne({ email: email.toLowerCase().trim() });
    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: 'A faculty account with this email already exists.',
      });
    }

    const faculty = await Faculty.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      department: department || 'Computer Science & Engineering',
      designation: designation || 'Assistant Professor',
    });

    sendTokenResponse(faculty, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login faculty
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const faculty = await Faculty.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!faculty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await faculty.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendTokenResponse(faculty, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout faculty / Clear cookie
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Faculty logged out successfully.',
  });
};

// @desc    Get current logged in faculty profile
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id);
    res.status(200).json({
      success: true,
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        designation: faculty.designation,
        avatar: faculty.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update faculty profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, department, designation } = req.body;
    const faculty = await Faculty.findById(req.faculty.id);

    if (name) faculty.name = name;
    if (department) faculty.department = department;
    if (designation) faculty.designation = designation;

    await faculty.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        designation: faculty.designation,
        avatar: faculty.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};
