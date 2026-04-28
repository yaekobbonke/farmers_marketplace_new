import { Role } from "@prisma/client";
import { z } from "zod";


export const registerSchema = z.object({
    first_name: z.string().min(2),
    last_name: z.string().min(2),
    phone: z.string().min(10),
    location: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["FARMER", "BUYER", "ADMIN"])
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(2),
});