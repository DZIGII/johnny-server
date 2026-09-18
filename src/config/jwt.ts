import type { UserRole } from "../models/User.js";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!

export interface JwtPayload {
    userId: number;
    nickname: string;
    role: UserRole
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET)
}

export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, SECRET) as JwtPayload
}