import { Request, Response, NextFunction } from 'express';
import { UserRole, Party } from '@bulkkx/shared';
import { store } from '../store/memory-store';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    party?: Party;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Extract user info from custom header or authorization
  const userId = (req.headers['x-user-id'] as string) || 'buy-001'; // Default to buyer for convenience in testing
  const userRole = (req.headers['x-user-role'] as UserRole) || 'buyer';

  const party = store.parties.get(userId);

  req.user = {
    id: userId,
    role: userRole,
    party: party,
  };

  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Role '${req.user?.role}' is not authorized. Required: ${allowedRoles.join(', ')}`,
      });
      return;
    }
    next();
  };
}
