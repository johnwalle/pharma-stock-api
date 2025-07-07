import { Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';

import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';

import userService from '../services/user.service';
import TokenService from '../services/token.service';
import authService from '../services/auth.service';
import { validatePasswordStrength } from '../utils/validator';
import { IUser } from '../models/user.model';

// Instantiate token service class
const tokenService = new TokenService();

// Login Controller
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await authService.login(email, password, req.ip ?? 'unknown');
  const tokens = await tokenService.generateAuthTokens(user.id);

  res.status(httpStatus.OK).json({ user, tokens });
});

// Forgot Password Controller
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await userService.getUserByEmail(email);
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'Email not found' });
  }

  await tokenService.removeToken(user._id.toString());
  const tokens = await tokenService.generateAuthTokens(user._id.toString());

  const resetToken = tokens.refresh.token;

  await authService.sendEmail(email, resetToken);

  res.status(httpStatus.OK).json({ message: 'Password reset link has been sent to your email.' });
});

// Reset Password Controller
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  const tokenDoc = await tokenService.findToken(token);
  if (!tokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invalid Token');
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; exp: number };

  const isExpired = await tokenService.tokenExpired(payload.exp);
  if (isExpired) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Token expired');
  }

  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.valid) {
    throw new ApiError(httpStatus.BAD_REQUEST, "password " + passwordCheck.errors.join(', '));
  }

  const result = await authService.passwordReset(payload.sub, password);
  if (result.modifiedCount > 0) {
    res.status(httpStatus.OK).json({ message: 'Password Reset Successfully' });
  } else {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found or password not changed');
  }
});



// refreshToken function is added to the auth controller

export const refreshToken = catchAsync(async (req, res) => {
  console.log('Refreshing token...', req.body.refreshToken);
  const tokens = await authService.refreshAuthToken(req.body.refreshToken);
  return res.status(httpStatus.OK).send({ ...tokens });
});

