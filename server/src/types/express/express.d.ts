import { Request } from 'express';
import { IUser } from '../models/User'; // Adjust path to your IUser interface/model

// Declare the 'express-serve-static-core' module to augment its Request interface
declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser; // Add your custom 'user' property with the correct type
  }
}