"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    first_name: zod_1.z.string().min(2),
    last_name: zod_1.z.string().min(2),
    phone: zod_1.z.string().min(10),
    location: zod_1.z.string().optional(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    role: zod_1.z.enum(["FARMER", "BUYER", "ADMIN"])
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(2),
});
