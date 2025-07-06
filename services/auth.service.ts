import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

import userService from './user.service';
import TokenService from './token.service';
import ApiError from '../utils/ApiError';
import tokenTypes from '../config/token';
import config from '../config/config';
import User, { IUser } from '../models/user.model';
import {
  emailIpBruteLimiter,
  slowerBruteLimiter,
  emailBruteLimiter,
} from '../middlewares/auth.limmiter';

// Instantiate token service
const tokenService = new TokenService();

// LOGIN
export const login = async (
  email: string,
  password: string,
  ipAddr: string
): Promise<Omit<IUser, 'password'>> => {
  const user = await userService.getUserByEmail(email);

  if (!user) {
    await consumeRateLimiters(email, ipAddr);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email');
  }

  if (!user.password) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User password not found');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    await consumeRateLimiters(email, ipAddr);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect password');
  }

  // Exclude password before returning
  return user;
};

// RATE LIMIT HELPERS
const consumeRateLimiters = async (email: string, ipAddr: string) => {
  try {
    await Promise.all([
      emailIpBruteLimiter.consume(`${email}_${ipAddr}`),
      slowerBruteLimiter.consume(ipAddr),
      emailBruteLimiter.consume(email),
    ]);
  } catch (rateLimiterError) {
    console.error('Rate limiter triggered:', rateLimiterError);
  }
};

// REFRESH TOKEN
export const refreshAuthToken = async (refreshToken: string) => {
  const user = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
  console.log('User from refresh token:', user);

  if (!user?._id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invalid refresh token');
  }

  await tokenService.removeToken(user._id.toString());

  return tokenService.generateAuthTokens(user._id.toString());
};

// SEND RESET EMAIL
export const sendEmail = async (
  recipientEmail: string,
  resetToken: string
) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    service: config.companyInfo.service,
    auth: {
      user: config.companyInfo.email,
      pass: config.companyInfo.pass,
    },
  });

  const mailOptions = {
    from: config.companyInfo.email,
    to: recipientEmail,
    subject: 'Pharmacy Stock - Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #f8f8f8; padding: 20px; border-radius: 8px;">
          <img src="https://your-pharmacy-logo-url.com/logo.png" 
               alt="Pharmacy Stock" style="width: 200px; height: auto; margin-bottom: 20px;">
          <h2>Password Reset</h2>
          <p>We received a request to reset your Pharmacy Stock account password.</p>
          <a href="http://localhost:3000/reset-password/${resetToken}" 
             style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007bff; 
             text-decoration: none; border-radius: 5px; margin-top: 20px;">Reset Password</a>
          <p style="margin-top: 20px;">If you didn’t request this, you can safely ignore this email.</p>
          <p>Best regards,</p>
          <p>Pharmacy Stock Team</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.response);
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send reset email');
  }
};

// RESET PASSWORD
export const passwordReset = async (
  userId: string,
  newPassword: string
): Promise<{ modifiedCount: number }> => {
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  const result = await User.updateOne(
    { _id: userId },
    { $set: { password: hashedPassword } }
  );

  return result;
};

export default {
  login,
  refreshAuthToken,
  sendEmail,
  passwordReset,
};
