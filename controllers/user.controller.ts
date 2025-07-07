import { Request, Response } from 'express';
import User, { IUser } from '../models/user.model';
import logger from '../config/logger';
import { validatePasswordStrength } from '../utils/validator';
import {
  clearRefreshTokenCookie,
} from '../utils/cookie';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 */
export const register = catchAsync(async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
  }

  if (fullName.split(' ').length < 2) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Full name must contain first and last name');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already exists');
  }

  // Validate password strength
  const passwordValidation = await validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password " + passwordValidation.errors.join(', '));
  }

  await User.create({ fullName, email, password });
  logger.info(`🆕 User registered: ${email}`);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'User registered successfully',
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 */
export const logout = (req: Request, res: Response): void => {
  clearRefreshTokenCookie(res);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/users/:id
 * @access  Private (user themselves or Admin)
 */



export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;

  const currentUsr = req.currentUser;
  console.log("the current user is", currentUsr)

  if (currentUsr?._id.toString() !== userId && currentUsr?.role !== 'Admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own profile or you must be an admin');
  }

  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { fullName, email } = req.body;
  if (!fullName && !email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'At least one field (fullName or email) must be provided');
  }

  if (fullName && fullName.split(' ').length < 2) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Full name must contain first and last name');
  }

  if (email) {
    const existing = await User.findOne({ email });
    if (existing && existing._id.toString() !== userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use by another user');
    }
  }


  if (fullName) user.fullName = fullName;
  if (email) user.email = email;

  await user.save();
  logger.info(`✅ Updated user: ${user.email}`);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'User updated successfully',
  });
});

/**
 * @desc    Soft-delete a user
 * @route   DELETE /api/v1/users/:id
 * @access  Admin only
 */
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found or already deleted');
  }

  user.isDeleted = true;
  await user.save();

  logger.info(`🗑️ Admin deleted user: ${user.email}`);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * @desc    Admin creates a new user (pharmacist, manager, etc.)
 * @route   POST /api/v1/users
 * @access  Admin only
 */
export const createUserByAdmin = catchAsync(async (req: Request, res: Response) => {

  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password || !role) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
  }

  if (fullName.split(' ').length < 2) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Full name must contain first and last name');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User with this email already exists');
  }

  // Validate password strength
  const passwordValidation = await validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password " + passwordValidation.errors.join(', '));
  }


  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    fullName,
    email,
    password: hashedPassword,
    role,
  });

  logger.info(`👤 Admin created new user: ${email} (${role})`);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'User created successfully',
  });
});
