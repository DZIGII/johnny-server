import bcrypt from "bcryptjs";
import type { LoginDto, RregisterDto } from "../dtos/user.dto.js";
import { User } from "../models/User.js";
import { comparePassword, hashPassword } from "../utils/password.js";

class UnauthorizedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UnauthorizedError";
    }
}

export class UserService {
    async register(data: RregisterDto) {
        const existing = await User.findOne({
            where: {
                email: data.email
            }
        });

        if (existing) throw new Error("Email already in use");

        const passwordHash = await hashPassword(data.password);
        return User.create({ ...data, passwordHash });
    }

    async login(data: LoginDto) {
        const user = await User.findOne({
            where: { email: data.email }
        });

        if (!user) throw new UnauthorizedError("Invalid credentials");

        const isValid = await comparePassword(data.password, user.passwordHash);

        if (!isValid) throw new UnauthorizedError("Invalid credentials");

        return user;
    }
}