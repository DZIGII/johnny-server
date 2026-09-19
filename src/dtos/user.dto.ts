import { User } from '../models/User.js'

export interface RregisterDto {
    firstName: string;
    lastName: string;
    nickname: string;
    email: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface UserDto {
    firstName: string;
    lastName: string;
    email: string;
    nickname: string;
}

export function toUserResponseDto(user: User) {
    return {
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickname,
        email: user.email
    }
}