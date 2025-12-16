import { Multer } from "multer";

declare global {
  namespace Express {
    interface Request {
      /**
       * Minimal JWT user payload
       */
      user?: {
        _id: string;
        role: string;
      };

      /**
       * Current authenticated user (sanitized)
       */
      currentUser?: {
        _id: string;
        fullName: string;
      };

      /**
       * Multer uploaded file
       */
      file?: Multer.File;
    }
  }
}

export {};
