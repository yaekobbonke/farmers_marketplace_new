"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const bcrypt_1 = require("../../utils/bcrypt");
const jwt_1 = require("../../utils/jwt");
class AuthService {
    static async register(input) {
        const hashed = await (0, bcrypt_1.hashPassword)(input.password);
        try {
            const user = await prisma_1.default.user.create({
                data: {
                    first_name: input.first_name,
                    last_name: input.last_name,
                    location: input.location,
                    email: input.email.toLowerCase().trim(),
                    phone: input.phone,
                    password: hashed,
                    role: input.role || "BUYER",
                },
                select: { id: true },
            });
            return { userId: user.id };
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new Error("USER_ALREADY_EXISTS");
            }
            throw error;
        }
    }
    static async login(input) {
        const user = await prisma_1.default.user.findUnique({
            where: { email: input.email.toLowerCase().trim() },
            select: {
                id: true,
                email: true, // ✅ Added
                password: true,
                role: true,
                first_name: true,
                last_name: true,
            },
        });
        if (!user) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const valid = await (0, bcrypt_1.comparePassword)(input.password, user.password);
        if (!valid) {
            throw new Error("INVALID_CREDENTIALS");
        }
        // ✅ Fixed: Use { id, email, role } to match TokenPayload
        const token = (0, jwt_1.signToken)({
            id: user.id,
            email: user.email,
            role: user.role
        });
        return {
            token,
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: user.role
            }
        };
    }
}
exports.AuthService = AuthService;
