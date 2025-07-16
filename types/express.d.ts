import 'express';

declare module 'express' {
  export interface Request {
    user?: {
      _id: string;
      role: string;
    };
  }
}

// types/express/index.d.ts or just a `global.d.ts` file
import { IUser } from '../../models/user.model'; // adjust path to your actual user type

declare global {
  namespace Express {
    interface Request {
      currentUser?: IUser;
    }
  }
}


// types/express/index.d.ts
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      file?: Multer.File;
    }
  }
}



