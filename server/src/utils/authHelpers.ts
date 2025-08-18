import { Request } from 'express';
import { IUser } from '../models/User';

// Extend Express Request type with user property
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Type guard to ensure req.user is properly typed as IUser
 * Use this in controllers to get proper TypeScript typing
 */
export function assertUser(user: any): asserts user is IUser {
  if (!user) {
    throw new Error('User not authenticated');
  }
}

/**
 * Helper function to safely get user from request
 * Returns typed IUser or throws error
 */
export function getAuthenticatedUser(req: { user?: any }): IUser {
  if (!req.user) {
    throw new Error('Authentication required');
  }
  return req.user as IUser;
}

/**
 * Helper function to safely get user from AuthenticatedRequest
 * Returns typed IUser or null
 */
export function getUserFromRequest(req: AuthenticatedRequest): IUser | null {
  return req.user || null;
}

/**
 * Type-safe way to check if user exists
 */
export function isAuthenticated(req: { user?: any }): req is { user: IUser } {
  return !!req.user;
}
