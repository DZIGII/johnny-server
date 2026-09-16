import bcrypt from "bcryptjs";
import { toUserResponseDto, type LoginDto, type RregisterDto } from "../dtos/user.dto.js";
import { User } from "../models/User.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import crypto from 'crypto'
import { Op } from "sequelize";

export class UserService {

    async register(data: RregisterDto) {
        const existing = await User.findOne({
            where: {
                [Op.or]: [{email: data.email}, {nickname: data.nickname}]
            }
        })



        if (existing && existing.emailVerified) throw new Error("Email alredy in use")
        const passwordHash = await hashPassword(data.password)

        const verificationCode = crypto.randomInt(100000, 999999)
        const expireIn = new Date(Date.now() + 15 * 60 * 1000);

        return User.create({...data, passwordHash, verificationCode, expireIn})

    }

    async verify(email: string, code: string) {
        const user = await User.findOne({
            where: {
                email: email
            }
        })

        if (!user) throw new Error("User not found")
        
        if (user.verificationCode !== code) throw new Error("Wrong code")
        if (user.verificationExpiresAt.getTime() > Date.now()) throw new Error("Code expire")

        return user.update({emailVerified: true})
    }

    async login(data: LoginDto) {
        const user = await User.findOne({
            where: { email: data.email }
        });

        if (!user) throw new Error("Invalid credentials");
        if (user.emailVerified === false) throw new Error("Email not verifyed")

        if (user.enabled === false) throw new Error("User is disabled")

        const isValid = await comparePassword(data.password, user.passwordHash);

        if (!isValid) throw new Error("Invalid credentials");

        return toUserResponseDto(user);
    }

    async enableUser(userId: number) {
        const user = await User.findByPk(userId);
        
        if (!user) throw new Error("User not found")
        
        user.enabled = true;
        return await user.save()
    }

    async disableUser(userId: number) {
        const user = await User.findByPk(userId)

        if (!user) throw new Error("User not found")
        
        return await user.update({enable : true})
    }

    async getUserById(userId: number) {
        const user = await User.findByPk(userId)
        if (!user) throw new Error("User not found")
        
        return toUserResponseDto(user)
    }


    async filterUser(options: {query: string, sort: string, page: number, limit: number}) {
        const {query, sort, page, limit} = options

        const where: any = {};

        if (query) {
            where[Op.or] = [
                {firstName: {[Op.iLike]: `%${query}%`}},
                {lastName: {[Op.iLike]: `%${query}%`}},
                {nickname: {[Op.iLike]: `%${query}%`}}
            ]
        }

        const direction = sort ==="desc" ? "DESC" : "ASC"

        const offset = (page - 1) * limit

        const result = await User.findAndCountAll({
            where,
            order: [["firstName", direction]],
            limit,
            offset
        })

        return {
            users: result.rows.map(toUserResponseDto),
            total: result.count,
            page,
            totalPages: Math.ceil(result.count / limit)
        }
    }
}

export const userService = new UserService()