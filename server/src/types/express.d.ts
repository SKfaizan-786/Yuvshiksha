// Global type extensions for Express
import { IUser } from '../models/User';
import { File } from 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
  file?: Express.Multer.File;
    }
  }
}

export {};
