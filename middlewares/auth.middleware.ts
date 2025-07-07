import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';

import ApiError from '../utils/ApiError';
import userService from '../services/user.service';
import { IUser } from '../models/user.model'; // Update path if needed

// 👇 Safer extension using a new field to avoid conflicts with global `req.user`
export interface AuthenticatedRequest extends Request {
  currentUser?: IUser;
}

// Middleware: Require sign-in
export const requireSignIn = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, token missing');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };

    const user = await userService.getUserById(decoded.sub);
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    req.currentUser = user;
    next();
  } catch (error: any) {
    console.error('Auth Error:', error);
    res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: error?.message || 'Unauthorized access' });
  }
};

// Middleware: Admin only
export const adminMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.currentUser;
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized user');
    }

    if (user.role !== 'admin') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Admin access denied');
    }

    next();
  } catch (err: any) {
    res.status(err.statusCode || httpStatus.UNAUTHORIZED).json({ message: err.message });
  }
};
