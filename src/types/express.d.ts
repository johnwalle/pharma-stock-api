import { Multer } from "multer";
import {Iuser} from "../../models/user.model";


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
      currentUser?: Iuser;

      /**
       * Multer uploaded file
       */
      file?: Multer.File;
    }
  }
}

export {};
