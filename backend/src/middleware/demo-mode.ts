import { Request, Response, NextFunction } from "express";

/**
 * Middleware to block write operations for demo admin users
 * Demo users can only read data, not modify it
 */
export function blockDemoWrites(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  // If user is in demo mode, block write operations
  if (user?.isDemo) {
    return res.status(403).json({
      error: "DEMO_MODE",
      message: "Write operations are not allowed in demo mode. This is a read-only session for demonstration purposes.",
    });
  }
  
  next();
}

/**
 * Middleware to completely block all access for demo admin users
 * Use this for sensitive endpoints that should never be accessed in demo mode
 */
export function blockDemoAccess(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (user?.isDemo) {
    return res.status(403).json({
      error: "DEMO_MODE",
      message: "This endpoint is not available in demo mode.",
    });
  }
  
  next();
}