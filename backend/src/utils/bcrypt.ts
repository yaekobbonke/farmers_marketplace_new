// ✅ Safe import with fallback for missing types
import bcrypt from "bcrypt";

export async function hashPassword(password: string): Promise<string> {
    if (!password) {
        throw new Error("Password is required");
    }
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
        return false;
    }
    return await bcrypt.compare(password, hash);
}