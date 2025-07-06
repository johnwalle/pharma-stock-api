import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      if (err instanceof ApiError) {
        res.status(err.statusCode).json(err);
      } else {
        next(err);
      }
    });
  };
};

export default catchAsync;
