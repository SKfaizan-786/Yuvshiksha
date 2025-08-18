// src/types/express/index.d.ts
import { IUser } from '../../models/User'; // Fixed import path

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // This is the correct, specific type declaration for 'user'
    }
  }
}