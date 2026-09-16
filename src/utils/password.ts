import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 11;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    const isValid = await bcrypt.compare(password, hash)
    return isValid
}