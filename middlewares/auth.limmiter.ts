import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMongo } from 'rate-limiter-flexible';
import mongoose from 'mongoose';

import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import config from '../config/config';

// MongoDB rate limiter options
const rateLimiterOptions = {
  storeClient: mongoose.connection,
  blockDuration: 60 * 60 * 24, // 24 hours
  dbName: 'eCommerce',
  insuranceLimiter: undefined,
};

// Instantiate individual rate limiters
const emailIpBruteLimiter = new RateLimiterMongo({
  ...rateLimiterOptions,
  points: config.rateLimiter.maxAttemptsByIpUsername,
  duration: 60 * 10, // 10 minutes
});

const slowerBruteLimiter = new RateLimiterMongo({
  ...rateLimiterOptions,
  points: config.rateLimiter.maxAttemptsPerDay,
  duration: 60 * 60 * 24, // 24 hours
});

const emailBruteLimiter = new RateLimiterMongo({
  ...rateLimiterOptions,
  points: config.rateLimiter.maxAttemptsPerEmail,
  duration: 60 * 60 * 24, // 24 hours
});

// Middleware to protect auth endpoints
const authLimiter = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || '';
    const email = (req.body?.email || '').toLowerCase();
    const emailIpKey = `${email}_${ip}`;

    try {
      const [slowerRes, emailIpRes, emailRes] = await Promise.all([
        slowerBruteLimiter.get(ip),
        emailIpBruteLimiter.get(emailIpKey),
        emailBruteLimiter.get(email),
      ]);

      let retrySeconds = 0;
      let errorMessage = 'Too many requests';

      if (slowerRes && slowerRes.consumedPoints >= config.rateLimiter.maxAttemptsPerDay) {
        retrySeconds = Math.floor(slowerRes.msBeforeNext / 1000) || 1;
        errorMessage = `Too many requests from this IP. Try again in ${retrySeconds} seconds.`;
      } else if (
        emailIpRes &&
        emailIpRes.consumedPoints >= config.rateLimiter.maxAttemptsByIpUsername
      ) {
        retrySeconds = Math.floor(emailIpRes.msBeforeNext / 1000) || 1;
        errorMessage = `Too many login attempts from this email/IP combination. Try again in ${retrySeconds} seconds.`;
      } else if (
        emailRes &&
        emailRes.consumedPoints >= config.rateLimiter.maxAttemptsPerEmail
      ) {
        retrySeconds = Math.floor(emailRes.msBeforeNext / 1000) || 1;
        errorMessage = `Too many login attempts for this email. Try again in ${retrySeconds} seconds.`;
      }

      if (retrySeconds > 0) {
        res.setHeader('Retry-After', retrySeconds.toString());
        throw new ApiError(httpStatus.TOO_MANY_REQUESTS, errorMessage);
      }

      next();
    } catch (err) {
      console.error('Rate limiter error:', err);
      next(err);
    }
  }
);

export {
  emailIpBruteLimiter,
  slowerBruteLimiter,
  emailBruteLimiter,
  authLimiter,
};
