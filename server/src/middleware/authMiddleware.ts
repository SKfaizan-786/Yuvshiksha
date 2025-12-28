import { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import mongoose from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Remove or comment out debug logs for production
    // console.log('Request Headers:', req.headers);
    // console.log('Cookies:', req.cookies);

    // FIX: For some deployments, cookie name may be 'token' or 'jwt' (check both)
    let token = req.cookies.token || req.cookies.jwt;

    if (!token) {
      // Also check for token in Authorization header (Bearer)
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    const decoded = jwt.verify(token, jwtSecret) as { _id: string; iat: number; exp: number };

    console.log('🔍 Auth Middleware - Token decoded:', {
      userId: decoded._id,
      tokenIssuedAt: new Date(decoded.iat * 1000).toISOString(),
    });

    const user = await User.findById(decoded._id).select('-password');

    console.log('🔍 Auth Middleware - User lookup result:', {
      found: !!user,
      userId: decoded._id,
    });

    if (!user) {
      console.error('❌ User not found in database for ID:', decoded._id);
      return res.status(401).json({ message: 'Token is valid but user not found' });
    }

    req.user = user;
    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token has expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    const user = await User.findById(decoded._id).select('-password');

    if (user) {
      (req as AuthenticatedRequest).user = user;
    }

    next();

  } catch (error) {
    console.log('Optional auth middleware error (non-blocking):', error);
    next();
  }
};