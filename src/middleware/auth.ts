import type { NextFunction } from "express";
import type { Request, Response } from "express";
import { verifyToken, type JwtPayload } from "../config/jwt.js";
import type { UserRole } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization

    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({error: "Missing token"})
    }

    try {
        req.user = verifyToken(header.slice(7))
        next()
    }
    catch {
        return res.status(401).json({error: "Invalid token"})
    }

}

export function requireRole(...roles: UserRole[]) {
    const result = (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({error: "Forbidden"})
        }
        next()
    };

    return result
}