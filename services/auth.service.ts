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

  function getResetEmailHTML(resetToken: string): string {
    return `
  <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">

      <div style="text-align: center; margin-bottom: 30px;">
        <img 
          src="https://example.com/logo.png" 
          alt="Pharmacy Stock Logo" 
          style="width: 120px; height: auto; border-radius: 8px;"
        />
      </div>

      <h2 style="font-size: 24px; color: #007bff; margin-bottom: 10px; text-align: center;">
        Reset Your Password
      </h2>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
        We received a request to reset your <strong>Pharmacy Stock</strong> account password. Click the button below to set a new one.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a 
          href="http://localhost:3000/auth/reset-password/${resetToken}" 
          style="display: inline-block; padding: 14px 28px; font-size: 16px; color: #ffffff; background-color: #007bff; 
                 border-radius: 6px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
        If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
      </p>

      <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;"/>

      <p style="font-size: 14px; text-align: center; color: #999;">
        Best regards,<br />
        <strong>Pharmacy Stock Team</strong><br />
        <a href="https://pharmacystock.example.com" style="color: #007bff; text-decoration: none;">pharmacystock.example.com</a>
      </p>
    </div>
  </div>
  `;
  }

  const mailOptions = {
    from: config.companyInfo.email,
    to: recipientEmail,
    subject: 'Pharmacy Stock - Password Reset',
    html: getResetEmailHTML(resetToken), // 🟢 call a function
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
