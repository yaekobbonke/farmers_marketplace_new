import { Role } from "@prisma/client";
import { z } from "zod";

// Shared email regex (DRY principle)
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const emailErrorMessage = "Invalid email format. Please use a valid email address (e.g., user@example.com)";

export const registerSchema = z.object({
    first_name: z.string()
        .min(2, "First name must be at least 2 characters")
        .max(50, "First name must not exceed 50 characters")
        .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, apostrophes, and hyphens")
        .trim(),
    
    last_name: z.string()
        .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name must not exceed 50 characters")
        .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, apostrophes, and hyphens")
        .trim(),
    
    phone: z.string()
        .min(10, "Phone number must be at least 10 characters")
        .max(15, "Phone number must not exceed 15 characters")
        .regex(/^[0-9+\-\s()]+$/, "Phone number contains invalid characters")
        .trim(),
    
    location: z.string()
        .max(100, "Location must not exceed 100 characters")
        .optional()
        .transform(val => val?.trim()),
    
    email: z.string()
        .email("Invalid email format")
        .regex(emailRegex, emailErrorMessage)
        .toLowerCase()
        .trim(),
    
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must not exceed 100 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[^\s]+$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
        ),
    
    role: z.enum(["FARMER", "BUYER", "ADMIN"])
});

export const loginSchema = z.object({
    email: z.string()
        .email("Invalid email format")
        .regex(emailRegex, emailErrorMessage)
        .toLowerCase()
        .trim(),
    
    password: z.string()
        .min(1, "Password is required")
        .max(100, "Password too long")
});

// Optional: Schema for updating user profile
export const updateProfileSchema = z.object({
    first_name: z.string().min(2).max(50).optional(),
    last_name: z.string().min(2).max(50).optional(),
    phone: z.string().min(10).max(15).optional(),
    location: z.string().max(100).optional(),
}).strict(); // Prevents extra fields

// Optional: Schema for password change
export const changePasswordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: registerSchema.shape.password,
    confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"]
});