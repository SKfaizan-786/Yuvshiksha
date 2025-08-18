
import { Request, Response, NextFunction } from 'express';
import { getAuthenticatedUser } from '../utils/authHelpers';
import { IUser } from '../models/User';

// Extend Request interface locally
declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}

/**
 * Role Check Middleware - Ensures user has required role(s)
 * This middleware should be used AFTER authMiddleware
 * It checks if the authenticated user has the required role
 */
export const requireRole = (allowedRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get authenticated user using helper function
      const user = getAuthenticatedUser(req);
      // Convert single role to array for consistency
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      // Check if user's role is in allowed roles
      if (!rolesArray.includes(user.role)) {
        res.status(403).json({ 
          message: `Access denied. Required role(s): ${rolesArray.join(', ')}. Your role: ${user.role}` 
        });
        return;
      }
      // User has correct role, continue to route handler
      next();
    } catch (error) {
      res.status(401).json({ 
        message: 'Authentication required. Please login first.' 
      });
    }
  };
};

/**
 * Profile Complete Check Middleware
 * Ensures user has completed their profile setup
 */
export const requireProfileComplete = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user.profileComplete) {
      const profileSetupUrl = user.role === 'student' 
        ? '/student/profile-setup' 
        : '/teacher/profile-setup';
        
      res.status(403).json({ 
        message: 'Profile setup required',
        redirectTo: profileSetupUrl
      });
      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Authentication required' 
    });
  }
};

/**
 * Admin Only Middleware
 * For future admin functionality
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = getAuthenticatedUser(req);

    // Check if user has admin role (currently not implemented in User model)
    // This is a placeholder for future admin functionality
    res.status(403).json({ 
      message: 'Admin access not implemented yet' 
    });
    return;

    // Uncomment when admin role is added to User model:
    // if (user.role !== 'admin') {
    //   res.status(403).json({ 
    //     message: 'Admin access required' 
    //   });
    //   return;
    // }
    // next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Authentication required' 
    });
  }
};

/**
 * Self or Admin Middleware
 * Allows users to access their own data or admins to access any data
 */
export const requireSelfOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = getAuthenticatedUser(req);
    const targetUserId = req.params.userId || req.params.id;
    const isOwnData = user._id?.toString() === targetUserId;
    
    // Since admin role is not implemented yet, only allow access to own data
    if (!isOwnData) {
      res.status(403).json({ 
        message: 'Access denied. You can only access your own data.' 
      });
      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Authentication required' 
    });
  }
};
